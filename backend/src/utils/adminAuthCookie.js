import { env } from "../config/env.js";

export function setAdminAuthCookie(res, token) {
  res.cookie(env.ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export function clearAdminAuthCookie(res) {
  res.clearCookie(env.ADMIN_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production"
  });
}