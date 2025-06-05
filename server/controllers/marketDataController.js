const MarketData = require("../models/MarketData")
const marketDataService = require("../services/marketDataService")
const angelBrokingService = require("../services/angelBrokingService")

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
    const latestData = await marketDataService.getLatestMarketData()
    res.json({ success: true, data: latestData })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const fetchFreshData = async (req, res) => {
  try {
    if (!angelBrokingService.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated. Please login first.",
      })
    }

    const authToken = angelBrokingService.getAuthToken()
    const mode = req.query.mode || "FULL" // LTP, OHLC, or FULL

    const result = await marketDataService.fetchMarketData(authToken, mode)

    res.json({
      success: true,
      message: "Market data fetched successfully",
      fetchTime: result.fetchTime,
      recordCount: result.data.data.fetched.length,
      unfetchedCount: result.data.data.unfetched.length,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getMarketData,
  getMarketDataBySymbol,
  getLatestPrices,
  fetchFreshData,
}
