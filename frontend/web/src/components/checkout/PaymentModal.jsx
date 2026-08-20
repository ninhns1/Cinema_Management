import { useState } from "react";
import { bookingApi } from "../../services/apiClient";
import { HoldCountdown } from "./HoldCountdown";

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
        setError("Không thể kết nối dịch vụ đặt vé.");
      } else if (apiError.response.data?.error?.error) {
        setError(apiError.response.data.error.error);
      } else {
        setError(apiError.response.data?.error || "Thanh toán thất bại.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="payment-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose}>
          x
        </button>
        <p className="section-kicker">THANH TOÁN</p>
        <h2>Xác nhận thanh toán</h2>
        <div className="payment-summary">
          <p><strong>Phim:</strong> {booking.movieTitle}</p>
          <p><strong>Suất:</strong> {booking.showtimeLabel}</p>
          <p><strong>Ghế:</strong> {booking.seatIds.join(", ")}</p>
          <p><strong>Tổng tiền:</strong> {booking.totalAmount.toLocaleString("vi-VN")} VND</p>
          <p><strong>Trạng thái:</strong> {booking.paymentStatus}</p>
        </div>
        <HoldCountdown expiresAt={booking.holdExpiresAt} />

        {error ? <p className="error-text">{error}</p> : null}

        <button
          type="button"
          className="primary-btn confirm pay-btn"
          disabled={submitting}
          onClick={confirmPayment}
        >
          {submitting ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>
      </div>
    </div>
  );
}
