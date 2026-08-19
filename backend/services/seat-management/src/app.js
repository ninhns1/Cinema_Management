const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Seat = require("./modules/seat/seat.model");
const { createSeatRouter } = require("./modules/seat/seat.controller");
const { RealtimePublisher } = require("./modules/realtime/realtime.publisher");

function buildApp({ env, redis }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    socket.on("seat-room:join", (showtimeId) => {
      socket.join(showtimeId);
    });
  });

  const realtimePublisher = new RealtimePublisher(io, redis.pubClient, redis.subClient);

  const ctx = { env, redis, Seat, realtimePublisher };

  app.use("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/seats", createSeatRouter(ctx));

  return { app, server, realtimePublisher };
}

module.exports = { buildApp };
