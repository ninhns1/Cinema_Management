import { useEffect, useState } from "react";
import { catalogApi } from "../../services/apiClient";
import { bookingApi } from "../../services/apiClient";

export function AdminDashboardPage() {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);

  async function loadMovies() {
    setLoading(true);
    setError("");
    try {
      const [moviesResponse, showtimesResponse, statsResponse] = await Promise.all([
        catalogApi.get("/movies"),
        catalogApi.get("/showtimes"),
        bookingApi.get("/admin/stats"),
      ]);
      setMovies(moviesResponse.data.items || []);
      setShowtimes(showtimesResponse.data.items || []);
      setStats(statsResponse.data);
    } catch (_error) {
      setError("Không thể tải danh mục phim.");
    } finally {
      setLoading(false);
    }
  }

  async function archiveMovie(movieId) {
    try {
      await catalogApi.delete(`/admin/movies/${movieId}`);
      setMovies((current) => current.filter((movie) => movie.movieId !== movieId));
    } catch (_error) {
      setError("Không thể ẩn phim này.");
    }
  }

  async function archiveShowtime(showtimeId) {
    try {
      await catalogApi.delete(`/admin/showtimes/${showtimeId}`);
      setShowtimes((current) => current.filter((item) => item.showtimeId !== showtimeId));
    } catch (_error) {
      setError("Không thể ẩn suất chiếu này.");
    }
  }

  useEffect(() => {
    loadMovies();
  }, []);

  return (
    <main className="page">
      <section className="card">
        <h2>Bảng quản trị</h2>
        <p>Quản lý danh mục phim và suất chiếu.</p>
        {stats ? (
          <div className="admin-stats">
            <div><strong>{stats.totalBookings}</strong><span>Lượt đặt vé</span></div>
            <div><strong>{stats.paidBookings}</strong><span>Đã thanh toán</span></div>
            <div><strong>{(stats.revenue || 0).toLocaleString("vi-VN")}</strong><span>Doanh thu (VND)</span></div>
          </div>
        ) : null}
        {loading ? <p className="muted">Đang tải dữ liệu...</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        <div className="admin-movie-list">
          {movies.map((movie) => (
            <article className="admin-movie-row" key={movie.movieId}>
              <img src={movie.poster} alt="" />
              <div>
                <h3>{movie.title}</h3>
                <p className="muted">{movie.genre}</p>
              </div>
              <button type="button" className="text-button" onClick={() => archiveMovie(movie.movieId)}>
                Ẩn phim
              </button>
            </article>
          ))}
        </div>
        <h3 className="admin-subtitle">Suất chiếu</h3>
        <div className="admin-movie-list">
          {showtimes.map((showtime) => (
            <article className="admin-movie-row" key={showtime.showtimeId}>
              <div>
                <h3>{showtime.movieTitle}</h3>
                <p className="muted">{showtime.label} · {(showtime.seatPrice || 0).toLocaleString("vi-VN")} VND</p>
              </div>
              <span className="muted">{showtime.showtimeKey}</span>
              <button type="button" className="text-button" onClick={() => archiveShowtime(showtime.showtimeId)}>
                Ẩn suất
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
