import { useState } from "react";
import { bookingApi } from "../../services/apiClientFixed";

export function PaymentModal({ booking, userId, onClose, onPaid }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function confirmPayment() {
    setSubmitting(true);
    setError("");

    try {
      const response = await bookingApi.post("/pay", {
        bookingId: booking.bookingId,
        userId,
      });
      onPaid(response.data);
      onClose();
    } catch (apiError) {
      if (!apiError.response) {
        setError("Cannot connect to booking service.");
      } else if (apiError.response.data?.error?.error) {
        setError(apiError.response.data.error.error);
      } else {
        setError(apiError.response.data?.error || "Payment failed.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="payment-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close-btn" onClick={onClose}>
          x
        </button>
        <p className="section-kicker">Payment</p>
        <h2>Confirm payment</h2>
        <div className="payment-summary">
          <p>
            <strong>Movie:</strong> {booking.movieTitle}
          </p>
          <p>
            <strong>Time:</strong> {booking.showtimeLabel}
          </p>
          <p>
            <strong>Seats:</strong> {booking.seatIds.join(", ")}
          </p>
          <p>
            <strong>Total:</strong>{" "}
            {booking.totalAmount.toLocaleString("vi-VN")} VND
          </p>
          <p>
            <strong>Status:</strong> {booking.paymentStatus}
          </p>
        </div>

        {error ? <p className="error-text">{error}</p> : null}

        <button
          type="button"
          className="primary-btn confirm pay-btn"
          disabled={submitting}
          onClick={confirmPayment}
        >
          {submitting ? "Processing..." : "Confirm payment"}
        </button>
      </div>
    </div>
  );
}
