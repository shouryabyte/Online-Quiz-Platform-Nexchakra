import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["razorpay"], default: "razorpay", index: true },

    plan: { type: String, default: "premium_month" },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },

    razorpayOrderId: { type: String, default: "", index: true },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },

    status: { type: String, enum: ["created", "paid", "failed"], default: "created", index: true }
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model("Payment", paymentSchema);