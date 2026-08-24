const express = require("express");
const { register, login, verifyToken, updateAvatar } = require("./auth.service");

function createAuthRouter(env) {
  const router = express.Router();

  router.post("/register", async (req, res) => {
    try {
      const result = await register({ ...req.body, env });
      res.status(201).json(result);
    } catch (error) {
      const status = error.message === "EMAIL_ALREADY_REGISTERED" ? 409 : 400;
      res.status(status).json({ error: error.message });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const result = await login({ ...req.body, env });
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  router.get("/me", (req, res) => {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return res.status(401).json({ error: "TOKEN_REQUIRED" });

    try {
      const user = verifyToken(token, env);
      return res.json({ user });
    } catch (_error) {
      return res.status(401).json({ error: "INVALID_TOKEN" });
    }
  });

  router.patch("/me/avatar", async (req, res) => {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return res.status(401).json({ error: "TOKEN_REQUIRED" });

    try {
      const result = await updateAvatar({ token, avatarUrl: req.body.avatarUrl, env });
      return res.json(result);
    } catch (error) {
      const status = ["TOKEN_INVALID", "USER_NOT_FOUND"].includes(error.message) ? 401 : 400;
      return res.status(status).json({ error: error.message });
    }
  });

  return router;
}

module.exports = { createAuthRouter };