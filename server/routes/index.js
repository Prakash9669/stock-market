const express = require("express")
const router = express.Router()

// Import route modules
const authRoutes = require("./authRoutes")
const marketDataRoutes = require("./marketDataRoutes")

// Use routes
router.use("/auth", authRoutes)
router.use("/market-data", marketDataRoutes)

module.exports = router
