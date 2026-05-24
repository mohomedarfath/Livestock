import { useMemo } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import {
  useCowBreedingRecords,
  useCowHealthRecords,
  useCowMilkLogs,
  useCows,
  useMilkPayments,
} from '../../hooks/useCowData'
import { daysUntil, formatDate, getMilkDropAlerts, latestRecord, litresForLog, sumLitres, todayIso } from './cowUtils'

function StatCard({ label, value, sub, tone = '#2563eb' }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: tone }}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  )
}

export default function CowDashboard({ onNavigate }) {
  const { fmt } = useCurrency()
  const { cows, loading: cowsLoading, error: cowsError } = useCows()
  const { milkLogs, loading: logsLoading, error: logsError } = useCowMilkLogs()
  const { breedingRecords } = useCowBreedingRecords()
  const { healthRecords } = useCowHealthRecords()
  const { milkPayments } = useMilkPayments()

  const today = todayIso()
  const stats = useMemo(() => {
    const todayLogs = milkLogs.filter((log) => log.date === today)
    const last7 = milkLogs.filter((log) => {
      const age = daysUntil(log.date)
      return age !== null && age <= 0 && age >= -6
    })
    const activeCows = cows.filter((cow) => !['sold', 'dead'].includes(cow.status))
    const milkingCows = cows.filter((cow) => cow.status === 'milking')
    const activeWithdrawals = healthRecords.filter((record) => {
      const remaining = daysUntil(record.withdrawalUntil)
      return remaining !== null && remaining >= 0
    })
    const milkDropAlerts = getMilkDropAlerts(cows, milkLogs)
    const nextBreeding = breedingRecords
      .map((record) => ({
        ...record,
        reminderDate: record.expectedCalvingDate || record.pregnancyCheckDate || record.dryOffDate || record.eventDate,
      }))
      .filter((record) => {
        const remaining = daysUntil(record.reminderDate)
        return remaining !== null && remaining >= 0
      })
      .sort((left, right) => String(left.reminderDate).localeCompare(String(right.reminderDate)))[0]

    return {
      activeCows,
      milkingCows,
      todayLitres: sumLitres(todayLogs),
      weeklyLitres: sumLitres(last7),
      activeWithdrawals,
      milkDropAlerts,
      nextBreeding,
      lastPayment: latestRecord(milkPayments, 'toDate'),
    }
  }, [breedingRecords, cows, healthRecords, milkLogs, milkPayments, today])

  const loading = cowsLoading || logsLoading
  const error = cowsError || logsError

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="card text-center py-10">
          <p className="text-sm text-[var(--text-muted)]">Loading cow dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Cow Dashboard</h1>
          <p className="text-[var(--text-muted)] text-sm">Morning milk, breeding, health, and payment priorities in one view.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => onNavigate?.('cow-milk-log')} className="btn-primary">Log Milk</button>
          <button type="button" onClick={() => onNavigate?.('cow-herd')} className="btn-secondary">Add Cow</button>
        </div>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderColor: '#fecaca', background: '#fef2f2', color: '#b42318' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Active cows" value={stats.activeCows.length} sub={`${stats.milkingCows.length} in milk`} tone="#2563eb" />
        <StatCard label="Milk today" value={`${stats.todayLitres.toFixed(1)} L`} sub="AM + PM minus rejected" tone="#059669" />
        <StatCard label="Last 7 days" value={`${stats.weeklyLitres.toFixed(1)} L`} sub="Recorded production" tone="#7c3aed" />
        <StatCard
          label="Last payment"
          value={stats.lastPayment ? fmt(stats.lastPayment.actualPayment) : fmt(0)}
          sub={stats.lastPayment ? `${formatDate(stats.lastPayment.fromDate)} to ${formatDate(stats.lastPayment.toDate)}` : 'No passbook entry yet'}
          tone="#d97706"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-[var(--text)]">Cows Needing Attention</h2>
            <button type="button" onClick={() => onNavigate?.('cow-health')} className="btn-secondary" style={{ minHeight: '36px', padding: '7px 12px' }}>Health Log</button>
          </div>

          {stats.milkDropAlerts.length === 0 && stats.activeWithdrawals.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No milk-drop or withdrawal alerts right now.</p>
          ) : (
            <div className="space-y-3">
              {stats.milkDropAlerts.slice(0, 4).map((alert) => (
                <div key={alert.cow.id} className="rounded-lg p-3 border" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
                  <p className="font-semibold text-orange-800">{alert.cow.name} dropped {alert.dropPercent.toFixed(0)}%</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Latest {alert.latestLitres.toFixed(1)} L vs recent average {alert.previousAverage.toFixed(1)} L. Check mastitis, feed, fever, or heat stress.
                  </p>
                </div>
              ))}
              {stats.activeWithdrawals.slice(0, 4).map((record) => (
                <div key={record.id} className="rounded-lg p-3 border" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
                  <p className="font-semibold text-red-800">{record.cowName || 'Cow'} milk withdrawal active</p>
                  <p className="text-xs text-red-700 mt-1">Do not sell milk until {formatDate(record.withdrawalUntil)}.</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Next Breeding Task</h2>
          {stats.nextBreeding ? (
            <div>
              <p className="font-semibold text-[var(--text)]">{stats.nextBreeding.cowName || 'Cow'}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">{stats.nextBreeding.eventType.replaceAll('_', ' ')}</p>
              <p className="text-2xl font-bold text-[var(--accent)] mt-3">{formatDate(stats.nextBreeding.reminderDate)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{daysUntil(stats.nextBreeding.reminderDate)} day(s) away</p>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No upcoming breeding reminders yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-bold text-[var(--text)]">Recent Milk Logs</h2>
          <button type="button" onClick={() => onNavigate?.('cow-milk-log')} className="btn-secondary" style={{ minHeight: '36px', padding: '7px 12px' }}>Open Log</button>
        </div>
        {milkLogs.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No milk records yet. Add cows, then log AM and PM litres.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Cow</th>
                  <th className="py-2 pr-3 text-right">AM</th>
                  <th className="py-2 pr-3 text-right">PM</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {milkLogs.slice(0, 8).map((log) => (
                  <tr key={log.id} className="border-b border-[var(--border)]">
                    <td className="py-2 pr-3">{formatDate(log.date)}</td>
                    <td className="py-2 pr-3 font-medium">{log.cowName || '-'}</td>
                    <td className="py-2 pr-3 text-right">{Number(log.morningLitres || 0).toFixed(1)} L</td>
                    <td className="py-2 pr-3 text-right">{Number(log.eveningLitres || 0).toFixed(1)} L</td>
                    <td className="py-2 text-right font-semibold">{litresForLog(log).toFixed(1)} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
