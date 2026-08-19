const express = require("express");

function createNotificationRouter() {
  const router = express.Router();

  router.post("/send", (req, res) => {
    const { channel, to, title, content } = req.body;

    res.status(201).json({
      status: "QUEUED",
      channel,
      to,
      title,
      content,
    });
  });

  return router;
}

module.exports = { createNotificationRouter };
