const axios = require("axios")
const MarketData = require("../models/MarketData")
const STOCK_CONFIG = require("../config/stockConfig")

class MarketDataService {
  constructor() {
    this.baseUrl = "https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/"
    this.lastFetchTime = null
    this.rateLimitDelay = 1000 // 1 second between requests
  }

  async fetchMarketData(authToken, mode = "FULL") {
    try {
      if (!authToken) {
        throw new Error("Authentication token required")
      }

      // Prepare request payload
      const exchangeTokens = {
        NSE: STOCK_CONFIG.NSE.map((stock) => stock.token),
        NFO: STOCK_CONFIG.NFO.map((stock) => stock.token),
      }

      const requestPayload = {
        mode: mode,
        exchangeTokens: exchangeTokens,
      }

      console.log("📊 Fetching market data via REST API...")
      console.log("📋 Request payload:", JSON.stringify(requestPayload, null, 2))

      // Make API request
      const response = await axios.post(this.baseUrl, requestPayload, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${authToken}`,
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": process.env.CLIENT_IP || "192.168.1.1",
          "X-ClientPublicIP": process.env.PUBLIC_IP || "103.21.58.192",
          "X-MACAddress": "00:0a:95:9d:68:16",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
      })

      console.log("✅ Market data API response received")
      console.log("📋 Response status:", response.status)
      console.log("📋 Response data:", JSON.stringify(response.data, null, 2))

      if (response.data && response.data.status) {
        await this.processMarketDataResponse(response.data)
        this.lastFetchTime = new Date()
        return {
          success: true,
          data: response.data,
          fetchTime: this.lastFetchTime,
        }
      } else {
        throw new Error(`API Error: ${response.data?.message || "Unknown error"}`)
      }
    } catch (error) {
      console.error("❌ Error fetching market data:", error.message)
      if (error.response) {
        console.error("📋 Error response:", error.response.data)
      }
      throw error
    }
  }

  async processMarketDataResponse(apiResponse) {
    try {
      const { fetched, unfetched } = apiResponse.data

      console.log(`📊 Processing ${fetched.length} fetched records`)
      if (unfetched.length > 0) {
        console.log(`⚠️ ${unfetched.length} unfetched records:`, unfetched)
      }

      // Process fetched data
      for (const stockData of fetched) {
        await this.saveMarketData(stockData)
      }

      console.log(`✅ Successfully processed ${fetched.length} market data records`)
    } catch (error) {
      console.error("❌ Error processing market data response:", error)
      throw error
    }
  }

  async saveMarketData(stockData) {
    try {
      // Find the symbol name from our config
      const allStocks = [...STOCK_CONFIG.NSE, ...STOCK_CONFIG.NFO]
      const stockConfig = allStocks.find((s) => s.token === stockData.symbolToken)

      if (!stockConfig) {
        console.log(`⚠️ Unknown token: ${stockData.symbolToken}`)
        return
      }

      // Create market data document
      const marketDataDoc = new MarketData({
        token: stockData.symbolToken,
        symbol: stockConfig.symbol,
        ltp: stockData.ltp || 0,
        change: stockData.netChange || 0,
        changePercent: stockData.percentChange || 0,
        open: stockData.open || 0,
        high: stockData.high || 0,
        low: stockData.low || 0,
        volume: stockData.tradeVolume || 0,
        timestamp: new Date(),
      })

      // Save to database
      const savedDoc = await marketDataDoc.save()
      console.log(`💾 Saved ${stockConfig.symbol}: LTP ₹${stockData.ltp}`)

      return savedDoc
    } catch (error) {
      console.error("❌ Error saving market data:", error)
      throw error
    }
  }

  async getLatestMarketData() {
    try {
      // Get latest data for each symbol
      const latestData = await MarketData.aggregate([
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: "$symbol",
            latestData: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: { newRoot: "$latestData" },
        },
        {
          $sort: { symbol: 1 },
        },
      ])

      return latestData
    } catch (error) {
      console.error("❌ Error getting latest market data:", error)
      throw error
    }
  }

  getLastFetchTime() {
    return this.lastFetchTime
  }
}

module.exports = new MarketDataService()
