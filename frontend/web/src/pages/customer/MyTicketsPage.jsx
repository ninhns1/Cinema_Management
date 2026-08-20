import { useEffect, useState } from "react";
import { bookingApi } from "../../services/apiClient";
import { PaymentModal } from "../../components/checkout/PaymentModal";
import "./MyTickets.css";

function formatDate(booking) {
  return `${String(booking.showDate).padStart(2, "0")}/${String(booking.showMonth).padStart(2, "0")}/${booking.showYear}`;
}

export function MyTicketsPage({ userId, onPaidSuccess }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingTicket, setPayingTicket] = useState(null);

  async function loadTickets() {
   setLoading(true);
   try {
      const response = await bookingApi.get("/", { params: { userId } });
      setTickets(response.data.items || response.data || []);
    } catch (err) {
      console.error("Không thể tải vé:", err);
    } finally {
      setLoading(false);
    }
   }

  useEffect(() => {
    loadTickets();
  }, []);

  function handlePaid(booking) {
    setTickets((prev) => prev.map((item) => (item.bookingId === booking.bookingId ? booking : item)));
    onPaidSuccess("Đặt vé thành công");
  }

  return (
    <section className="tickets-page">
      <div className="section-head">
        <h2>Vé của tôi</h2>
        <button type="button" className="slot-btn" onClick={loadTickets}>Làm mới</button>
      </div>

      {loading ? <p className="muted">Đang tải...</p> : null}

      <div className="tickets-list">
        {tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.bookingId}>
            <h3>{ticket.movieTitle}</h3>
              <p><strong>Ngày:</strong> {formatDate(ticket)}</p>
              <p><strong>Suất:</strong> {ticket.showtimeLabel}</p>
              <p><strong>Ghế:</strong> {(ticket.seatIds || []).join(", ")}</p>
              <p><strong>Giá vé:</strong> {(ticket.totalAmount ?? 0).toLocaleString("vi-VN")} VND</p>
              <p><strong>Trạng thái:</strong> {ticket.paymentStatus === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}</p>

            {ticket.paymentStatus !== "PAID" ? (
              <button type="button" className="primary-btn full" onClick={() => setPayingTicket(ticket)}>
                  Thanh toán
              </button>
            ) : null}
          </article>
        ))}
      </div>

      {payingTicket ? (
        <PaymentModal
          booking={payingTicket}
          userId={userId}
          onClose={() => setPayingTicket(null)}
          onPaid={handlePaid}
        />
      ) : null}
    </section>
  );
}
