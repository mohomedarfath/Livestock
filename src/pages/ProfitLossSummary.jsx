import { useMemo } from 'react'
import { useCurrency } from '../utils/currency.jsx'
import { useFlocks } from '../hooks/useFlocks'
import { useSales } from '../hooks/useSales'
import { useFeedPurchases } from '../hooks/useFeedPurchases'

function readMedicineLog() {
  try {
    return JSON.parse(localStorage.getItem('clucktrack_medicinelog') || '[]')
  } catch {
    return []
  }
}

export default function ProfitLossSummary() {
  const { fmt } = useCurrency()
  const { flocks, loading: flocksLoading, error: flocksError } = useFlocks()
  const { sales, loading: salesLoading, error: salesError } = useSales()
  const { feedPurchases, loading: feedLoading, error: feedError } = useFeedPurchases()

  const loading = flocksLoading || salesLoading || feedLoading
  const loadError = flocksError || salesError || feedError
  const medicineLog = useMemo(() => readMedicineLog(), [])

  const summaries = useMemo(() => {
    const totalBirds = flocks.reduce((sum, flock) => sum + (flock.count || 0), 0)

    const flockSummaries = flocks.map((flock) => {
      const flockSales = sales.filter((sale) => sale.flockId === flock.id || sale.flockName === flock.name || sale.flock === flock.name)
      const revenue = flockSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)

      const flockShare = totalBirds > 0 ? (flock.count || 0) / totalBirds : 0
      const feedCost = feedPurchases.reduce((sum, purchase) => {
        const cost = (purchase.kg || 0) * (purchase.pricePerKg || 0)
        return sum + cost * flockShare
      }, 0)

      const flockMedicine = medicineLog.filter((medicine) => medicine.flockName === flock.name)
      const medicineCost = flockMedicine.length > 0
        ? flockMedicine.reduce((sum, medicine) => sum + (medicine.cost || 0), 0)
        : medicineLog.reduce((sum, medicine) => sum + (medicine.cost || 0), 0) * flockShare

      const labourCost = (flock.count || 0) * 100 * 0.25
      const totalCost = feedCost + medicineCost + labourCost
      const profit = revenue - totalCost
      const profitPerBird = flock.count > 0 ? profit / flock.count : 0

      return {
        flockId: flock.id,
        flockName: flock.name,
        revenue,
        feedCost,
        medicineCost,
        labourCost,
        totalCost,
        profit,
        profitPerBird,
        salesCount: flockSales.length,
      }
    })

    const retailSales = sales.filter((sale) => sale.type === 'shop_order')
    const retailRevenue = retailSales.reduce((sum, sale) => sum + (sale.totalPrice || 0), 0)

    if (retailSales.length > 0) {
      flockSummaries.push({
        flockId: 'shop-retail',
        flockName: 'Shop Retail Orders',
        revenue: retailRevenue,
        feedCost: 0,
        medicineCost: 0,
        labourCost: 0,
        totalCost: 0,
        profit: retailRevenue,
        profitPerBird: 0,
        salesCount: retailSales.length,
      })
    }

    return flockSummaries
  }, [feedPurchases, flocks, medicineLog, sales])

  const overallStats = useMemo(() => {
    const totalRevenue = summaries.reduce((sum, summary) => sum + summary.revenue, 0)
    const totalCost = summaries.reduce((sum, summary) => sum + summary.totalCost, 0)
    const totalProfit = summaries.reduce((sum, summary) => sum + summary.profit, 0)

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0,
    }
  }, [summaries])

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading profit and loss data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Profit/Loss Summary</h1>
        <p className="text-[var(--text-muted)] text-sm">Financial overview of all flocks</p>
      </div>

      {loadError && (
        <div className="card mb-4" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626' }}>
          {loadError}
        </div>
      )}

      {summaries.length > 0 && (
        <div className="space-y-3 mb-6">
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-[var(--text-muted)] text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{fmt(overallStats.totalRevenue.toFixed(0))}</p>
          </div>

          <div className="card bg-gradient-to-br from-red-50 to-red-100">
            <p className="text-[var(--text-muted)] text-sm font-medium">Total Costs</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{fmt(overallStats.totalCost.toFixed(0))}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Feed + Medicine + Labour</p>
          </div>

          <div className={`card bg-gradient-to-br ${overallStats.totalProfit >= 0 ? 'from-emerald-50 to-emerald-100' : 'from-pink-50 to-pink-100'}`}>
            <p className="text-[var(--text-muted)] text-sm font-medium">Total Profit / Loss</p>
            <p className={`text-3xl font-bold mt-1 ${overallStats.totalProfit >= 0 ? 'text-emerald-600' : 'text-pink-600'}`}>
              {overallStats.totalProfit >= 0 ? '+' : ''}{fmt(overallStats.totalProfit.toFixed(0))}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1 whitespace-nowrap">Profit Margin: {overallStats.profitMargin}%</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Flock-wise Breakdown</h2>

        {summaries.length === 0 ? (
          <div className="card bg-blue-50 text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">No flocks or insufficient data. Start recording sales and expenses.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <div
                key={summary.flockId}
                className={`card border-l-4 ${summary.profit >= 0 ? 'border-green-500' : 'border-red-500'}`}
              >
                <h3 className="font-bold text-lg text-[var(--text)] mb-3">{summary.flockName}</h3>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-[var(--text-muted)]">Revenue</p>
                    <p className="text-xl font-bold text-blue-600">{fmt(summary.revenue.toFixed(0))}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{summary.salesCount} sales</p>
                  </div>

                  <div className={`p-3 rounded ${summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-[var(--text-muted)]">Profit/Loss</p>
                    <p className={`text-xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {summary.profit >= 0 ? '+' : ''}{fmt(summary.profit.toFixed(0))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Per Bird: {fmt(summary.profitPerBird.toFixed(1))}</p>
                  </div>
                </div>

                <div className="bg-[var(--surface-2)] p-3 rounded mb-3">
                  <p className="text-xs font-bold text-[var(--text)] mb-2">Cost Breakdown</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Feed Cost</span>
                      <span className="font-medium">{fmt(summary.feedCost.toFixed(0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Medicine Cost</span>
                      <span className="font-medium">{fmt(summary.medicineCost.toFixed(0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--text-muted)]">Labour (Estimated)</span>
                      <span className="font-medium">{fmt(summary.labourCost.toFixed(0))}</span>
                    </div>
                    <div className="flex justify-between border-t border-[var(--border)] pt-1 mt-1 font-bold">
                      <span>Total Cost</span>
                      <span>{fmt(summary.totalCost.toFixed(0))}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${summary.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{
                      width: summary.revenue > 0
                        ? `${Math.min(Math.abs((summary.profit / summary.revenue) * 100), 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 card bg-yellow-50 border-l-4 border-yellow-400">
        <h3 className="font-bold text-yellow-900 mb-2">Financial Tips</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>Monitor feed costs because they are usually the largest expense.</li>
          <li>Record all expenses for more accurate profit calculation.</li>
          <li>Compare profit per bird across flocks to spot stronger performers.</li>
          <li>Track seasonality because egg prices can change throughout the year.</li>
        </ul>
      </div>
    </div>
  )
}
