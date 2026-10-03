import { io } from "socket.io-client";

const seatSocketUrl =
  import.meta.env.VITE_SEAT_SOCKET_URL || "http://localhost:4001";

export const seatSocket = io(seatSocketUrl, {
  autoConnect: true,
});
