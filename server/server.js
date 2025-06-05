const express = require("express")
const cors = require("cors")
const path = require("path")
require("dotenv").config()

// Import configurations and services
const connectDB = require("./config/database")
const websocketService = require("./services/websocketService")
const angelBrokingService = require("./services/angelBrokingService")

// Import middleware
const logger = require("./middleware/logger")
const errorHandler = require("./middleware/errorHandler")

// Import routes
const routes = require("./routes")

const app = express()
const PORT = process.env.PORT || 3001
const WS_PORT = process.env.WS_PORT || 8081

// Middleware
app.use(cors())
app.use(express.json())
app.use(logger)

// Connect to database
connectDB()

// Initialize WebSocket server
websocketService.initializeClientWebSocketServer(WS_PORT)

// API Routes
app.use("/api", routes)

// Serve static files from React build in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from the React app build directory
  app.use(express.static(path.join(__dirname, "../client/build")))

  // Handle React routing, return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client/build", "index.html"))
  })
}

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`)
  console.log("🔧 Environment check:")
  console.log("   CLIENT_CODE:", process.env.CLIENT_CODE ? "✅ Set" : "❌ Missing")
  console.log("   MPIN:", process.env.MPIN ? "✅ Set" : "❌ Missing")
  console.log("   SMARTAPI_KEY:", process.env.SMARTAPI_KEY ? "✅ Set" : "❌ Missing")
  console.log("   TOTP_SECRET:", process.env.TOTP_SECRET ? "✅ Set" : "❌ Missing")
})

// Auto-login on startup if credentials are available
if (process.env.CLIENT_CODE && process.env.MPIN && process.env.SMARTAPI_KEY) {
  setTimeout(async () => {
    console.log("🔄 Auto-login attempt...")
    const success = await angelBrokingService.login()

    if (success) {
      websocketService.connectToAngelWebSocket(
        angelBrokingService.getFeedToken(),
        process.env.CLIENT_CODE,
        process.env.SMARTAPI_KEY,
      )
    }
  }, 3000)
}
