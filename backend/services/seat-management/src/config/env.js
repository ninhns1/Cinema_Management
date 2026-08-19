const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4001),
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/cinema_seat_management",
  redisUri: process.env.REDIS_URI || "redis://localhost:6379",
  seatHoldMinutes: Number(process.env.SEAT_HOLD_MINUTES || 10),
  lockTtlMs: Number(process.env.LOCK_TTL_MS || 10_000),
};
