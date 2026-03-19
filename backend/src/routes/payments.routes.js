import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { createRazorpayOrder, razorpayWebhook, verifyRazorpayPayment } from "../controllers/payments.controller.js";

export const paymentsRouter = express.Router();

paymentsRouter.post("/razorpay/order", requireAuth, createRazorpayOrder);
paymentsRouter.post("/razorpay/verify", requireAuth, verifyRazorpayPayment);

// Razorpay needs raw body for signature verification
paymentsRouter.post("/razorpay/webhook", express.raw({ type: "application/json" }), razorpayWebhook);