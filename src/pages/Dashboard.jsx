import { useMemo } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { useDailyLogs } from '../hooks/useDailyLogs'
import { useFlocks } from '../hooks/useFlocks'
import { useSales } from '../hooks/useSales'
import { useFeedPurchases } from '../hooks/useFeedPurchases'
import { useFarmInventory } from '../hooks/useFarmInventory'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function Dashboard({ onNavigate }) {
  const { fmt } = useCurrency()
  const { logs, loading: logsLoading, error: logsError } = useDailyLogs()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const { sales, loading: salesLoading, error: salesError } = useSales()
  const { feedPurchases, loading: feedLoading, error: feedError } = useFeedPurchases()
  const { inventory, loading: inventoryLoading, error: inventoryError } = useFarmInventory()

  const loading = logsLoading || flocksLoading || salesLoading || feedLoading || inventoryLoading
  const loadError = logsError || flocksError || salesError || feedError || inventoryError
  const today = new Date().toISOString().split('T')[0]

  const last7Days = useMemo(() => {
    const days = []
    for (let index = 6; index >= 0; index -= 1) {
      const date = new Date()
      date.setDate(date.getDate() - index)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }, [])

  const todayLogs = useMemo(() => logs.filter((log) => log.date === today), [logs, today])

  const chartData = useMemo(() => {
    return last7Days.map((date) => {
      const dayLogs = logs.filter((log) => log.date === date)
      const eggs = dayLogs.reduce((sum, log) => sum + (log.eggs || 0), 0)
      const deaths = dayLogs.reduce((sum, log) => sum + (log.deaths || 0), 0)
      const dateObj = new Date(date)
      const dayName = dateObj.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })

      return {
        date: dayName,
        eggs,
        deaths,
        fullDate: date,
      }
    })
  }, [last7Days, logs])

  const todayEggs = todayLogs.reduce((sum, log) => sum + (log.eggs || 0), 0)
  const todayDeaths = todayLogs.reduce((sum, log) => sum + (log.deaths || 0), 0)
  const todayFeed = todayLogs.reduce((sum, log) => sum + (log.feed || 0), 0).toFixed(1)
  const todayWater = todayLogs.reduce((sum, log) => sum + (log.water || 0), 0).toFixed(1)

  const thisWeekEggs = chartData.reduce((sum, day) => sum + day.eggs, 0)
  const thisWeekDeaths = chartData.reduce((sum, day) => sum + day.deaths, 0)

  const totalBirds = flocks.reduce((sum, flock) => sum + (flock.count || 0), 0)
  const layingRate = totalBirds > 0 ? Math.min(100, Math.round((todayEggs / totalBirds) * 100)) : 0

  const thisMonth = today.slice(0, 7)
  const monthSales = sales.filter((sale) => String(sale.date || '').startsWith(thisMonth))
  const monthRevenue = monthSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)
  const monthFeedCost = feedPurchases
    .filter((purchase) => String(purchase.date || '').startsWith(thisMonth))
    .reduce((sum, purchase) => sum + (purchase.totalPrice || 0), 0)
  const monthProfit = monthRevenue - monthFeedCost

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-8">
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6 pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-[var(--text-muted)] text-sm">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {loadError && (
        <div className="card mb-4" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      {(() => {
        const items = inventory?.items || []
        const lowItems = items.filter((item) => item.threshold > 0 && item.quantity <= item.threshold)
        if (!lowItems.length) return null
        return (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '14px', color: '#dc2626' }}>Low Stock Alert - {lowItems.length} item{lowItems.length > 1 ? 's' : ''} need restocking</p>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {lowItems.map((item) => (
                  <span key={item.id} style={{ fontSize: '12px', fontWeight: 600, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '99px' }}>
                    {item.name}: {item.quantity} {item.unit}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              style={{ flexShrink: 0, fontSize: '12px', fontWeight: 700, color: '#dc2626', background: 'none', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              View
            </button>
          </div>
        )
      })()}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Total Birds</p>
              <p className="text-2xl md:text-3xl font-bold text-blue-600 mt-1">{totalBirds}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Eggs Today</p>
              <p className="text-2xl md:text-3xl font-bold text-yellow-600 mt-1">{todayEggs}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Deaths Today</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600 mt-1">{todayDeaths}</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Feed Used (kg)</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600 mt-1">{todayFeed}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
        <div className="card">
          <div className="mb-3">
            <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Laying Rate</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600 mt-1">{layingRate}%</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-600 h-2 rounded-full transition-all" style={{ width: `${layingRate}%` }} />
          </div>
        </div>

        <div className={`card ${monthProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <p className="text-[var(--text-muted)] text-xs md:text-sm font-medium">Profit (Month)</p>
          <p className={`text-2xl md:text-3xl font-bold mt-1 ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {fmt(monthProfit.toFixed(0))}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
        <div className="card text-center bg-yellow-50">
          <p className="text-xs text-[var(--text-muted)] font-medium">This Week</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{thisWeekEggs}</p>
          <p className="text-xs text-[var(--text-muted)]">eggs</p>
        </div>

        <div className="card text-center bg-red-50">
          <p className="text-xs text-[var(--text-muted)] font-medium">This Week</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{thisWeekDeaths}</p>
          <p className="text-xs text-[var(--text-muted)]">deaths</p>
        </div>

        <div className="card text-center bg-blue-50">
          <p className="text-xs text-[var(--text-muted)] font-medium">Today</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{todayWater}</p>
          <p className="text-xs text-[var(--text-muted)]">L water</p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Egg Production (This Week)</h2>
        {chartData.length > 0 && thisWeekEggs > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }} />
              <Line
                type="monotone"
                dataKey="eggs"
                stroke="#E8956D"
                dot={{ fill: '#E8956D', r: 4 }}
                activeDot={{ r: 6 }}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[var(--text-muted)] text-sm text-center py-8">Start logging to see egg production trend</p>
        )}
      </div>

      {thisWeekDeaths > 0 && (
        <div className="card mb-6">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Mortality Trend (This Week)</h2>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ccc' }} />
              <Bar dataKey="deaths" fill="#DC2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {inventory?.items?.length > 0 && (() => {
        const items = inventory.items
        const lowItems = items.filter((item) => item.threshold > 0 && item.quantity <= item.threshold)
        const supplyCount = items.filter((item) => item.category === 'supply').length
        const productCount = items.filter((item) => item.category === 'sellable').length
        return (
          <div className="card mb-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 className="text-lg font-bold text-[var(--text)]">Inventory</h2>
              <button
                onClick={() => onNavigate('inventory')}
                style={{ fontSize: '12px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              >
                View all
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: lowItems.length > 0 ? '14px' : '0' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#2563eb', margin: 0 }}>{supplyCount}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Supplies</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#16a34a', margin: 0 }}>{productCount}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Products</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '22px', fontWeight: 800, color: lowItems.length > 0 ? '#dc2626' : '#16a34a', margin: 0 }}>{lowItems.length}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>Low Stock</p>
              </div>
            </div>
            {lowItems.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Low Stock Alerts</p>
                {lowItems.slice(0, 4).map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.name}</span>
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>{item.quantity} {item.unit}</span>
                  </div>
                ))}
                {lowItems.length > 4 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0' }}>+{lowItems.length - 4} more items low</p>
                )}
              </div>
            )}
          </div>
        )
      })()}

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-[var(--text)]">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onNavigate('daily-log')}
            className="card bg-farm-orange bg-opacity-10 hover:bg-opacity-20 transition-colors text-center py-4"
          >
            <p className="font-medium text-sm text-[var(--text)]">Log Today</p>
          </button>
          <button
            onClick={() => onNavigate('feed')}
            className="card bg-farm-orange bg-opacity-10 hover:bg-opacity-20 transition-colors text-center py-4"
          >
            <p className="font-medium text-sm text-[var(--text)]">Track Costs</p>
          </button>
        </div>
      </div>

      {todayLogs.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Today's Entries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {todayLogs.slice(-3).reverse().map((log, index) => (
              <div key={index} className="card bg-[var(--surface-2)] text-sm">
                <p className="text-[var(--text)]">
                  <span className="font-medium">{log.time}:</span> {log.eggs} eggs, {log.deaths} deaths, {log.feed}kg feed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
