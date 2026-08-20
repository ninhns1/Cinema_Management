import { useEffect, useState } from "react";
import { catalogApi } from "../../services/apiClient";
import { HeaderBar } from "../../components/home/HeaderBar";
import { HeroBanner } from "../../components/home/HeroBanner";
import { PopularMoviesSection } from "../../components/home/PopularMoviesSection";
import { ExploreEventsSection } from "../../components/home/ExploreEventsSection";
import { BookingModal } from "../../components/checkout/BookingModal";
import { MyTicketsPage } from "./MyTicketsPage";
import { AuthModal } from "../../components/auth/AuthModal";
import { AdminDashboardPage } from "../admin/AdminDashboardPage";

export function CustomerHomePage() {
  const [currentPage, setCurrentPage] = useState("home");
  const [movieForBooking, setMovieForBooking] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [movies, setMovies] = useState([]);
  const [events, setEvents] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cinema-user")) || null;
    } catch (_error) {
      return null;
    }
  });
  const [authOpen, setAuthOpen] = useState(false);

  const userId = user?.userId;

  function handleBookNow(movie) {
    if (!userId) {
      setAuthOpen(true);
      return;
    }
    setMovieForBooking(movie);
  }

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const [moviesResponse, eventsResponse] = await Promise.all([
          catalogApi.get("/movies"),
          catalogApi.get("/events"),
        ]);
        if (!mounted) return;
        setMovies(
          (moviesResponse.data.items || []).map((movie) => ({
            ...movie,
            id: movie.movieId,
          }))
        );
        setEvents(
          (eventsResponse.data.items || []).map((event) => ({
            ...event,
            id: event.eventId,
          }))
        );
      } catch (_error) {
        if (mounted) setCatalogError("Không thể tải phim và sự kiện. Hãy khởi động catalog service.");
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  function showSuccessToast(message) {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage("");
    }, 2200);
  }

  return (
    <main className="home-page">
      <HeaderBar
        currentPage={currentPage}
        onNavigateHome={() => setCurrentPage("home")}
        onNavigateTickets={() => setCurrentPage("tickets")}
        onNavigateAdmin={() => setCurrentPage("admin")}
        user={user}
        onSignIn={() => setAuthOpen(true)}
        onSignOut={() => {
          localStorage.removeItem("cinema-token");
          localStorage.removeItem("cinema-user");
          setUser(null);
          setCurrentPage("home");
        }}
      />

      {currentPage === "admin" && user?.role === "ADMIN" ? (
        <AdminDashboardPage />
      ) : currentPage === "home" ? (
        <section className="home-content">
          <HeroBanner />
          {catalogLoading ? <p className="muted">Đang tải danh mục...</p> : null}
          {catalogError ? <p className="error-text">{catalogError}</p> : null}
          {!catalogLoading && !catalogError ? (
            <>
              <PopularMoviesSection movies={movies} onBookNow={handleBookNow} />
              <ExploreEventsSection events={events} />
            </>
          ) : null}
        </section>
      ) : (
        <section className="home-content">
          {userId ? (
            <MyTicketsPage userId={userId} onPaidSuccess={showSuccessToast} />
          ) : (
            <section className="auth-required">
              <h2>Đăng nhập để xem vé của bạn</h2>
              <button type="button" className="primary-btn" onClick={() => setAuthOpen(true)}>Đăng nhập</button>
            </section>
          )}
        </section>
      )}

      {movieForBooking ? (
        <BookingModal
          movie={movieForBooking}
          userId={userId}
          onClose={() => setMovieForBooking(null)}
          onPaymentSuccess={showSuccessToast}
        />
      ) : null}

      {toastMessage ? <div className="success-toast">{toastMessage}</div> : null}
      {authOpen ? (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onAuthenticated={({ token, user: authenticatedUser }) => {
            localStorage.setItem("cinema-token", token);
            localStorage.setItem("cinema-user", JSON.stringify(authenticatedUser));
            setUser(authenticatedUser);
          }}
        />
      ) : null}
    </main>
  );
}
