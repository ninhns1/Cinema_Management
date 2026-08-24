import { useEffect, useState } from "react";
import { authApi, getAccessToken, setAuthSession } from "../../services/apiClientFixed";

function getInitials(name) {
  return (name || "U")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      image.onload = () => {
        const scale = Math.min(1, 320 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/webp", 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfilePage({ user, onUserUpdated, onNavigateTickets }) {
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  async function changeAvatar(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Vui lòng chọn một tệp hình ảnh.");
      return;
    }

    setAvatarError("");
    setAvatarLoading(true);
    try {
      const avatarUrl = await resizeImage(file);
      const response = await authApi.patch("/me/avatar", { avatarUrl });
      setAuthSession(response.data.user, response.data.accessToken || getAccessToken());
      setProfile(response.data.user);
      onUserUpdated?.(response.data.user);
    } catch (_error) {
      setAvatarError("Không thể cập nhật ảnh đại diện. Vui lòng thử lại.");
    } finally {
      setAvatarLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const response = await authApi.get("/me");
        if (!mounted) return;
        setProfile(response.data.user);
        onUserUpdated?.(response.data.user);
      } catch (_error) {
        if (mounted) setError("Không thể tải thông tin tài khoản.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [onUserUpdated]);

  const currentUser = profile || user;

  function updatePasswordField(event) {
    setPasswordForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await authApi.post("/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setAuthSession(response.data.user, response.data.accessToken);
      setProfile(response.data.user);
      onUserUpdated?.(response.data.user);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess("Đổi mật khẩu thành công.");
    } catch (apiError) {
      const code = apiError.response?.data?.error;
      const messages = {
        CURRENT_PASSWORD_INVALID: "Mật khẩu hiện tại không đúng.",
        PASSWORD_TOO_SHORT: "Mật khẩu mới phải có ít nhất 8 ký tự.",
        PASSWORD_MUST_CHANGE: "Mật khẩu mới phải khác mật khẩu hiện tại.",
        PASSWORD_FIELDS_REQUIRED: "Vui lòng điền đầy đủ thông tin.",
      };
      setPasswordError(messages[code] || "Không thể đổi mật khẩu. Vui lòng thử lại.");
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <section className="profile-page">
      <div className="profile-heading">
        <div>
          <p className="section-kicker">TÀI KHOẢN</p>
          <h1>Hồ sơ của tôi</h1>
          <p className="muted">Quản lý thông tin đăng nhập và hoạt động xem phim của bạn.</p>
        </div>
        <button type="button" className="slot-btn" onClick={onNavigateTickets}>
          Vé của tôi
        </button>
      </div>

      {loading ? <p className="muted">Đang tải thông tin...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {currentUser ? (
        <div className="profile-layout">
          <section className="profile-identity">
            <div className="profile-avatar">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={`Ảnh đại diện của ${currentUser.name || currentUser.fullName}`} />
              ) : (
                getInitials(currentUser.name || currentUser.fullName)
              )}
            </div>
            <label className="avatar-upload-btn">
              {avatarLoading ? "Đang tải..." : "Thay đổi ảnh đại diện"}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={changeAvatar} disabled={avatarLoading} />
            </label>
            {avatarError ? <p className="error-text">{avatarError}</p> : null}
            <h2>{currentUser.name || currentUser.fullName}</h2>
            <p className="muted">{currentUser.email}</p>
            <span className="profile-role">{currentUser.role === "ADMIN" ? "Administrator" : "Customer"}</span>
          </section>

          <section className="profile-details">
            <div className="profile-section-heading">
              <div>
                <p className="section-kicker">THÔNG TIN CƠ BẢN</p>
                <h2>Thông tin tài khoản</h2>
              </div>
              <span className="profile-status">Đang hoạt động</span>
            </div>
            <div className="profile-fields">
              <div className="profile-field">
                <span>Họ và tên</span>
                <strong>{currentUser.fullName}</strong>
              </div>
              <div className="profile-field">
                <span>Email</span>
                <strong>{currentUser.email}</strong>
              </div>
              <div className="profile-field">
                <span>Mã người dùng</span>
                <strong className="profile-id">{currentUser.id}</strong>
              </div>
              <div className="profile-field">
                <span>Bảo mật</span>
                <strong>Password protected</strong>
              </div>
            </div>
            <form className="password-form" onSubmit={changePassword}>
              <div className="profile-section-heading password-heading">
                <div>
                  <p className="section-kicker">BẢO MẬT</p>
                  <h2>Đổi mật khẩu</h2>
                </div>
              </div>
              <div className="password-fields">
                <label className="profile-input">
                  <span>Mật khẩu hiện tại</span>
                  <input
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={updatePasswordField}
                    autoComplete="current-password"
                    required
                  />
                </label>
                <label className="profile-input">
                  <span>Mật khẩu mới</span>
                  <input
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={updatePasswordField}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </label>
                <label className="profile-input">
                  <span>Xác nhận mật khẩu mới</span>
                  <input
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={updatePasswordField}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>
              {passwordError ? <p className="error-text">{passwordError}</p> : null}
              {passwordSuccess ? <p className="profile-success">{passwordSuccess}</p> : null}
              <button type="submit" className="primary-btn password-submit" disabled={passwordLoading}>
                {passwordLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}
