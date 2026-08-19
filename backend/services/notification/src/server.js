const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const {
  createNotificationRouter,
} = require("./modules/notification/notification.controller");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/notifications", createNotificationRouter());

app.listen(env.port, () => {
  console.log(`notification service running on ${env.port}`);
});
