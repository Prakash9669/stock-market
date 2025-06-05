const WebSocket = require("ws")
const MarketData = require("../models/MarketData")
const STOCK_CONFIG = require("../config/stockConfig")

class WebSocketService {
  constructor() {
    this.angelWebSocket = null
    this.connectedClients = new Set()
    this.wss = null
    this.server = null
    this.subscriptionStatus = {}
    this.messageCount = 0
    this.lastMessageTime = null
  }

  // Initialize WebSocket server with an existing HTTP server
  initializeClientWebSocketServer(server) {
    // In production, use the same HTTP server for WebSocket
    if (process.env.NODE_ENV === "production") {
      this.server = server
      this.wss = new WebSocket.Server({ server })
      console.log("🔌 WebSocket server attached to HTTP server")
    } else {
      // In development, use a separate port
      const wsPort = process.env.WS_PORT || 8081
      this.wss = new WebSocket.Server({ port: wsPort })
      console.log(`🔌 WebSocket server running on port ${wsPort}`)
    }

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
    console.log("📋 Connection details:")
    console.log("   URL:", wsUrl.substring(0, 50) + "...")
    console.log("   Client Code:", clientCode)
    console.log("   Feed Token:", feedToken.substring(0, 10) + "...")
    console.log("   API Key:", apiKey)

    this.angelWebSocket = new WebSocket(wsUrl)

    this.angelWebSocket.on("open", () => {
      console.log("✅ Connected to Angel Broking WebSocket")
      console.log("🔄 Starting stock subscriptions...")
      this.subscribeToStocks()
    })

    this.angelWebSocket.on("message", async (data) => {
      try {
        this.messageCount++
        this.lastMessageTime = new Date()

        console.log(`📨 Message #${this.messageCount} received at ${this.lastMessageTime.toISOString()}`)
        console.log("📋 Raw message:", data.toString())

        const marketData = JSON.parse(data.toString())
        console.log("📈 Parsed market data:", JSON.stringify(marketData, null, 2))

        await this.processMarketData(marketData)
      } catch (error) {
        console.error("❌ Error processing market data:", error)
        console.error("📋 Raw data that caused error:", data.toString())
      }
    })

    this.angelWebSocket.on("close", (code, reason) => {
      console.log(`🔌 Angel Broking WebSocket connection closed. Code: ${code}, Reason: ${reason}`)
      this.subscriptionStatus = {}
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
      console.error("❌ WebSocket not connected, cannot subscribe")
      return
    }

    const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
    console.log(`📈 Subscribing to ${allStocks.length} stocks...`)

    allStocks.forEach((stock, index) => {
      const exchangeType = stock.token.length > 5 ? 2 : 1 // NSE=1, NFO=2

      const subscribeMessage = {
        action: "subscribe",
        params: {
          mode: 1,
          tokenList: [
            {
              exchangeType: exchangeType,
              tokens: [stock.token],
            },
          ],
        },
      }

      console.log(
        `📈 [${index + 1}/${allStocks.length}] Subscribing to ${stock.symbol} (Token: ${stock.token}, Exchange: ${exchangeType})`,
      )
      console.log("📋 Subscription message:", JSON.stringify(subscribeMessage, null, 2))

      this.angelWebSocket.send(JSON.stringify(subscribeMessage))
      this.subscriptionStatus[stock.token] = {
        symbol: stock.symbol,
        subscribed: true,
        timestamp: new Date(),
      }

      // Add small delay between subscriptions
      setTimeout(() => {}, 100 * index)
    })

    console.log("✅ All subscription messages sent")
    console.log("📊 Subscription status:", this.subscriptionStatus)
  }

  async processMarketData(data) {
    try {
      console.log("🔄 Processing market data:", JSON.stringify(data, null, 2))

      if (data && data.token) {
        // Find symbol for token
        const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
        const stock = allStocks.find((s) => s.token === data.token)

        if (stock) {
          console.log(`📊 Found matching stock: ${stock.symbol} for token ${data.token}`)

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

          console.log("💾 Saving to database:", JSON.stringify(marketDataDoc.toObject(), null, 2))
          const savedDoc = await marketDataDoc.save()
          console.log("✅ Saved to database with ID:", savedDoc._id)

          // Broadcast to connected clients
          this.broadcastToClients({
            type: "MARKET_UPDATE",
            data: savedDoc,
          })

          console.log("📡 Broadcasted to", this.connectedClients.size, "connected clients")
        } else {
          console.log(`❌ No matching stock found for token: ${data.token}`)
          console.log("📋 Available tokens:", allStocks.map((s) => `${s.symbol}:${s.token}`).join(", "))
        }
      } else {
        console.log("❌ Invalid market data format - missing token")
        console.log("📋 Received data keys:", Object.keys(data || {}))
      }
    } catch (error) {
      console.error("❌ Error processing market data:", error)
      console.error("📋 Error stack:", error.stack)
    }
  }

  isAngelWebSocketConnected() {
    return this.angelWebSocket && this.angelWebSocket.readyState === WebSocket.OPEN
  }

  getConnectedClientsCount() {
    return this.connectedClients.size
  }

  getWebSocketStats() {
    return {
      connected: this.isAngelWebSocketConnected(),
      messageCount: this.messageCount,
      lastMessageTime: this.lastMessageTime,
      subscriptionStatus: this.subscriptionStatus,
    }
  }
}

module.exports = new WebSocketService()
