const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { createPaymentRouter } = require("./modules/payment/payment.controller");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/payments", createPaymentRouter({ env }));

app.listen(env.port, () => {
  console.log(`payment service running on ${env.port}`);
});
