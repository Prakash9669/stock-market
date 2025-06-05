"use client"

import { useState, useEffect, useCallback } from "react"
import "./App.css"
import Authentication from "./components/Authentication"
import DebugInfo from "./components/DebugInfo"
import Dashboard from "./components/Dashboard"
import MarketData from "./components/MarketData"

function App() {
  const [activeTab, setActiveTab] = useState("market-data")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [marketData, setMarketData] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [websocket, setWebsocket] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [debugInfo, setDebugInfo] = useState({})

  // Get WebSocket URL based on environment
  const getWebSocketUrl = () => {
    if (process.env.NODE_ENV === "production") {
      // In production, use the same domain with wss protocol
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      return `${protocol}//${window.location.host}`
    } else {
      // In development, use localhost
      return "ws://localhost:8081"
    }
  }

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const wsUrl = getWebSocketUrl()
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log("✅ Connected to WebSocket server")
      setWebsocket(ws)
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)

        if (message.type === "MARKET_DATA") {
          setMarketData(message.data)
          setLastUpdated(new Date())
        } else if (message.type === "MARKET_UPDATE") {
          setMarketData((prev) => {
            const updated = [...prev]
            const index = updated.findIndex((item) => item.token === message.data.token)
            if (index !== -1) {
              updated[index] = message.data
            } else {
              updated.push(message.data)
            }
            return updated
          })
          setLastUpdated(new Date())
        }
      } catch (error) {
        console.error("❌ Error parsing WebSocket message:", error)
      }
    }

    ws.onclose = () => {
      console.log("🔌 WebSocket connection closed")
      setWebsocket(null)
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error)
    }

    return ws
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    const ws = connectWebSocket()

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [connectWebSocket])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchMarketData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Fetch market data from API
  const fetchMarketData = async () => {
    try {
      const response = await fetch("/api/market-data")
      const result = await response.json()

      if (result.success) {
        setMarketData(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("❌ Error fetching market data:", error)
    }
  }

  // Fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch("/api/auth/status")
      const result = await response.json()

      if (result.success) {
        setDebugInfo(result.status)
        setIsAuthenticated(result.status.authenticated)
      }
    } catch (error) {
      console.error("❌ Error fetching debug info:", error)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchMarketData()
    fetchDebugInfo()

    // Fetch debug info every 10 seconds
    const interval = setInterval(fetchDebugInfo, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (credentials) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success) {
        setIsAuthenticated(true)
        setActiveTab("market-data")
        return { success: true }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      return { success: false, message: error.message }
    }
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "authentication":
        return <Authentication onLogin={handleLogin} isAuthenticated={isAuthenticated} />
      case "debug-info":
        return <DebugInfo debugInfo={debugInfo} websocketConnected={!!websocket} />
      case "dashboard":
        return <Dashboard marketData={marketData} lastUpdated={lastUpdated} />
      case "market-data":
      default:
        return (
          <MarketData
            marketData={marketData}
            lastUpdated={lastUpdated}
            autoRefresh={autoRefresh}
            onAutoRefreshChange={setAutoRefresh}
            onRefresh={fetchMarketData}
          />
        )
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Angel Broking Live Market Data</h1>
        <p>Real-time market data using SmartAPI with MongoDB storage</p>
      </header>

      <nav className="app-nav">
        <button
          className={activeTab === "authentication" ? "active" : ""}
          onClick={() => setActiveTab("authentication")}
        >
          Authentication
        </button>
        <button className={activeTab === "debug-info" ? "active" : ""} onClick={() => setActiveTab("debug-info")}>
          Debug Info
        </button>
        <button className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>
          Dashboard
        </button>
        <button className={activeTab === "market-data" ? "active" : ""} onClick={() => setActiveTab("market-data")}>
          Market Data
        </button>
      </nav>

      <main className="app-main">{renderActiveTab()}</main>
    </div>
  )
}

export default App
