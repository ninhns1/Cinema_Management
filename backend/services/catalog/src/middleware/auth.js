const jwt = require("jsonwebtoken");

function readToken(req, env) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authorization.slice(7), env.jwtSecret);
  } catch (_error) {
    return null;
  }
}

function requireAdmin(env) {
  return (req, res, next) => {
    const user = readToken(req, env);
    if (!user) return res.status(401).json({ error: "INVALID_TOKEN" });
    if (user.role !== "ADMIN") return res.status(403).json({ error: "ADMIN_REQUIRED" });
    req.user = user;
    return next();
  };
}

module.exports = { requireAdmin };