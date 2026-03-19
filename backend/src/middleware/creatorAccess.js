import { env } from "../config/env.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { Admin } from "../models/Admin.js";
import { User } from "../models/User.js";

export async function requireCreatorAccess(req, res, next) {
  try {
    const adminToken = req.cookies?.[env.ADMIN_COOKIE_NAME];
    if (adminToken && env.ADMIN_JWT_SECRET) {
      try {
        const adminPayload = verifyAccessToken(adminToken, { secret: env.ADMIN_JWT_SECRET });
        const admin = await Admin.findById(adminPayload.sub).lean();
        if (admin) {
          req.admin = admin;
          return next();
        }
      } catch {
        // fall through to user auth
      }
    }

    const userToken = req.cookies?.[env.AUTH_COOKIE_NAME];
    if (!userToken) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const userPayload = verifyAccessToken(userToken, { secret: env.AUTH_JWT_SECRET });
    const user = await User.findById(userPayload.sub).lean({ virtuals: true });
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes("creator")) return res.status(403).json({ error: "FORBIDDEN" });

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }
}