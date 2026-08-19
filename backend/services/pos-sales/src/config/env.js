const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: Number(process.env.PORT || 4002),
  seatServiceBaseUrl: process.env.SEAT_SERVICE_BASE_URL || "http://localhost:4001",
};
