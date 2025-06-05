const MarketData = require("../models/MarketData")

const getMarketData = async (req, res) => {
  try {
    const marketData = await MarketData.find().sort({ timestamp: -1 }).limit(50)
    res.json({ success: true, data: marketData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getMarketDataBySymbol = async (req, res) => {
  try {
    const { symbol } = req.params
    const marketData = await MarketData.find({ symbol }).sort({ timestamp: -1 }).limit(100)
    res.json({ success: true, data: marketData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getLatestPrices = async (req, res) => {
  try {
    const latestData = await MarketData.aggregate([
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: "$symbol",
          latestData: { $first: "$$ROOT" },
        },
      },
      {
        $replaceRoot: { newRoot: "$latestData" },
      },
    ])

    res.json({ success: true, data: latestData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getMarketData,
  getMarketDataBySymbol,
  getLatestPrices,
}
