function DebugInfo({ debugInfo, websocketConnected }) {
  return (
    <div className="debug-container">
      <h2>Debug Information</h2>

      <div className="debug-grid">
        <div className="debug-card">
          <h3>Authentication Status</h3>
          <div className="status-row">
            <span>Authenticated:</span>
            <span className={`status ${debugInfo.authenticated ? "success" : "error"}`}>
              {debugInfo.authenticated ? "✅ Yes" : "❌ No"}
            </span>
          </div>
          <div className="status-row">
            <span>Login Method:</span>
            <span className="status">MPIN + TOTP</span>
          </div>
          <div className="status-row">
            <span>API Endpoint:</span>
            <span className="status">Angel Broking SmartAPI</span>
          </div>
        </div>

        <div className="debug-card">
          <h3>WebSocket Status</h3>
          <div className="status-row">
            <span>Angel Broking WS:</span>
            <span className={`status ${debugInfo.websocketConnected ? "success" : "error"}`}>
              {debugInfo.websocketConnected ? "✅ Connected" : "❌ Disconnected"}
            </span>
          </div>
          <div className="status-row">
            <span>Client WS:</span>
            <span className={`status ${websocketConnected ? "success" : "error"}`}>
              {websocketConnected ? "✅ Connected" : "❌ Disconnected"}
            </span>
          </div>
          <div className="status-row">
            <span>Data Stream:</span>
            <span className={`status ${debugInfo.websocketConnected ? "success" : "error"}`}>
              {debugInfo.websocketConnected ? "✅ Active" : "❌ Inactive"}
            </span>
          </div>
        </div>

        <div className="debug-card">
          <h3>Connection Info</h3>
          <div className="status-row">
            <span>Connected Clients:</span>
            <span className="status">{debugInfo.connectedClients || 0}</span>
          </div>
          <div className="status-row">
            <span>Server Port:</span>
            <span className="status">3001</span>
          </div>
          <div className="status-row">
            <span>WebSocket Port:</span>
            <span className="status">8081</span>
          </div>
        </div>

        <div className="debug-card">
          <h3>System Status</h3>
          <div className="status-row">
            <span>Server:</span>
            <span className="status success">✅ Running</span>
          </div>
          <div className="status-row">
            <span>Database:</span>
            <span className="status success">✅ Connected</span>
          </div>
          <div className="status-row">
            <span>Frontend:</span>
            <span className="status success">✅ Active</span>
          </div>
        </div>

        <div className="debug-card">
          <h3>API Configuration</h3>
          <div className="status-row">
            <span>Client Code:</span>
            <span className="status">RSIKA1012</span>
          </div>
          <div className="status-row">
            <span>API Key:</span>
            <span className="status">a2syiZnn</span>
          </div>
          <div className="status-row">
            <span>TOTP:</span>
            <span className="status success">✅ Auto-generated</span>
          </div>
        </div>

        <div className="debug-card">
          <h3>Market Data</h3>
          <div className="status-row">
            <span>Stocks Monitored:</span>
            <span className="status">16</span>
          </div>
          <div className="status-row">
            <span>NSE Stocks:</span>
            <span className="status">15</span>
          </div>
          <div className="status-row">
            <span>NFO Contracts:</span>
            <span className="status">1</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DebugInfo
