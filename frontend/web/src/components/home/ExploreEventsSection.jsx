export function ExploreEventsSection({ events }) {
  return (
    <section className="events-section">
      <div className="section-head">
        <h2>Khám phá sự kiện</h2>
      </div>
      <div className="event-row">
        {events.map((event, index) => (
          <article
            className="event-card"
            key={event.id}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <img src={event.banner} alt={event.title} className="event-banner" />
            <div className="event-meta">
              <h3>{event.title}</h3>
              <p>{event.count}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
