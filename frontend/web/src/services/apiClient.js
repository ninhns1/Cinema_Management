import axios from "axios";

const AUTH_TOKEN_KEY = "cinema_access_token";
const USER_STORAGE_KEY = "cinema_user";
const REFRESH_TOKEN_KEY = "cinema_refresh_token";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function getAccessToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
}

export function setAuthSession(user, accessToken, refreshToken) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearAuthSession() {
  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const authApi = axios.create({
  baseURL: "http://localhost:4003/api/auth",
});

export const seatApi = axios.create({
  baseURL: "http://localhost:4001/api/seats",
});

export const bookingApi = axios.create({
  baseURL: "http://localhost:4003/api/bookings",
});

export const catalogApi = axios.create({
  baseURL: "http://localhost:4006/api/catalog",
});

catalogApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

// Attach access token
bookingApi.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (!token) return config;

  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
  };

  return config;
});

// On 401 try to refresh once
let isRefreshing = false;
let refreshPromise = null;

bookingApi.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (!original || original._retry) return Promise.reject(err);

    if (err.response && err.response.status === 401) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return Promise.reject(err);

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = authApi
          .post("/refresh", { refreshToken })
          .then((r) => {
            const data = r.data;
            setAuthSession(data.user, data.accessToken, data.refreshToken);
            isRefreshing = false;
            refreshPromise = null;
            return data;
          })
          .catch((e) => {
            isRefreshing = false;
            refreshPromise = null;
            clearAuthSession();
            throw e;
          });
      }

      try {
        const data = await refreshPromise;
        original._retry = true;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return bookingApi(original);
      } catch (e) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(err);
  }
);
