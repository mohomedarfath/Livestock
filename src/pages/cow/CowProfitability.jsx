import { useMemo } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useFeedPurchases } from '../../hooks/useFeedPurchases'
import { useCowHealthRecords, useCowMilkLogs, useCows, useMilkPayments } from '../../hooks/useCowData'
import { logsForCow, sumLitres } from './cowUtils'

export default function CowProfitability({ onNavigate }) {
  const { fmt } = useCurrency()
  const { cows, loading: cowsLoading, error: cowsError } = useCows()
  const { milkLogs, loading: logsLoading, error: logsError } = useCowMilkLogs()
  const { healthRecords } = useCowHealthRecords()
  const { milkPayments } = useMilkPayments()
  const { feedPurchases, loading: feedLoading, error: feedError } = useFeedPurchases()

  const data = useMemo(() => {
    const totalMilk = sumLitres(milkLogs)
    const paymentLitres = milkPayments.reduce((sum, payment) => sum + Number(payment.litres || 0), 0)
    const paymentRevenue = milkPayments.reduce((sum, payment) => sum + Number(payment.actualPayment || 0), 0)
    const averageMilkRate = paymentLitres > 0 ? paymentRevenue / paymentLitres : 0
    const totalFeedCost = feedPurchases.reduce((sum, purchase) => {
      const explicitTotal = Number(purchase.totalPrice || 0)
      return sum + (explicitTotal || (Number(purchase.kg || 0) * Number(purchase.pricePerKg || 0)))
    }, 0)

    const rows = cows.map((cow) => {
      const cowMilkLogs = logsForCow(milkLogs, cow.id)
      const litres = sumLitres(cowMilkLogs)
      const milkShare = totalMilk > 0 ? litres / totalMilk : (cows.length > 0 ? 1 / cows.length : 0)
      const revenue = litres * averageMilkRate
      const feedCost = totalFeedCost * milkShare
      const healthCost = healthRecords
        .filter((record) => String(record.cowId) === String(cow.id))
        .reduce((sum, record) => sum + Number(record.cost || 0), 0)
      const serviceCost = 0
      const totalCost = feedCost + healthCost + serviceCost
      const profit = revenue - totalCost

      return {
        cow,
        litres,
        revenue,
        feedCost,
        healthCost,
        totalCost,
        profit,
        profitPerLitre: litres > 0 ? profit / litres : 0,
      }
    }).sort((left, right) => right.profit - left.profit)

    return {
      rows,
      totalMilk,
      averageMilkRate,
      totalRevenue: rows.reduce((sum, row) => sum + row.revenue, 0),
      totalCost: rows.reduce((sum, row) => sum + row.totalCost, 0),
      totalProfit: rows.reduce((sum, row) => sum + row.profit, 0),
    }
  }, [cows, feedPurchases, healthRecords, milkLogs, milkPayments])

  const loading = cowsLoading || logsLoading || feedLoading
  const error = cowsError || logsError || feedError

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Cow Profitability</h1>
          <p className="text-[var(--text-muted)] text-sm">Milk revenue minus allocated feed and direct health cost, ranked per cow.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => onNavigate?.('milk-passbook')} className="btn-secondary">Milk Passbook</button>
          <button type="button" onClick={() => onNavigate?.('feed')} className="btn-secondary">Feed Costs</button>
        </div>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b42318' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Milk recorded</p>
          <p className="text-2xl font-bold text-[#2563eb]">{data.totalMilk.toFixed(1)} L</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Avg paid rate</p>
          <p className="text-2xl font-bold text-[#059669]">{fmt(data.averageMilkRate)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Total cost</p>
          <p className="text-2xl font-bold text-[#dc2626]">{fmt(data.totalCost)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Estimated profit</p>
          <p className={`text-2xl font-bold ${data.totalProfit >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'}`}>{fmt(data.totalProfit)}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Per-Cow Ranking</h2>
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading profitability...</p>
        ) : data.rows.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Add cows, milk logs, feed costs, and milk payments to calculate profitability.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3">Cow</th>
                  <th className="py-2 pr-3 text-right">Milk</th>
                  <th className="py-2 pr-3 text-right">Revenue</th>
                  <th className="py-2 pr-3 text-right">Feed</th>
                  <th className="py-2 pr-3 text-right">Health</th>
                  <th className="py-2 pr-3 text-right">Profit</th>
                  <th className="py-2 text-right">Profit/L</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.cow.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3">
                      <p className="font-semibold text-[var(--text)]">{row.cow.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{row.cow.tagNumber}</p>
                    </td>
                    <td className="py-2 pr-3 text-right">{row.litres.toFixed(1)} L</td>
                    <td className="py-2 pr-3 text-right">{fmt(row.revenue)}</td>
                    <td className="py-2 pr-3 text-right">{fmt(row.feedCost)}</td>
                    <td className="py-2 pr-3 text-right">{fmt(row.healthCost)}</td>
                    <td className={`py-2 pr-3 text-right font-semibold ${row.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(row.profit)}</td>
                    <td className="py-2 text-right">{fmt(row.profitPerLitre)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-4" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
        <p className="text-sm text-yellow-900">
          Feed cost is allocated by each cow&apos;s share of recorded milk. For tighter accounting, add cow-specific feed allocation in the next release.
        </p>
      </div>
    </div>
  )
}
