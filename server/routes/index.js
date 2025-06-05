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

module.exports = router
