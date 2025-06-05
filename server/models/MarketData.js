const mongoose = require("mongoose")

const marketDataSchema = new mongoose.Schema({
  token: String,
  symbol: String,
  ltp: Number,
  change: Number,
  changePercent: Number,
  open: Number,
  high: Number,
  low: Number,
  volume: Number,
  timestamp: { type: Date, default: Date.now },
})

module.exports = mongoose.model("MarketData", marketDataSchema)
