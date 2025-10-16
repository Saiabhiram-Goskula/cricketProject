const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema({
  runs: Number,
  balls: Number,
  fours: Number,
  sixes: Number,
  opponent: String,
  notes: String,
  strikeRate: Number,
  date: { type: Date, default: Date.now },  // ✅ this is automatic
});


const userSchema = new mongoose.Schema({
  name: String,
  pincode: String,
  matches: [matchSchema],
});

module.exports = mongoose.model("User", userSchema);
