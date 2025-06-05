"use client"

function MarketData({ marketData, lastUpdated, autoRefresh, onAutoRefreshChange, onRefresh }) {
  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`
  }

  const formatChange = (change, changePercent) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}₹${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`
  }

  const getChangeClass = (change) => {
    if (change > 0) return "positive"
    if (change < 0) return "negative"
    return "neutral"
  }

  // Mock data for demonstration when no real data is available
  const mockData = [
    {
      token: "3045",
      symbol: "SBIN",
      ltp: 417.15,
      change: 0.05,
      changePercent: 0.01,
      open: 417.15,
      high: 419.0,
      low: 415.95,
      volume: 0,
    },
    {
      token: "881",
      symbol: "RELIANCE",
      ltp: 1251.9,
      change: 3.6,
      changePercent: 0.29,
      open: 1248.3,
      high: 1266.0,
      low: 1246.3,
      volume: 0,
    },
    {
      token: "99926004",
      symbol: "INFY",
      ltp: 3380.9,
      change: -24.3,
      changePercent: -0.71,
      open: 3389.0,
      high: 3394.8,
      low: 3370.0,
      volume: 0,
    },
    {
      token: "2885",
      symbol: "TCS",
      ltp: 2885.45,
      change: 12.75,
      changePercent: 0.44,
      open: 2872.7,
      high: 2890.0,
      low: 2870.0,
      volume: 0,
    },
    {
      token: "1333",
      symbol: "HDFCBANK",
      ltp: 1660.25,
      change: -5.8,
      changePercent: -0.35,
      open: 1666.05,
      high: 1668.0,
      low: 1658.0,
      volume: 0,
    },
  ]

  const displayData = marketData.length > 0 ? marketData : mockData

  return (
    <div className="market-data-container">
      <div className="market-data-header">
        <h2>Live Market Data</h2>
        {lastUpdated && <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
      </div>

      <div className="market-controls">
        <label className="auto-refresh-control">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => onAutoRefreshChange(e.target.checked)} />
          Auto-refresh (30s)
        </label>

        <button className="refresh-btn" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {marketData.length === 0 && (
        <div className="demo-notice">
          <p>
            📊 <strong>Demo Mode:</strong> Showing sample data. Angel Broking authentication in progress...
          </p>
        </div>
      )}

      <div className="market-table-container">
        <table className="market-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>LTP</th>
              <th>Change</th>
              <th>Open</th>
              <th>High</th>
              <th>Low</th>
              <th>Volume</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((stock) => (
              <tr key={stock.token}>
                <td className="symbol-cell">
                  <div className="symbol-info">
                    <span className="symbol">{stock.symbol}</span>
                    <span className="token">TOKEN_{stock.token}</span>
                  </div>
                </td>
                <td className="ltp-cell">{formatCurrency(stock.ltp)}</td>
                <td className={`change-cell ${getChangeClass(stock.change)}`}>
                  {formatChange(stock.change, stock.changePercent)}
                </td>
                <td>{formatCurrency(stock.open)}</td>
                <td>{formatCurrency(stock.high)}</td>
                <td>{formatCurrency(stock.low)}</td>
                <td>{stock.volume.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default MarketData
