const express = require("express")
const router = express.Router()
const marketDataController = require("../controllers/marketDataController")

// GET /api/market-data
router.get("/", marketDataController.getMarketData)

// GET /api/market-data/symbol/:symbol
router.get("/symbol/:symbol", marketDataController.getMarketDataBySymbol)

// GET /api/market-data/latest
router.get("/latest", marketDataController.getLatestPrices)

// POST /api/market-data/fetch - Fetch fresh data from Angel Broking
router.post("/fetch", marketDataController.fetchFreshData)

module.exports = router
