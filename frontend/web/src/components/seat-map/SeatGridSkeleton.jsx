export function SeatGridSkeleton() {
  return (
    <div className="seat-grid-wrap">
      <div className="screen-bar">SCREEN</div>
      <div className="seat-grid skeleton-grid">
        {Array.from({ length: 50 }).map((_, index) => (
          <div className="seat-skeleton" key={index} />
        ))}
      </div>
    </div>
  );
}
