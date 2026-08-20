const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("./config/env");
const { createAuthRouter } = require("./modules/auth/auth.controller");
const { ensureAdmin } = require("./modules/auth/auth.service");

async function start() {
  await mongoose.connect(env.mongoUri);
  await ensureAdmin(env);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", createAuthRouter(env));

  app.listen(env.port, () => {
    console.log(`auth service running on ${env.port}`);
  });
}

start().catch((error) => {
  console.error("auth service failed to start:", error);
  process.exit(1);
});