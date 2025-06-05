const express = require("express")
const router = express.Router()
const authController = require("../controllers/authController")

// POST /api/auth/login
router.post("/login", authController.login)

// GET /api/auth/status
router.get("/status", authController.getStatus)

// GET /api/auth/test-totp
router.get("/test-totp", authController.testTOTP)

module.exports = router
