const angelBrokingService = require("../services/angelBrokingService")
const websocketService = require("../services/websocketService")

const login = async (req, res) => {
  try {
    const success = await angelBrokingService.login()

    if (success) {
      // Connect to Angel Broking WebSocket after successful login
      websocketService.connectToAngelWebSocket(
        angelBrokingService.getFeedToken(),
        process.env.CLIENT_CODE,
        process.env.SMARTAPI_KEY,
      )

      res.json({ success: true, message: "Login successful" })
    } else {
      res.status(400).json({ success: false, message: "Both login methods failed" })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getStatus = (req, res) => {
  res.json({
    success: true,
    status: {
      authenticated: angelBrokingService.isAuthenticated(),
      websocketConnected: websocketService.isAngelWebSocketConnected(),
      connectedClients: websocketService.getConnectedClientsCount(),
    },
  })
}

const testTOTP = (req, res) => {
  try {
    const currentTOTP = angelBrokingService.generateTOTP()
    res.json({
      success: true,
      totp: currentTOTP,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  login,
  getStatus,
  testTOTP,
}
