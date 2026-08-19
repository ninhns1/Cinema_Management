import axios from "axios";

export const seatApi = axios.create({
  baseURL: "http://localhost:4001/api/seats",
});

export const bookingApi = axios.create({
  baseURL: "http://localhost:4003/api/bookings",
});
