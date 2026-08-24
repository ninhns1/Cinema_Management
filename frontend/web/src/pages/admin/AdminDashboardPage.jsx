import { useEffect, useState } from "react";
import { catalogApi, bookingApi, seatApi } from "../../services/apiClient";

export function AdminDashboardPage() {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieForm, setMovieForm] = useState({ title: "", genre: "", rating: "", poster: "", showtimeKey: "" });
  const [savingMovie, setSavingMovie] = useState(false);
  const [seatOverview, setSeatOverview] = useState({});

  async function loadMovies() {
    setLoading(true);
    setError("");
    try {
      const [moviesResponse, showtimesResponse, statsResponse] = await Promise.all([
        catalogApi.get("/movies"),
        catalogApi.get("/showtimes"),
        bookingApi.get("/admin/stats"),
      ]);
      const loadedMovies = moviesResponse.data.items || [];
      const loadedShowtimes = showtimesResponse.data.items || [];
      setMovies(loadedMovies);
      setShowtimes(loadedShowtimes);
      setStats(statsResponse.data);
      const seatEntries = await Promise.all(loadedShowtimes.map(async (showtime) => {
        try {
          const response = await seatApi.get(`/${showtime.showtimeId}`);
          const seats = response.data.items || [];
          return [showtime.showtimeId, {
            total: seats.length,
            booked: seats.filter((seat) => seat.status === "BOOKED").length,
            held: seats.filter((seat) => seat.status === "HELD").length,
            available: seats.filter((seat) => seat.status === "AVAILABLE").length,
            bookedSeats: seats.filter((seat) => seat.status === "BOOKED").map((seat) => seat.seatId),
            availableSeats: seats.filter((seat) => seat.status === "AVAILABLE").map((seat) => seat.seatId),
          }];
        } catch (_error) {
          return [showtime.showtimeId, null];
        }
      }));
      setSeatOverview(Object.fromEntries(seatEntries));
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

  function startMovieForm(movie = null) {
    setEditingMovie(movie);
    setMovieForm(movie ? {
      title: movie.title,
      genre: movie.genre,
      rating: movie.rating,
      poster: movie.poster,
      showtimeKey: movie.showtimeKey,
    } : { title: "", genre: "", rating: "", poster: "", showtimeKey: "" });
    setError("");
  }

  async function saveMovie(event) {
    event.preventDefault();
    setSavingMovie(true);
    setError("");
    try {
      const response = editingMovie
        ? await catalogApi.patch(`/admin/movies/${editingMovie.movieId}`, movieForm)
        : await catalogApi.post("/admin/movies", movieForm);
      setMovies((current) => editingMovie
        ? current.map((movie) => movie.movieId === editingMovie.movieId ? response.data : movie)
        : [...current, response.data]);
      startMovieForm();
    } catch (apiError) {
      setError(apiError.response?.data?.error || "Không thể lưu phim.");
    } finally {
      setSavingMovie(false);
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
        <form className="admin-movie-form" onSubmit={saveMovie}>
          <h3>{editingMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}</h3>
          <div className="admin-form-grid">
            {[["title", "Tên phim"], ["genre", "Thể loại"], ["rating", "Đánh giá"], ["poster", "Poster URL"], ["showtimeKey", "Showtime key"]].map(([name, label]) => (
              <label key={name} className="profile-input">
                <span>{label}</span>
                <input name={name} value={movieForm[name]} onChange={(event) => setMovieForm((current) => ({ ...current, [name]: event.target.value }))} required />
              </label>
            ))}
          </div>
          <button type="submit" className="primary-btn" disabled={savingMovie}>{savingMovie ? "Đang lưu..." : editingMovie ? "Lưu thay đổi" : "Thêm phim"}</button>
          {editingMovie ? <button type="button" className="text-button" onClick={() => startMovieForm()}>Hủy chỉnh sửa</button> : null}
        </form>
        <h3 className="admin-subtitle">Phim đang chiếu</h3>
        <div className="admin-now-showing">
          {movies.map((movie) => (
            <article className="admin-now-showing-item" key={movie.movieId}>
              <img src={movie.poster} alt="" />
              <div><strong>{movie.title}</strong><span>{movie.genre}</span></div>
            </article>
          ))}
        </div>
        <div className="admin-movie-list">
          {movies.map((movie) => (
            <article className="admin-movie-row" key={movie.movieId}>
              <img src={movie.poster} alt="" />
              <div>
                <h3>{movie.title}</h3>
                <p className="muted">{movie.genre}</p>
              </div>
              <button type="button" className="text-button" onClick={() => startMovieForm(movie)}>Sửa</button>
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
              <div className="admin-seat-summary">
                {seatOverview[showtime.showtimeId] ? (
                  <>
                    <span className="seat-booked">Đã đặt: {seatOverview[showtime.showtimeId].booked}</span>
                    <span className="seat-available">Trống: {seatOverview[showtime.showtimeId].available}</span>
                    <span className="seat-held">Đang giữ: {seatOverview[showtime.showtimeId].held}</span>
                    <small>Ghế đã đặt: {seatOverview[showtime.showtimeId].bookedSeats.join(", ") || "Chưa có"}</small>
                  </>
                ) : <span className="muted">Chưa tải được sơ đồ ghế</span>}
              </div>
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
