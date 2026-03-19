import crypto from "crypto";
import Razorpay from "razorpay";
import { z } from "zod";

import { env } from "../config/env.js";
import { Payment } from "../models/Payment.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function getClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
}

const createOrderSchema = z.object({
  plan: z.enum(["premium_month", "premium_year"]).default("premium_month")
});

function planToAmount(plan) {
  if (plan === "premium_year") return 19900; // INR paise
  return 1990;
}

function planToDays(plan) {
  if (plan === "premium_year") return 365;
  return 30;
}

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const client = getClient();
  if (!client) return res.status(501).json({ error: "RAZORPAY_NOT_CONFIGURED" });

  const { plan } = createOrderSchema.parse(req.body);
  const amount = planToAmount(plan);

  const order = await client.orders.create({
    amount,
    currency: "INR",
    receipt: `qp_${String(req.user._id)}_${Date.now()}`,
    notes: { userId: String(req.user._id), plan }
  });

  await Payment.create({
    userId: req.user._id,
    provider: "razorpay",
    plan,
    amount,
    currency: "INR",
    razorpayOrderId: order.id,
    status: "created"
  });

  res.json({
    keyId: env.RAZORPAY_KEY_ID,
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency
    },
    plan
  });
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(5),
  razorpay_payment_id: z.string().min(5),
  razorpay_signature: z.string().min(5)
});

export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  if (!env.RAZORPAY_KEY_SECRET) return res.status(501).json({ error: "RAZORPAY_NOT_CONFIGURED" });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = verifySchema.parse(req.body);

  const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(payload).digest("hex");

  if (expected !== razorpay_signature) return res.status(400).json({ error: "INVALID_SIGNATURE" });

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user._id });
  if (!payment) return res.status(404).json({ error: "ORDER_NOT_FOUND" });

  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.status = "paid";
  await payment.save();

  const days = planToDays(payment.plan);
  const now = new Date();
  const base = req.user.premiumUntil && new Date(req.user.premiumUntil).getTime() > now.getTime() ? new Date(req.user.premiumUntil) : now;
  const premiumUntil = new Date(base);
  premiumUntil.setDate(premiumUntil.getDate() + days);

  await User.updateOne({ _id: req.user._id }, { $set: { premiumUntil } });

  res.json({ ok: true, premiumUntil });
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return res.status(501).json({ error: "WEBHOOK_NOT_CONFIGURED" });

  const signature = req.headers["x-razorpay-signature"];
  if (!signature || typeof signature !== "string") return res.status(400).json({ error: "MISSING_SIGNATURE" });

  const raw = req.body;
  const body = Buffer.isBuffer(raw) ? raw.toString("utf8") : JSON.stringify(raw);
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
  if (expected !== signature) return res.status(400).json({ error: "INVALID_SIGNATURE" });

  // For demo: acknowledge.
  res.json({ ok: true });
});