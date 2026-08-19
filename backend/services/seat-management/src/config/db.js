const mongoose = require("mongoose");

async function connectDb(mongoUri) {
  await mongoose.connect(mongoUri);
}

module.exports = { connectDb };
