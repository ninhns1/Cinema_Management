const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("./config/env");
const { createCatalogRouter } = require("./modules/catalog/catalog.controller");
const { seedCatalog } = require("./modules/catalog/catalog.seed");
const { seedShowtimes } = require("./modules/catalog/showtime.seed");

async function start() {
  await mongoose.connect(env.mongoUri);
  await seedCatalog();
  await seedShowtimes();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/catalog", createCatalogRouter(env));

  app.listen(env.port, () => {
    console.log(`catalog service running on ${env.port}`);
  });
}

start().catch((error) => {
  console.error("catalog service failed to start:", error);
  process.exit(1);
});