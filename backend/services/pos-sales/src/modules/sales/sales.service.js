const axios = require("axios");

async function holdSeat({ baseUrl, showtimeId, seatId, userId, requestKey }) {
  const response = await axios.post(
    `${baseUrl}/api/seats/hold`,
    { showtimeId, seatId, userId },
    {
      headers: {
        "Idempotency-Key": requestKey,
      },
    }
  );

  return response.data;
}

async function confirmSeat({ baseUrl, holdId, userId }) {
  const response = await axios.post(`${baseUrl}/api/seats/confirm`, {
    holdId,
    userId,
  });

  return response.data;
}

module.exports = { holdSeat, confirmSeat };
