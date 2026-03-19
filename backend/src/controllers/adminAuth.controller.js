import { z } from "zod";
import { env } from "../config/env.js";
import { Admin } from "../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAdminAuthCookie, setAdminAuthCookie } from "../utils/adminAuthCookie.js";
import { verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

function publicAdmin(admin) {
  return {
    id: String(admin._id),
    name: admin.name,
    email: admin.email
  };
}

const loginSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(72)
});

export const adminLogin = asyncHandler(async (req, res) => {
  if (!env.ADMIN_JWT_SECRET) return res.status(501).json({ error: "ADMIN_AUTH_NOT_CONFIGURED" });

  const { email, password } = loginSchema.parse(req.body);

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const token = signAccessToken(
    { userId: String(admin._id) },
    { secret: env.ADMIN_JWT_SECRET, expiresIn: env.ADMIN_JWT_EXPIRES_IN }
  );
  setAdminAuthCookie(res, token);
  res.json({ admin: publicAdmin(admin.toObject ? admin.toObject() : admin) });
});

export const adminMe = asyncHandler(async (req, res) => {
  res.json({ admin: publicAdmin(req.admin) });
});

export const adminLogout = asyncHandler(async (_req, res) => {
  clearAdminAuthCookie(res);
  res.status(204).end();
});