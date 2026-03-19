import express from "express";

import { requireAuth } from "../middleware/auth.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payments.controller.js";

export const paymentsRouter = express.Router();

paymentsRouter.post("/razorpay/order", requireAuth, createRazorpayOrder);
paymentsRouter.post("/razorpay/verify", requireAuth, verifyRazorpayPayment);