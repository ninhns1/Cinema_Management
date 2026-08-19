const Seat = require("./seat.model");

async function findSeat(showtimeId, seatId) {
  return Seat.findOne({ showtimeId, seatId });
}

async function findOrCreateSeat(showtimeId, seatId) {
  const existing = await findSeat(showtimeId, seatId);
  if (existing) return existing;

  return Seat.create({ showtimeId, seatId, status: "AVAILABLE", version: 0 });
}

async function updateSeatWithVersion({
  showtimeId,
  seatId,
  expectedVersion,
  patch,
}) {
  return Seat.findOneAndUpdate(
    { showtimeId, seatId, version: expectedVersion },
    { ...patch, $inc: { version: 1 } },
    { new: true }
  );
}

module.exports = {
  findSeat,
  findOrCreateSeat,
  updateSeatWithVersion,
};
