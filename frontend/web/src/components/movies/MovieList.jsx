export function MovieList({ movies, onPickMovie }) {
  return (
    <div className="grid">
      {movies.map((movie) => (
        <article className="card" key={movie.id}>
          <h3>{movie.title}</h3>
          <p>{movie.description}</p>
          <button onClick={() => onPickMovie(movie)}>Chon suat chieu</button>
        </article>
      ))}
    </div>
  );
}
