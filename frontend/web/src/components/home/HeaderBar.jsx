export function HeaderBar({ currentPage, onNavigateHome, onNavigateTickets, onNavigateAdmin, user, onSignIn, onSignOut }) {
  return (
    <header className="header-bar">
      <button type="button" className="brand brand-btn" onClick={onNavigateHome}>
        Kac
      </button>
      <div className="search-wrap">
        <input className="search-input" placeholder="Tìm phim" />
      </div>
      <div className="header-right">
        <button
          type="button"
          className={`nav-link ${currentPage === "home" ? "active" : ""}`}
          onClick={onNavigateHome}
        >
          Trang chủ
        </button>
        <button
          type="button"
          className={`nav-link ${currentPage === "tickets" ? "active" : ""}`}
          onClick={onNavigateTickets}
        >
          Vé của tôi
        </button>
        {user?.role === "ADMIN" ? (
          <button
            type="button"
            className={`nav-link ${currentPage === "admin" ? "active" : ""}`}
            onClick={onNavigateAdmin}
          >
            Quản trị
          </button>
        ) : null}
        {user ? (
          <>
            <span className="user-label">{user.name}</span>
            <button className="text-button" onClick={onSignOut}>Đăng xuất</button>
          </>
        ) : (
          <button className="text-button" onClick={onSignIn}>Đăng nhập</button>
        )}
      </div>
    </header>
  );
}
