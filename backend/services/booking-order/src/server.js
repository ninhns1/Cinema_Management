const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const env = require("./config/env");
const { createBookingRouter } = require("./modules/booking/booking.controller");

async function start() {
  await mongoose.connect(env.mongoUri);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/bookings", createBookingRouter(env));

  app.listen(env.port, () => {
    console.log(`booking-order running on ${env.port}`);
  });
}

start().catch((error) => {
  console.error("booking-order failed to start:", error);
  process.exit(1);
});
