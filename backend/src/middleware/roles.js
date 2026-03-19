export function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    const userRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    if (roles.some((r) => userRoles.includes(r))) return next();
    return res.status(403).json({ error: "FORBIDDEN" });
  };
}