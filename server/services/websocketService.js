const WebSocket = require("ws")
const MarketData = require("../models/MarketData")
const STOCK_CONFIG = require("../config/stockConfig")

class WebSocketService {
  constructor() {
    this.angelWebSocket = null
    this.connectedClients = new Set()
    this.wss = null
  }

  initializeClientWebSocketServer(port) {
    // Use the PORT environment variable for WebSocket in production
    const wsPort = process.env.NODE_ENV === "production" ? process.env.PORT : port

    this.wss = new WebSocket.Server({ port: wsPort })

    this.wss.on("connection", (ws) => {
      console.log("👤 Client connected")
      this.connectedClients.add(ws)

      // Send current market data to new client
      this.sendCurrentMarketData(ws)

      ws.on("close", () => {
        console.log("👤 Client disconnected")
        this.connectedClients.delete(ws)
      })

      ws.on("error", (error) => {
        console.error("❌ WebSocket client error:", error)
        this.connectedClients.delete(ws)
      })
    })

    console.log(`🔌 WebSocket server running on port ${wsPort}`)
  }

  async sendCurrentMarketData(ws) {
    try {
      const marketData = await MarketData.find().sort({ timestamp: -1 }).limit(50)
      ws.send(
        JSON.stringify({
          type: "MARKET_DATA",
          data: marketData,
        }),
      )
    } catch (error) {
      console.error("❌ Error sending market data:", error)
    }
  }

  broadcastToClients(data) {
    this.connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data))
      }
    })
  }

  connectToAngelWebSocket(feedToken, clientCode, apiKey) {
    if (!feedToken || !clientCode || !apiKey) {
      console.error("❌ Missing required credentials for WebSocket connection")
      return
    }

    const wsUrl = `wss://smartapisocket.angelone.in/smart-stream?clientCode=${clientCode}&feedToken=${feedToken}&apiKey=${apiKey}`

    console.log("🔌 Connecting to Angel Broking WebSocket...")

    this.angelWebSocket = new WebSocket(wsUrl)

    this.angelWebSocket.on("open", () => {
      console.log("✅ Connected to Angel Broking WebSocket")
      this.subscribeToStocks()
    })

    this.angelWebSocket.on("message", async (data) => {
      try {
        const marketData = JSON.parse(data.toString())
        console.log("📈 Received market data:", marketData)
        await this.processMarketData(marketData)
      } catch (error) {
        console.error("❌ Error processing market data:", error)
      }
    })

    this.angelWebSocket.on("close", (code, reason) => {
      console.log(`🔌 Angel Broking WebSocket connection closed. Code: ${code}, Reason: ${reason}`)
      setTimeout(() => {
        console.log("🔄 Attempting to reconnect...")
        this.connectToAngelWebSocket(feedToken, clientCode, apiKey)
      }, 5000)
    })

    this.angelWebSocket.on("error", (error) => {
      console.error("❌ Angel Broking WebSocket error:", error)
    })
  }

  subscribeToStocks() {
    if (!this.angelWebSocket || this.angelWebSocket.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not connected")
      return
    }

    const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]

    allStocks.forEach((stock) => {
      const subscribeMessage = {
        action: "subscribe",
        params: {
          mode: 1,
          tokenList: [
            {
              exchangeType: stock.token.length > 5 ? 2 : 1, // NSE=1, NFO=2
              tokens: [stock.token],
            },
          ],
        },
      }

      this.angelWebSocket.send(JSON.stringify(subscribeMessage))
      console.log(`📈 Subscribed to ${stock.symbol} (${stock.token})`)
    })
  }

  async processMarketData(data) {
    try {
      if (data && data.token) {
        // Find symbol for token
        const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
        const stock = allStocks.find((s) => s.token === data.token)

        if (stock) {
          const marketDataDoc = new MarketData({
            token: data.token,
            symbol: stock.symbol,
            ltp: data.ltp || 0,
            change: data.change || 0,
            changePercent: data.changePercent || 0,
            open: data.open || 0,
            high: data.high || 0,
            low: data.low || 0,
            volume: data.volume || 0,
          })

          await marketDataDoc.save()

          // Broadcast to connected clients
          this.broadcastToClients({
            type: "MARKET_UPDATE",
            data: marketDataDoc,
          })
        }
      }
    } catch (error) {
      console.error("❌ Error processing market data:", error)
    }
  }

  isAngelWebSocketConnected() {
    return this.angelWebSocket && this.angelWebSocket.readyState === WebSocket.OPEN
  }

  getConnectedClientsCount() {
    return this.connectedClients.size
  }
}

module.exports = new WebSocketService()
