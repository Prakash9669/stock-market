const express = require("express")
const router = express.Router()
const debugController = require("../controllers/debugController")
const MarketData = require("../models/MarketData")

// GET /api/debug
router.get("/", debugController.getDebugInfo)

// POST /api/debug/login
router.post("/login", debugController.triggerLogin)

// POST /api/debug/mock-data
router.post("/mock-data", debugController.addMockData)

// DELETE /api/debug/mock-data - Clear mock data
router.delete("/mock-data", async (req, res) => {
  try {
    const result = await MarketData.deleteMany({})
    res.json({
      success: true,
      message: `Cleared ${result.deletedCount} records from database`,
      deletedCount: result.deletedCount,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

// POST /api/debug/test-websocket - Test WebSocket connection
router.post("/test-websocket", async (req, res) => {
  try {
    const websocketService = require("../services/websocketService")
    const angelBrokingService = require("../services/angelBrokingService")

    // Check if we have valid tokens
    if (!angelBrokingService.isAuthenticated()) {
      return res.status(400).json({
        success: false,
        message: "Not authenticated. Please login first.",
      })
    }

    // Force reconnect WebSocket
    console.log("🔄 Force reconnecting WebSocket...")
    websocketService.connectToAngelWebSocket(
      angelBrokingService.getFeedToken(),
      process.env.CLIENT_CODE,
      process.env.SMARTAPI_KEY,
    )

    res.json({
      success: true,
      message: "WebSocket reconnection initiated. Check logs for details.",
      feedToken: angelBrokingService.getFeedToken()
        ? `${angelBrokingService.getFeedToken().substring(0, 10)}...`
        : null,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
})

module.exports = router
