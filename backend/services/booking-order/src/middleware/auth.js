const jwt = require("jsonwebtoken");

function requireAuth(env) {
  return (req, res, next) => {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({ error: "TOKEN_REQUIRED" });
    }

    try {
      req.user = jwt.verify(authorization.slice(7), env.jwtSecret);
      return next();
    } catch (_error) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
  };
}

function requireAdmin(env) {
  return (req, res, next) => {
    if (req.user?.role !== "ADMIN") return res.status(403).json({ error: "ADMIN_REQUIRED" });
    return next();
  };
}

module.exports = { requireAuth, requireAdmin };