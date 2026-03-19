import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 80, default: "Admin" },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true }
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);