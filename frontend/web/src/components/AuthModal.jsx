import { useState } from "react";
import axios from "axios";

function setAuthSession(user, accessToken, refreshToken) {
  try {
    localStorage.setItem("cinema_user", JSON.stringify(user));
    localStorage.setItem("cinema_access_token", accessToken);
    if (refreshToken) localStorage.setItem("cinema_refresh_token", refreshToken);
  } catch (_e) {
    // ignore storage errors
  }
}

const defaultForm = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
};

export function AuthModal({ onClose, onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFieldChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password,
            };

      const url = mode === "register" ? "http://localhost:4003/api/auth/register" : "http://localhost:4003/api/auth/login";
      const response = await axios.post(url, payload);
      const data = response.data;
      // data: { user, accessToken, refreshToken }
      setAuthSession(data.user, data.accessToken, data.refreshToken);
      onAuthSuccess(data.user);
    } catch (apiError) {
      const message = apiError.response?.data?.error || "Authentication failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose}>
          x
        </button>

        <p className="section-kicker">WELCOME</p>
        <h2>{mode === "login" ? "Sign in" : "Create account"}</h2>

        <div className="auth-toggle">
          <button
            type="button"
            className={mode === "login" ? "auth-toggle-btn active" : "auth-toggle-btn"}
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            type="button"
            className={mode === "register" ? "auth-toggle-btn active" : "auth-toggle-btn"}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleFieldChange}
                placeholder="Nguyen Van A"
                required
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleFieldChange}
              placeholder="you@example.com"
              required
            />
          </label>

          {mode === "register" ? (
            <label className="auth-field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleFieldChange}
                placeholder="0912 345 678"
              />
            </label>
          ) : null}

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleFieldChange}
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}

          <button type="submit" className="primary-btn auth-submit" disabled={submitting}>
            {submitting ? "Processing..." : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
