function Dashboard({ marketData, lastUpdated }) {
  const totalStocks = marketData.length
  const gainers = marketData.filter((stock) => stock.change > 0).length
  const losers = marketData.filter((stock) => stock.change < 0).length
  const unchanged = marketData.filter((stock) => stock.change === 0).length

  const topGainers = marketData
    .filter((stock) => stock.change > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5)

  const topLosers = marketData
    .filter((stock) => stock.change < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5)

  return (
    <div className="dashboard-container">
      <h2>Market Dashboard</h2>

      {lastUpdated && <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</p>}

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Stocks</h3>
          <div className="stat-value">{totalStocks}</div>
        </div>

        <div className="stat-card gainers">
          <h3>Gainers</h3>
          <div className="stat-value">{gainers}</div>
        </div>

        <div className="stat-card losers">
          <h3>Losers</h3>
          <div className="stat-value">{losers}</div>
        </div>

        <div className="stat-card">
          <h3>Unchanged</h3>
          <div className="stat-value">{unchanged}</div>
        </div>
      </div>

      <div className="dashboard-lists">
        <div className="top-list">
          <h3>Top Gainers</h3>
          <div className="stock-list">
            {topGainers.map((stock, index) => (
              <div key={stock.token} className="stock-item gainer">
                <span className="symbol">{stock.symbol}</span>
                <span className="change">+{stock.changePercent.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="top-list">
          <h3>Top Losers</h3>
          <div className="stock-list">
            {topLosers.map((stock, index) => (
              <div key={stock.token} className="stock-item loser">
                <span className="symbol">{stock.symbol}</span>
                <span className="change">{stock.changePercent.toFixed(2)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
