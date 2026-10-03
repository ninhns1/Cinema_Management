import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { seatApi } from "../../services/apiClientFixed";

const seatSocketUrl =
  import.meta.env.VITE_SEAT_SOCKET_URL || "http://localhost:4001";
const socket = io(seatSocketUrl);

function normalizeStatus(status) {
  if (!status) return "available";
  return status.toLowerCase();
}

export function SeatMapRealtime({ showtimeId, userId, onHoldCreated }) {
  const [seatStates, setSeatStates] = useState({});

  const seats = useMemo(() => {
    const rows = ["A", "B", "C", "D"];
    const list = [];
    rows.forEach((row) => {
      for (let i = 1; i <= 8; i += 1) {
        list.push(`${row}${i}`);
      }
    });
    return list;
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const response = await seatApi.get(`/${showtimeId}`);
      if (!mounted) return;
      const map = {};
      response.data.items.forEach((item) => {
        map[item.seatId] = item;
      });
      setSeatStates(map);
    }

    load();
    socket.emit("seat-room:join", showtimeId);

    const onUpdate = (payload) => {
      if (payload.showtimeId !== showtimeId) return;
      setSeatStates((prev) => ({
        ...prev,
        [payload.seatId]: {
          ...(prev[payload.seatId] || {}),
          seatId: payload.seatId,
          status: payload.status,
          holdId: payload.holdId || null,
          holdExpiresAt: payload.expiresAt || null,
        },
      }));
    };

    socket.on("seat.updated", onUpdate);

    return () => {
      mounted = false;
      socket.off("seat.updated", onUpdate);
    };
  }, [showtimeId]);

  async function holdSeat(seatId) {
    const response = await seatApi.post(
      "/hold",
      { showtimeId, seatId, userId },
      {
        headers: {
          "Idempotency-Key": `${showtimeId}-${seatId}-${userId}`,
        },
      },
    );
    onHoldCreated(response.data);
  }

  return (
    <section className="card">
      <h3>Sơ đồ ghế theo thời gian thực</h3>
      <div className="seats">
        {seats.map((seatId) => {
          const seat = seatStates[seatId];
          const status = normalizeStatus(seat?.status);
          const blocked = status === "booked";

          return (
            <button
              key={seatId}
              className={`seat ${status}`}
              disabled={blocked}
              onClick={() => holdSeat(seatId)}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </section>
  );
}
