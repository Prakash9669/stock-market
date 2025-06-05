const angelBrokingService = require("../services/angelBrokingService")
const websocketService = require("../services/websocketService")
const MarketData = require("../models/MarketData")
const mongoose = require("mongoose")
const speakeasy = require("speakeasy")

const getDebugInfo = async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? "connected" : "disconnected"
    const marketDataCount = await MarketData.countDocuments()
    const latestData = await MarketData.findOne().sort({ timestamp: -1 })

    // Generate current TOTP
    let currentTotp = null
    try {
      if (process.env.TOTP_SECRET) {
        currentTotp = speakeasy.totp({
          secret: process.env.TOTP_SECRET,
          encoding: "base32",
        })
      }
    } catch (error) {
      currentTotp = `Error: ${error.message}`
    }

    // Check services status
    const debugInfo = {
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        uri: process.env.MONGODB_URI ? `${process.env.MONGODB_URI.substring(0, 20)}...` : "Missing",
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
        authToken: angelBrokingService.getAuthToken()
          ? `${angelBrokingService.getAuthToken().substring(0, 10)}...`
          : null,
        feedToken: angelBrokingService.getFeedToken()
          ? `${angelBrokingService.getFeedToken().substring(0, 10)}...`
          : null,
        currentTotp: currentTotp,
      },
      websocket: {
        angelWebSocketConnected: websocketService.isAngelWebSocketConnected(),
        connectedClients: websocketService.getConnectedClientsCount(),
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        clientCode: process.env.CLIENT_CODE ? `${process.env.CLIENT_CODE}` : "Missing",
        mpin: process.env.MPIN ? "Set (hidden)" : "Missing",
        apiKey: process.env.SMARTAPI_KEY ? `${process.env.SMARTAPI_KEY.substring(0, 3)}...` : "Missing",
        totpSecret: process.env.TOTP_SECRET ? `${process.env.TOTP_SECRET.substring(0, 5)}...` : "Missing",
      },
      server: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
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
        error: error.stack,
      },
    })
  }
}

const triggerLogin = async (req, res) => {
  try {
    console.log("🔄 Manual login attempt triggered...")
    const success = await angelBrokingService.login()

    if (success) {
      websocketService.connectToAngelWebSocket(
        angelBrokingService.getFeedToken(),
        process.env.CLIENT_CODE,
        process.env.SMARTAPI_KEY,
      )
      res.json({
        success: true,
        message: "Login successful and WebSocket connection initiated",
        authToken: angelBrokingService.getAuthToken()
          ? `${angelBrokingService.getAuthToken().substring(0, 10)}...`
          : null,
        feedToken: angelBrokingService.getFeedToken()
          ? `${angelBrokingService.getFeedToken().substring(0, 10)}...`
          : null,
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Login failed",
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      stack: error.stack,
    })
  }
}

const addMockData = async (req, res) => {
  try {
    // Sample mock data
    const mockStocks = [
      {
        token: "3045",
        symbol: "SBIN",
        ltp: 417.15,
        change: 0.05,
        changePercent: 0.01,
        open: 417.15,
        high: 419.0,
        low: 415.95,
        volume: 1000,
      },
      {
        token: "881",
        symbol: "RELIANCE",
        ltp: 1251.9,
        change: 3.6,
        changePercent: 0.29,
        open: 1248.3,
        high: 1266.0,
        low: 1246.3,
        volume: 5000,
      },
      {
        token: "99926004",
        symbol: "INFY",
        ltp: 3380.9,
        change: -24.3,
        changePercent: -0.71,
        open: 3389.0,
        high: 3394.8,
        low: 3370.0,
        volume: 2000,
      },
      {
        token: "2885",
        symbol: "TCS",
        ltp: 2885.45,
        change: 12.75,
        changePercent: 0.44,
        open: 2872.7,
        high: 2890.0,
        low: 2870.0,
        volume: 1500,
      },
      {
        token: "1333",
        symbol: "HDFCBANK",
        ltp: 1660.25,
        change: -5.8,
        changePercent: -0.35,
        open: 1666.05,
        high: 1668.0,
        low: 1658.0,
        volume: 3000,
      },
    ]

    // Clear existing data
    if (req.query.clear === "true") {
      await MarketData.deleteMany({})
    }

    // Insert mock data
    const result = await MarketData.insertMany(
      mockStocks.map((stock) => ({
        ...stock,
        timestamp: new Date(),
      })),
    )

    res.json({
      success: true,
      message: `Added ${result.length} mock records to database`,
      data: result,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

module.exports = {
  getDebugInfo,
  triggerLogin,
  addMockData,
}
