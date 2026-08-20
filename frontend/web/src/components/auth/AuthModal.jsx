import { useState } from "react";
import { authApi } from "../../services/apiClient";

export function AuthModal({ onClose, onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await authApi.post(`/${mode === "login" ? "login" : "register"}`, form);
      onAuthenticated(response.data);
      onClose();
    } catch (apiError) {
      setError(apiError.response?.data?.error || "Xác thực thất bại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <form className="auth-modal" onSubmit={submit} onClick={(event) => event.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose}>x</button>
        <p className="section-kicker">TÀI KHOẢN</p>
        <h2>{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</h2>

        {mode === "register" ? (
          <input name="name" placeholder="Họ và tên" value={form.name} onChange={updateField} required />
        ) : null}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={updateField} required />
        <input
          name="password"
          type="password"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          value={form.password}
          onChange={updateField}
          minLength={8}
          required
        />

        {error ? <p className="error-text">{error}</p> : null}
        <button className="primary-btn auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Đang xử lý..." : mode === "login" ? "Đăng nhập" : "Đăng ký"}
        </button>
        <button
          type="button"
          className="text-button auth-switch"
          onClick={() => {
            setMode((current) => (current === "login" ? "register" : "login"));
            setError("");
          }}
        >
          {mode === "login" ? "Tạo tài khoản mới" : "Đã có tài khoản? Đăng nhập"}
        </button>
      </form>
    </div>
  );
}