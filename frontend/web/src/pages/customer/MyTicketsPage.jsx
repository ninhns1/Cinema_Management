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
      console.log("Booking API response:", response.data); // debug tạm
      setTickets(response.data.items || response.data || []);
    } catch (err) {
      console.error("Load tickets failed:", err);
    } finally {
      setLoading(false);
    }
   }

  useEffect(() => {
    loadTickets();
  }, []);

  function handlePaid(booking) {
    setTickets((prev) => prev.map((item) => (item.bookingId === booking.bookingId ? booking : item)));
    onPaidSuccess("Dat cho thanh cong");
  }

  return (
    <section className="tickets-page">
      <div className="section-head">
        <h2>My Tickets</h2>
        <button type="button" className="slot-btn" onClick={loadTickets}>Refresh</button>
      </div>

      {loading ? <p className="muted">Dang tai...</p> : null}

      <div className="tickets-list">
        {tickets.map((ticket) => (
          <article className="ticket-card" key={ticket.bookingId}>
            <h3>{ticket.movieTitle}</h3>
            <p><strong>Ngay:</strong> {formatDate(ticket)}</p>
            <p><strong>Gio:</strong> {ticket.showtimeLabel}</p>
            <p><strong>Cho ngoi:</strong> {(ticket.seatIds || []).join(", ")}</p>
            <p><strong>Gia ve:</strong> {(ticket.totalAmount ?? 0).toLocaleString("vi-VN")} VND</p>
            <p><strong>Trang thai:</strong> {ticket.paymentStatus === "PAID" ? "Da thanh toan" : "Chua thanh toan"}</p>

            {ticket.paymentStatus !== "PAID" ? (
              <button type="button" className="primary-btn full" onClick={() => setPayingTicket(ticket)}>
                Thanh toan
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
