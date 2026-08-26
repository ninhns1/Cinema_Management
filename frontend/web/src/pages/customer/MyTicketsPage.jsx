import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { bookingApi } from "../../services/apiClientFixed";
import { PaymentModal } from "../../components/checkout/PaymentModal";
import "./MyTickets.css";

function formatDate(booking) {
  return `${String(booking.showDate).padStart(2, "0")}/${String(booking.showMonth).padStart(2, "0")}/${booking.showYear}`;
}

function TicketQrCode({ ticket }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const ticketData = JSON.stringify({
      bookingId: ticket.bookingId,
      showtimeId: ticket.showtimeId,
      seatIds: ticket.seatIds,
      paymentRef: ticket.paymentRef,
    });
    QRCode.toDataURL(ticketData, { width: 156, margin: 1, errorCorrectionLevel: "M" })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setError("Không thể tạo mã QR.");
      });
    return () => {
      active = false;
    };
  }, [ticket.bookingId, ticket.paymentRef, ticket.seatIds, ticket.showtimeId]);

  if (error) return <p className="ticket-qr-error">{error}</p>;
  if (!qrDataUrl) return <p className="ticket-qr-loading">Đang tạo QR...</p>;

  return (
    <div className="ticket-qr">
      <img src={qrDataUrl} alt={`Mã QR vé ${ticket.bookingId}`} />
      <a href={qrDataUrl} download={`ticket-${ticket.bookingId}.png`}>Tải mã QR</a>
    </div>
  );
}

export function MyTicketsPage({ userId, onPaidSuccess }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [payingTicket, setPayingTicket] = useState(null);
  const [cancellingId, setCancellingId] = useState("");

  async function loadTickets() {
   if (!userId) return;

   setLoading(true);
   try {
     const response = await bookingApi.get("/", { params: { userId } });
     setTickets(response.data.items || response.data || []);
   } catch (err) {
     console.error("Load tickets failed:", err);
   } finally {
     setLoading(false);
   }
  }

  useEffect(() => {
   loadTickets();
  }, [userId]);

  function handlePaid(booking) {
   setTickets((prev) => prev.map((item) => (item.bookingId === booking.bookingId ? booking : item)));
   onPaidSuccess("Dat cho thanh cong");
  }

  async function cancelTicket(ticket) {
   if (!window.confirm("Bạn có chắc muốn hủy đặt chỗ này không?")) return;
   setCancellingId(ticket.bookingId);
   try {
     const response = await bookingApi.delete(`/${ticket.bookingId}`);
     setTickets((prev) => prev.map((item) => item.bookingId === ticket.bookingId ? response.data : item));
     window.alert(ticket.paymentStatus === "PAID" ? "Đã hủy vé và hoàn tiền thành công." : "Đã hủy đặt chỗ.");
   } catch (err) {
     window.alert("Không thể hủy vé hoặc hoàn tiền. Vui lòng thử lại.");
   } finally {
     setCancellingId("");
   }
  }

  if (!userId) {
   return (
     <section className="tickets-page">
       <div className="section-head">
         <h2>My Tickets</h2>
       </div>
       <p className="muted">Vui lòng đăng nhập để xem lịch sử vé của bạn.</p>
     </section>
   );
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
           <p><strong>Trang thai:</strong> {ticket.bookingStatus === "CANCELLED" ? "Da huy" : ticket.paymentStatus === "PAID" ? "Da thanh toan" : "Chua thanh toan"}</p>
           {ticket.paymentStatus === "PAID" && ticket.bookingStatus === "BOOKED" ? <TicketQrCode ticket={ticket} /> : null}

           {ticket.bookingStatus === "PENDING_PAYMENT" || (ticket.bookingStatus === "BOOKED" && ticket.paymentStatus === "PAID") ? (
             <>
             {ticket.paymentStatus !== "PAID" ? <button type="button" className="primary-btn full" onClick={() => setPayingTicket(ticket)}>
               Thanh toan
             </button> : null}
             <button type="button" className="slot-btn full" onClick={() => cancelTicket(ticket)} disabled={cancellingId === ticket.bookingId}>
               {cancellingId === ticket.bookingId ? "Dang xu ly..." : ticket.paymentStatus === "PAID" ? "Huy ve va hoan tien" : "Huy ve"}
             </button>
             </>
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
