import { useState } from "react";
import { bookingApi } from "../../services/apiClientFixed";
import { HoldCountdown } from "./HoldCountdown";

export function CheckoutPanel({ hold, userId }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function checkout() {
    if (!hold) return;
    setLoading(true);
    try {
      const response = await bookingApi.post("/checkout", {
        holdId: hold.holdId,
        userId,
        amount: 120000,
      });
      setResult(response.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card">
      <h3>Thanh toan</h3>
      <HoldCountdown expiresAt={hold?.expiresAt} />
      <button disabled={!hold || loading} onClick={checkout}>
        {loading ? "Dang xu ly..." : "Xac nhan thanh toan"}
      </button>
      {result ? <pre>{JSON.stringify(result, null, 2)}</pre> : null}
    </section>
  );
}
