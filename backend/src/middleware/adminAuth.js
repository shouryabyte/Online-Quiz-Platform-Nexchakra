import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { Admin } from "../models/Admin.js";

export async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies?.[env.ADMIN_COOKIE_NAME];
    if (!token) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const payload = verifyAccessToken(token, { secret: env.ADMIN_JWT_SECRET });
    const admin = await Admin.findById(payload.sub).lean();
    if (!admin) return res.status(401).json({ error: "UNAUTHENTICATED" });

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}