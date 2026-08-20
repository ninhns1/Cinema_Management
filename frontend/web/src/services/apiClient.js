import axios from "axios";

function createClient(config) {
  const client = axios.create(config);
  client.interceptors.request.use((request) => {
    const token = localStorage.getItem("cinema-token");
    if (token) request.headers.Authorization = `Bearer ${token}`;
    return request;
  });
  return client;
}

export const seatApi = createClient({
  baseURL: "http://localhost:4001/api/seats",
});

export const bookingApi = createClient({
  baseURL: "http://localhost:4003/api/bookings",
});

export const catalogApi = createClient({
  baseURL: "http://localhost:4006/api/catalog",
});

export const authApi = createClient({
  baseURL: "http://localhost:4007/api/auth",
});
