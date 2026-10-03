const dotenv = require("dotenv");

dotenv.config();

const mongoUri =
  process.env.MONGO_URI ||
  (process.env.NODE_ENV === "production"
    ? ""
    : "mongodb://localhost:27017/cinema_catalog");

if (!mongoUri) {
  throw new Error("MONGO_URI must be configured in production");
}

module.exports = {
  port: Number(process.env.PORT || 4006),
  mongoUri,
  jwtSecret: process.env.JWT_SECRET || "cinema-dev-secret",
};