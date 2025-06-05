"use client"

import { useState } from "react"

function Authentication({ onLogin, isAuthenticated }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const result = await onLogin({})

    if (result.success) {
      setMessage("✅ Login successful!")
    } else {
      setMessage(`❌ Login failed: ${result.message}`)
    }

    setLoading(false)
  }

  if (isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-success">
          <h2>✅ Authentication Successful</h2>
          <p>You are now connected to Angel Broking API</p>
          <div className="status-indicator">
            <span className="status-dot active"></span>
            <span>Connected</span>
          </div>
          <div className="credentials-info">
            <h3>Using Credentials:</h3>
            <p>
              <strong>Client Code:</strong> RSIKA1012
            </p>
            <p>
              <strong>API Key:</strong> a2syiZnn
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>Angel Broking Authentication</h2>
        <div className="credentials-display">
          <h3>Configured Credentials:</h3>
          <div className="credential-item">
            <span className="label">Client Code:</span>
            <span className="value">RSIKA1012</span>
          </div>
          <div className="credential-item">
            <span className="label">API Key:</span>
            <span className="value">a2syiZnn</span>
          </div>
          <div className="credential-item">
            <span className="label">TOTP:</span>
            <span className="value">Auto-generated</span>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login with Configured Credentials"}
        </button>

        {message && <div className={`message ${message.includes("✅") ? "success" : "error"}`}>{message}</div>}
      </div>
    </div>
  )
}

export default Authentication
