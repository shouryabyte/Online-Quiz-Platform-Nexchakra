import { z } from "zod";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

function publicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    provider: user.provider,
    roles: user.roles || ["user"],

    xp: user.xp,
    level: user.level,
    streak: user.streak,
    accuracy: user.accuracy,
    quizzesTaken: user.quizzesTaken,

    badges: user.badges || [],
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil
  };
}

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(72)
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);

  const existing = await User.findOne({ email }).lean();
  if (existing) return res.status(409).json({ error: "EMAIL_IN_USE" });

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, provider: "local" });
  const token = signAccessToken(
    { userId: String(user._id) },
    { secret: env.AUTH_JWT_SECRET, expiresIn: env.AUTH_JWT_EXPIRES_IN }
  );
  setAuthCookie(res, token);
  res.status(201).json({ user: publicUser(user.toObject({ virtuals: true })) });
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((e) => e.toLowerCase()),
  password: z.string().min(1).max(72)
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email, provider: "local" });
  if (!user || !user.passwordHash) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  const token = signAccessToken(
    { userId: String(user._id) },
    { secret: env.AUTH_JWT_SECRET, expiresIn: env.AUTH_JWT_EXPIRES_IN }
  );
  setAuthCookie(res, token);
  res.json({ user: publicUser(user.toObject({ virtuals: true })) });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});