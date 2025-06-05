const marketDataRoutes = require("./marketDataRoutes")
const authRoutes = require("./authRoutes")
const systemRoutes = require("./systemRoutes")

const setupRoutes = (app) => {
  // API routes
  app.use("/api/market-data", marketDataRoutes)
  app.use("/api/auth", authRoutes)
  app.use("/api/system", systemRoutes)

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      message: "Angel Broking Real-Time Market Data API",
      version: "1.0.0",
      endpoints: {
        marketData: "/api/market-data",
        authentication: "/api/auth",
        system: "/api/system",
        websocket: "/ws",
      },
      documentation: "https://github.com/your-repo/angel-broking-backend",
    })
  })

  console.log("📋 API routes configured")
}

module.exports = {
  setupRoutes,
}
