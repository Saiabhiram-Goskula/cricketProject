const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors({ origin: 'https://cricketproject.vercel.app', credentials: true }));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.log("❌ MongoDB connection error:", err));

// Import User model
const User = require("./models/User");

// LOGIN / SIGNUP
app.post("/login", async (req, res) => {
  const { name, pincode } = req.body;
  const existingUser = await User.findOne({ name });
  if (existingUser) {
    if (existingUser.pincode === pincode) return res.json(existingUser);
    return res.status(400).json({ message: "User name already exists. Try a different name or correct pincode." });
  }
  const newUser = new User({ name, pincode, matches: [] });
  await newUser.save();
  res.json(newUser);
});

// ADD MATCH
app.post("/addMatch", async (req, res) => {
  const { name, pincode, match } = req.body;
  const user = await User.findOne({ name, pincode });
  if (!user) return res.status(404).json({ message: "User not found" });
  user.matches.push(match);
  await user.save();
  res.json({ message: "Match added", user });
});

// GET MATCHES
app.post("/getMatches", async (req, res) => {
  const { name, pincode } = req.body;
  const user = await User.findOne({ name, pincode });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.matches);
});

// GET STATS
app.post("/getStats", async (req, res) => {
  const { name, pincode } = req.body;
  const user = await User.findOne({ name, pincode });
  if (!user) return res.status(404).json({ message: "User not found" });

  const matches = user.matches;
  if (!matches.length) return res.json({ message: "No matches yet!" });

  const totalRuns = matches.reduce((a, m) => a + m.runs, 0);
  const totalBalls = matches.reduce((a, m) => a + m.balls, 0);
  const totalFours = matches.reduce((a, m) => a + m.fours, 0);
  const totalSixes = matches.reduce((a, m) => a + m.sixes, 0);
  const highestScore = Math.max(...matches.map(m => m.runs));
  const average = (totalRuns / matches.length).toFixed(2);
  const strikeRate = ((totalRuns / totalBalls) * 100).toFixed(2);

  res.json({ totalMatches: matches.length, totalRuns, totalBalls, totalFours, totalSixes, highestScore, average, strikeRate });
});

// Export app for serverless / Render
module.exports = app;

// Listen on dynamic port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
