export function HeaderBar({
  currentPage,
  authUser,
  onNavigateHome,
  onNavigateTickets,
  onOpenAuth,
  onLogout,
}) {
  return (
    <header className="header-bar">
      <button type="button" className="brand brand-btn" onClick={onNavigateHome}>
        CineMax
      </button>
      <div className="search-wrap">
        <input className="search-input" placeholder="Search movies" />
      </div>
      <div className="header-right">
        <button
          type="button"
          className={`nav-link ${currentPage === "home" ? "active" : ""}`}
          onClick={onNavigateHome}
        >
          Home
        </button>
        <button
          type="button"
          className={`nav-link ${currentPage === "tickets" ? "active" : ""}`}
          onClick={onNavigateTickets}
        >
          My tickets
        </button>

        {authUser ? (
          <>
            <span className="header-user">Hi, {authUser.fullName?.split(" ")[0] || "User"}</span>
            {authUser.role === "ADMIN" ? (
              <button type="button" className="text-button" onClick={() => onNavigateHome("admin")}>
                Admin
              </button>
            ) : null}
            <button type="button" className="text-button" onClick={onLogout}>
              Sign out
            </button>
          </>
        ) : (
          <button type="button" className="text-button" onClick={onOpenAuth}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
