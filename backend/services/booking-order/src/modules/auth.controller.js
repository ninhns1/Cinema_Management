const express = require("express");
const User = require("./user.model");
const { registerUser, loginUser, refreshTokens, revokeRefreshToken, sanitizeUser, verifyToken } = require("./auth.service");

function createAuthRouter() {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      console.log("[POST /register] Request body:", req.body);
      const payload = await registerUser(req.body || {});
      console.log("[POST /register] Success, returning:", { userId: payload.user.id, email: payload.user.email });
      res.status(201).json(payload);
    } catch (error) {
      console.log("[POST /register] Error:", error.message, error.statusCode);
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || "Registration failed." });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const payload = await loginUser(req.body || {});
      res.json(payload);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ error: error.message || "Login failed." });
    }
  });

  router.post("/refresh", async (req, res) => {
    try {
      const { refreshToken } = req.body || {};
      const payload = await refreshTokens({ refreshToken });
      res.json(payload);
    } catch (error) {
      const status = error.statusCode || 401;
      res.status(status).json({ error: error.message || "Refresh failed." });
    }
  });

  router.post("/logout", async (req, res) => {
    try {
      const { refreshToken } = req.body || {};
      await revokeRefreshToken(refreshToken);
      res.json({ ok: true });
    } catch (_err) {
      res.json({ ok: true });
    }
  });

  router.get("/me", async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized." });
    }

    try {
      const payload = verifyToken(token);
      const user = await User.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: "User not found." });
      }
      res.json({ user: sanitizeUser(user) });
    } catch (_error) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }
  });

  // Root GET to help discovery (useful when visiting /api/auth in a browser)
  router.get("/", (_req, res) => {
    res.json({
      ok: true,
      available: [
        { method: "POST", path: "/register", description: "Register a new user" },
        { method: "POST", path: "/login", description: "Login with email & password" },
        { method: "POST", path: "/refresh", description: "Refresh access token" },
        { method: "POST", path: "/logout", description: "Logout / revoke refresh token" },
        { method: "GET", path: "/me", description: "Get current authenticated user" }
      ]
    });
  });

  return router;
}

module.exports = { createAuthRouter };
