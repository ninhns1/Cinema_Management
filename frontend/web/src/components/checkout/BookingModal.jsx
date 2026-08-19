import { useEffect, useMemo, useState } from "react";
import { bookingApi, seatApi } from "../../services/apiClient";
import { seatSocket } from "../../services/seatRealtime";
import { SeatPickerGrid } from "../seat-map/SeatPickerGrid";
import { SeatGridSkeleton } from "../seat-map/SeatGridSkeleton";
import { PaymentModal } from "./PaymentModal";

const showtimeSlots = [
  { label: "09:00 AM", suffix: "0900" },
  { label: "12:30 PM", suffix: "1230" },
  { label: "04:00 PM", suffix: "1600" },
  { label: "07:30 PM", suffix: "1930" },
  { label: "10:30 PM", suffix: "2230" },
];

function buildSeatIds() {
  const rows = ["E", "D", "C", "B", "A"];
  const result = [];
  rows.forEach((row) => {
    for (let i = 1; i <= 10; i += 1) {
      result.push(`${row}${i}`);
    }
  });
  return result;
}

function parseDateParts(showtimeKey) {
  const parts = showtimeKey.split("-");
  if (parts.length < 3) {
    const now = new Date();
    return {
      showDate: now.getDate(),
      showMonth: now.getMonth() + 1,
      showYear: now.getFullYear(),
    };
  }

  const year = Number(parts[parts.length - 3]);
  const month = Number(parts[parts.length - 2]);
  const date = Number(parts[parts.length - 1]);

  return {
    showDate: Number.isFinite(date) ? date : 1,
    showMonth: Number.isFinite(month) ? month : 1,
    showYear: Number.isFinite(year) ? year : new Date().getFullYear(),
  };
}

export function BookingModal({ movie, userId, onClose, onPaymentSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(showtimeSlots[0]);
  const [seatStates, setSeatStates] = useState({});
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loadingSeats, setLoadingSeats] = useState(false);
  const [pendingBooking, setPendingBooking] = useState(null);

  const seatIds = useMemo(() => buildSeatIds(), []);
  const showtimeId = `${movie.showtimeKey}-${selectedSlot.suffix}`;

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let mounted = true;
    setSelectedSeats([]);

    async function loadSeats() {
      setLoadingSeats(true);
      try {
        const response = await seatApi.get(`/${showtimeId}`);
        if (!mounted) return;
        const map = {};
        response.data.items.forEach((item) => {
          map[item.seatId] = item;
        });
        setSeatStates(map);
      } catch (_error) {
        if (!mounted) return;
        setSeatStates({});
      } finally {
        if (mounted) {
          setLoadingSeats(false);
        }
      }
    }

    loadSeats();
    seatSocket.emit("seat-room:join", showtimeId);

    const onSeatUpdated = (payload) => {
      if (payload.showtimeId !== showtimeId) return;
      setSeatStates((prev) => ({
        ...prev,
        [payload.seatId]: {
          ...(prev[payload.seatId] || {}),
          seatId: payload.seatId,
          status: payload.status,
        },
      }));
      if (payload.status === "BOOKED") {
        setSelectedSeats((prev) => prev.filter((s) => s !== payload.seatId));
      }
    };

    seatSocket.on("seat.updated", onSeatUpdated);

    return () => {
      mounted = false;
      seatSocket.off("seat.updated", onSeatUpdated);
    };
  }, [showtimeId]);

  function toggleSeat(seatId, status) {
    if (status === "booked") return;
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((item) => item !== seatId);
      }
      return [...prev, seatId];
    });
  }

  async function confirmBooking() {
    if (!selectedSeats.length) return;

    setSubmitting(true);
    setError("");

    try {
      const dateParts = parseDateParts(movie.showtimeKey);

      const response = await bookingApi.post("/create", {
        userId,
        movieTitle: movie.title,
        showtimeId,
        showtimeLabel: selectedSlot.label,
        showDate: dateParts.showDate,
        showMonth: dateParts.showMonth,
        showYear: dateParts.showYear,
        seatIds: selectedSeats,
        seatPrice: 120000,
      });

      setPendingBooking(response.data);
    } catch (apiError) {
      if (!apiError.response) {
        setError("Cannot connect to booking services. Please start backend services and try again.");
      } else if (apiError.response.data?.error?.error) {
        setError(apiError.response.data.error.error);
      } else {
        setError(apiError.response.data?.error || "Seat is no longer available. Please choose another one.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handlePaid(_booking) {
    onPaymentSuccess("Dat cho thanh cong");
    setSelectedSeats([]);
    setPendingBooking(null);
    onClose();
  }

  const estimatedTotal = selectedSeats.length * 120000;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="booking-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose}>
          x
        </button>

        <p className="section-kicker">Book tickets</p>
        <h2>{movie.title}</h2>

        <div className="slot-wrap">
          <h3>Select showtime</h3>
          <div className="slot-row">
            {showtimeSlots.map((slot) => (
              <button
                key={slot.suffix}
                type="button"
                className={`slot-btn ${selectedSlot.suffix === slot.suffix ? "active" : ""}`}
                onClick={() => setSelectedSlot(slot)}
              >
                {slot.label}
              </button>
            ))}
          </div>
        </div>

        <h3>Select seats ({selectedSeats.length} selected)</h3>
        {loadingSeats ? (
          <SeatGridSkeleton />
        ) : (
          <SeatPickerGrid
            seats={seatIds}
            seatStates={seatStates}
            selectedSeats={selectedSeats}
            onToggleSeat={toggleSeat}
          />
        )}

        <div className="seat-legend">
          <span><i className="legend-dot available" /> Available</span>
          <span><i className="legend-dot selected" /> Selected</span>
          <span><i className="legend-dot held" /> Held</span>
          <span><i className="legend-dot booked" /> Booked</span>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <div className="booking-footer">
          <div>
            <p className="muted">Estimated total</p>
            <h3>{estimatedTotal.toLocaleString("vi-VN")} VND</h3>
          </div>
          <button
            type="button"
            className="primary-btn confirm"
            disabled={!selectedSeats.length || submitting}
            onClick={confirmBooking}
          >
            {submitting ? "Processing..." : "Confirm booking"}
          </button>
        </div>
      </div>

      {pendingBooking ? (
        <PaymentModal
          booking={pendingBooking}
          userId={userId}
          onClose={() => setPendingBooking(null)}
          onPaid={handlePaid}
        />
      ) : null}
    </div>
  );
}
