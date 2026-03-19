import { env } from "../config/env.js";

function cookieOptions() {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}

export function setAuthCookie(res, token) {
  res.cookie(env.AUTH_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res) {
  const opts = cookieOptions();
  res.clearCookie(env.AUTH_COOKIE_NAME, {
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path
  });
}