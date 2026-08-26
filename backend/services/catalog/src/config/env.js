const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4006),
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/cinema_catalog",
  jwtSecret: process.env.JWT_SECRET || "cinema-dev-secret",
};