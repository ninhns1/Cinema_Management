const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4007),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/cinema_auth",
  jwtSecret: process.env.JWT_SECRET || "development-only-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  adminEmail: process.env.ADMIN_EMAIL || "",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  adminName: process.env.ADMIN_NAME || "Cinema Admin",
};