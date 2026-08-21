import { useState } from "react";

export function PopularMoviesSection({ movies, onBookNow, onPosterClick }) {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const genres = ["All", "Action", "Sci-Fi", "Drama", "Comedy", "Thriller", "Adventure", "Animation", "Crime", "Horror"];

  const filteredMovies = movies.filter((movie) => {
    const matchesGenre = selectedGenre === "All" || movie.genre.includes(selectedGenre);
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  return (
    <section className="popular-section">
      <div className="section-head">
        <div>
          <p className="section-kicker">CURATED FOR YOU</p>
          <h2>Popular movies</h2>
        </div>
        <span className="muted">{filteredMovies.length} movies</span>
      </div>

      <div className="filters-container">
        <div className="genre-filters">
          {genres.map((genre) => (
            <button
              key={genre}
              className={`genre-filter ${selectedGenre === genre ? "active" : ""}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="search-movies"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="movie-row">
        {filteredMovies.map((movie, index) => (
          <article
            className="movie-card"
            key={movie.id}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="poster-wrapper">
              <img
                src={movie.poster}
                alt={movie.title}
                className="movie-poster"
                onClick={() => onPosterClick?.(movie)}
                style={{ cursor: "pointer" }}
              />
              <div className="poster-overlay">
                <button className="trailer-btn" onClick={() => onPosterClick?.(movie)}>
                  ▶ Trailer
                </button>
              </div>
              <div className="rating-badge">
                ⭐ {movie.rating.split(' - ')[0]}
              </div>
            </div>
            <div className="movie-meta">
              <h3>{movie.title}</h3>
              <p className="movie-genre">{movie.genre}</p>
              <div className="movie-info">
                <span>{movie.duration}</span>
                <span>•</span>
                <span>{movie.releaseDate}</span>
              </div>
            </div>
            <button className="primary-btn full" onClick={() => onBookNow(movie)}>
              Book now
            </button>
          </article>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className="no-results">
          <p>No movies found matching your criteria.</p>
        </div>
      )}
    </section>
  );
}
