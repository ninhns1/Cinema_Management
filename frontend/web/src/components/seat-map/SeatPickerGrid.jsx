function displayStatus(rawStatus) {
  if (!rawStatus) return "available";
  return rawStatus.toLowerCase();
}

export function SeatPickerGrid({ seats, seatStates, selectedSeats, onToggleSeat }) {
  return (
    <div className="seat-grid-wrap">
      <div className="screen-bar">SCREEN</div>
      <div className="seat-grid">
        {seats.map((seatId) => {
          const seat = seatStates[seatId];
          const status = displayStatus(seat?.status);
          const isSelected = selectedSeats.includes(seatId);
          const blocked = status === "booked" || (status === "held" && !isSelected);

          return (
            <button
              type="button"
              key={seatId}
              disabled={blocked}
              onClick={() => onToggleSeat(seatId, status)}
              className={`seat-item ${status} ${isSelected ? "selected" : ""}`}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );
}
