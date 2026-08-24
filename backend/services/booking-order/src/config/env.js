const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4003),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/cinema_booking",
  seatServiceBaseUrl: process.env.SEAT_SERVICE_BASE_URL || "http://localhost:4001",
  paymentServiceBaseUrl:
    process.env.PAYMENT_SERVICE_BASE_URL || "http://localhost:4004",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS || 7),
  adminRegistrationSecret: process.env.ADMIN_REG_SECRET || "",
};
