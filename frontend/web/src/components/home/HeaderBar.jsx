export function HeaderBar({ currentPage, onNavigateHome, onNavigateTickets }) {
  return (
    <header className="header-bar">
      <button type="button" className="brand brand-btn" onClick={onNavigateHome}>
        Hahaha
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
        <button className="text-button">Sign in</button>
      </div>
    </header>
  );
}
