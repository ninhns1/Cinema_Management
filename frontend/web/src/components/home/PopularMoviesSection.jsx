export function PopularMoviesSection({ movies, onBookNow }) {
  return (
    <section className="popular-section">
      <div className="section-head">
        <div>
          <p className="section-kicker">CURATED FOR YOU</p>
          <h2>Popular movies</h2>
        </div>
        <span className="muted">{movies.length} movies</span>
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
              Book now
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
