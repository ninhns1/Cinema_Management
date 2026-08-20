export function PopularMoviesSection({ movies, onBookNow }) {
  return (
    <section className="popular-section">
      <div className="section-head">
        <div>
          <p className="section-kicker">GỢI Ý DÀNH CHO BẠN</p>
          <h2>Phim nổi bật</h2>
        </div>
        <span className="muted">{movies.length} phim</span>
      </div>

      <div className="movie-row">
        {movies.map((movie, index) => (
          <article
            className="movie-card"
            key={movie.id}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <img src={movie.poster} alt={movie.title} className="movie-poster" />
            <div className="movie-meta">
              <h3>{movie.title}</h3>
              <p>{movie.genre}</p>
              <p className="rating">{movie.rating}</p>
            </div>
            <button className="primary-btn full" onClick={() => onBookNow(movie)}>
              Đặt vé
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
