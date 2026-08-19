import { io } from "socket.io-client";

export const seatSocket = io("http://localhost:4001", {
  autoConnect: true,
});
