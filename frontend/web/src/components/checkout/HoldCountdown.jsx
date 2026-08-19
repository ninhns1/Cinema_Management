import { useEffect, useState } from "react";

export function HoldCountdown({ expiresAt }) {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const left = Math.max(0, Math.floor((new Date(expiresAt) - new Date()) / 1000));
      setSecondsLeft(left);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <p>
      Ghe dang duoc giu: {minutes}:{String(seconds).padStart(2, "0")}
    </p>
  );
}
