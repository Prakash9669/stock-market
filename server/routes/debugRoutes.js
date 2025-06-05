const express = require("express")
const router = express.Router()
const debugController = require("../controllers/debugController")

// GET /api/debug
router.get("/", debugController.getDebugInfo)

// POST /api/debug/login
router.post("/login", debugController.triggerLogin)

// POST /api/debug/mock-data
router.post("/mock-data", debugController.addMockData)

module.exports = router
