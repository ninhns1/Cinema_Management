const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const { createSalesRouter } = require("./modules/sales/sales.controller");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/sales", createSalesRouter(env));

app.listen(env.port, () => {
  console.log(`pos-sales running on ${env.port}`);
});
