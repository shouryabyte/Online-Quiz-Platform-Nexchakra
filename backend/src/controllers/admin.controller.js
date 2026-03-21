import mongoose from "mongoose";
import { z } from "zod";

import { User } from "../models/User.js";
import { QuizAttempt } from "../models/QuizAttempt.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = z.object({ id: z.string().min(1) }).parse(req.params);
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: "NOT_FOUND" });

  const user = await User.findById(id).select({ roles: 1 }).lean();
  if (!user) return res.status(404).json({ error: "NOT_FOUND" });

  // Never allow deleting admin users from the player leaderboard/user table.
  if (Array.isArray(user.roles) && user.roles.includes("admin")) {
    return res.status(403).json({ error: "CANNOT_DELETE_ADMIN_USER" });
  }

  await QuizAttempt.deleteMany({ userId: id });
  await User.deleteOne({ _id: id });

  return res.json({ ok: true });
});