const express = require("express")
const router = express.Router()

// Import route modules
const authRoutes = require("./authRoutes")
const marketDataRoutes = require("./marketDataRoutes")

// Use routes
router.use("/auth", authRoutes)
router.use("/market-data", marketDataRoutes)

// Health check endpoint for Render
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: "Server is running",
  })
})

// Debug endpoint to check system status
router.get("/debug", async (req, res) => {
  const angelBrokingService = require("../services/angelBrokingService")
  const websocketService = require("../services/websocketService")
  const MarketData = require("../models/MarketData")

  try {
    // Check database connection
    const marketDataCount = await MarketData.countDocuments()
    const latestData = await MarketData.findOne().sort({ timestamp: -1 })

    // Check services status
    const debugInfo = {
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        totalRecords: marketDataCount,
        latestRecord: latestData
          ? {
              symbol: latestData.symbol,
              timestamp: latestData.timestamp,
              ltp: latestData.ltp,
            }
          : null,
      },
      authentication: {
        isAuthenticated: angelBrokingService.isAuthenticated(),
        hasAuthToken: !!angelBrokingService.getAuthToken(),
        hasFeedToken: !!angelBrokingService.getFeedToken(),
      },
      websocket: {
        angelWebSocketConnected: websocketService.isAngelWebSocketConnected(),
        connectedClients: websocketService.getConnectedClientsCount(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasClientCode: !!process.env.CLIENT_CODE,
        hasMpin: !!process.env.MPIN,
        hasApiKey: !!process.env.SMARTAPI_KEY,
        hasTotpSecret: !!process.env.TOTP_SECRET,
        mongoUri: process.env.MONGODB_URI ? "Set" : "Missing",
      },
    }

    res.json({
      success: true,
      debug: debugInfo,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      debug: {
        timestamp: new Date().toISOString(),
        database: { connected: false, error: error.message },
      },
    })
  }
})

module.exports = router
