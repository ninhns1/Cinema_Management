export function HeroBanner() {
  return (
    <section className="hero-banner">
      <div className="hero-background">
        <img 
          src="https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg" 
          alt="Cinema background"
          className="hero-bg-image"
        />
        <div className="hero-overlay"></div>
      </div>
      <div className="hero-content">
        <p className="hero-label">NOW SHOWING</p>
        <h1>Your next movie night starts here.</h1>
        <p className="hero-sub">Discover the latest releases and reserve your best seats.</p>
        <button className="primary-btn">Explore movies</button>
      </div>
    </section>
  );
}
