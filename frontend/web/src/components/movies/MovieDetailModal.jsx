import { useState } from "react";

export function MovieDetailModal({ movie, onClose, onBookNow }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  if (!movie) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="movie-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>✕</button>
        
        <div className="movie-detail-backdrop">
          <img
            src={movie.backdrop}
            alt={movie.title}
            className="backdrop-image"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="backdrop-overlay"></div>
        </div>

        <div className="movie-detail-content">
          <div className="movie-detail-header">
            <div className="movie-detail-poster">
              <img src={movie.poster} alt={movie.title} />
            </div>
            <div className="movie-detail-info">
              <h2>{movie.title}</h2>
              <div className="detail-meta">
                <span className="detail-rating">⭐ {movie.rating}</span>
                <span className="detail-year">{movie.releaseDate}</span>
                <span className="detail-duration">{movie.duration}</span>
              </div>
              <p className="detail-genre">{movie.genre}</p>
            </div>
          </div>

          <div className="movie-detail-actions">
            <button className="primary-btn book-btn" onClick={() => onBookNow(movie)}>
              Book Tickets
            </button>
            <button 
              className="trailer-btn-large"
              onClick={() => window.open(movie.trailerUrl.replace('embed/', 'watch?v='), '_blank')}
            >
              ▶ Watch Trailer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
