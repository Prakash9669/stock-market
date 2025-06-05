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
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
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

    // Check if we've exceeded reconnection attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts (${this.maxReconnectAttempts}) exceeded. Stopping reconnections.`)
      return
    }

    const wsUrl = `wss://smartapisocket.angelone.in/smart-stream?clientCode=${clientCode}&feedToken=${feedToken}&apiKey=${apiKey}`

    console.log("🔌 Connecting to Angel Broking WebSocket...")
    console.log(`🔄 Reconnection attempt: ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`)

    this.angelWebSocket = new WebSocket(wsUrl)

    this.angelWebSocket.on("open", () => {
      console.log("✅ Connected to Angel Broking WebSocket")
      this.reconnectAttempts = 0 // Reset on successful connection

      // Send a heartbeat message first
      this.sendHeartbeat()

      // Then subscribe to stocks
      setTimeout(() => {
        this.subscribeToStocks()
      }, 1000)
    })

    this.angelWebSocket.on("message", async (data) => {
      try {
        this.messageCount++
        this.lastMessageTime = new Date()

        console.log(`📨 Message #${this.messageCount} received at ${this.lastMessageTime.toISOString()}`)
        console.log("📋 Raw message length:", data.length)
        console.log("📋 Raw message:", data.toString())

        // Try to parse as JSON
        let marketData
        try {
          marketData = JSON.parse(data.toString())
        } catch (parseError) {
          console.log("📋 Non-JSON message received:", data.toString())
          return
        }

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

      // Only reconnect if we haven't exceeded max attempts
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.min(5000 * this.reconnectAttempts, 30000) // Exponential backoff, max 30s

        setTimeout(() => {
          console.log(`🔄 Attempting to reconnect in ${delay}ms...`)
          this.connectToAngelWebSocket(feedToken, clientCode, apiKey)
        }, delay)
      } else {
        console.error("❌ Max reconnection attempts reached. Please check market hours or API status.")
      }
    })

    this.angelWebSocket.on("error", (error) => {
      console.error("❌ Angel Broking WebSocket error:", error)

      if (error.message.includes("429")) {
        console.error("🚫 Rate limited by Angel Broking. Waiting longer before reconnect...")
        this.reconnectAttempts += 2 // Penalize rate limiting more
      }
    })
  }

  sendHeartbeat() {
    if (this.angelWebSocket && this.angelWebSocket.readyState === WebSocket.OPEN) {
      const heartbeat = {
        action: "heartbeat",
        params: {
          timestamp: Date.now(),
        },
      }

      console.log("💓 Sending heartbeat to Angel Broking")
      this.angelWebSocket.send(JSON.stringify(heartbeat))
    }
  }

  subscribeToStocks() {
    if (!this.angelWebSocket || this.angelWebSocket.readyState !== WebSocket.OPEN) {
      console.error("❌ WebSocket not connected, cannot subscribe")
      return
    }

    const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
    console.log(`📈 Subscribing to ${allStocks.length} stocks...`)

    // Try different subscription modes
    const modes = [1, 2, 3] // Different data modes

    allStocks.forEach((stock, index) => {
      const exchangeType = stock.token.length > 5 ? 2 : 1 // NSE=1, NFO=2

      // Try mode 1 first (LTP), then mode 2 (Quote), then mode 3 (Snap Quote)
      modes.forEach((mode, modeIndex) => {
        const subscribeMessage = {
          action: "subscribe",
          params: {
            mode: mode,
            tokenList: [
              {
                exchangeType: exchangeType,
                tokens: [stock.token],
              },
            ],
          },
        }

        setTimeout(
          () => {
            if (this.angelWebSocket && this.angelWebSocket.readyState === WebSocket.OPEN) {
              console.log(
                `📈 [${index + 1}/${allStocks.length}] Mode ${mode}: Subscribing to ${stock.symbol} (Token: ${stock.token}, Exchange: ${exchangeType})`,
              )
              this.angelWebSocket.send(JSON.stringify(subscribeMessage))
            }
          },
          (index * modes.length + modeIndex) * 200,
        ) // Stagger subscriptions
      })

      this.subscriptionStatus[stock.token] = {
        symbol: stock.symbol,
        subscribed: true,
        timestamp: new Date(),
      }
    })

    console.log("✅ All subscription messages queued")
  }

  async processMarketData(data) {
    try {
      console.log("🔄 Processing market data:", JSON.stringify(data, null, 2))

      // Handle different message types
      if (data.action === "heartbeat") {
        console.log("💓 Heartbeat response received")
        return
      }

      if (data && data.token) {
        // Find symbol for token
        const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
        const stock = allStocks.find((s) => s.token === data.token)

        if (stock) {
          console.log(`📊 Found matching stock: ${stock.symbol} for token ${data.token}`)

          const marketDataDoc = new MarketData({
            token: data.token,
            symbol: stock.symbol,
            ltp: data.ltp || data.last_traded_price || 0,
            change: data.change || 0,
            changePercent: data.changePercent || data.change_percent || 0,
            open: data.open || data.open_price || 0,
            high: data.high || data.high_price || 0,
            low: data.low || data.low_price || 0,
            volume: data.volume || data.volume_traded || 0,
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
      reconnectAttempts: this.reconnectAttempts,
    }
  }
}

module.exports = new WebSocketService()
