const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4003),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/cinema_booking",
  seatServiceBaseUrl: process.env.SEAT_SERVICE_BASE_URL || "http://localhost:4001",
  paymentServiceBaseUrl:
    process.env.PAYMENT_SERVICE_BASE_URL || "http://localhost:4004",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
};
