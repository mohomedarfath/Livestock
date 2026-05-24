import { useMemo, useState } from 'react'
import { useCowMilkLogs, useCows } from '../../hooks/useCowData'
import { formatDate, getMilkDropAlerts, litresForLog, todayIso } from './cowUtils'

const EMPTY_FORM = {
  cowId: '',
  date: todayIso(),
  morningLitres: '',
  eveningLitres: '',
  rejectedLitres: '',
  fatPercent: '',
  snfPercent: '',
  notes: '',
}

export default function CowMilkLog({ onNavigate }) {
  const { cows } = useCows()
  const { milkLogs, loading, error, createMilkLog } = useCowMilkLogs()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const milkingCows = useMemo(
    () => cows.filter((cow) => !['sold', 'dead'].includes(cow.status)),
    [cows]
  )
  const todayLogs = useMemo(() => milkLogs.filter((log) => log.date === formData.date), [formData.date, milkLogs])
  const milkDropAlerts = useMemo(() => getMilkDropAlerts(cows, milkLogs), [cows, milkLogs])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFormError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cow = cows.find((item) => String(item.id) === String(formData.cowId))
    const morning = Number(formData.morningLitres || 0)
    const evening = Number(formData.eveningLitres || 0)
    const rejected = Number(formData.rejectedLitres || 0)

    if (!cow) {
      setFormError('Select a cow.')
      return
    }
    if (morning <= 0 && evening <= 0 && rejected <= 0) {
      setFormError('Enter at least one milk value.')
      return
    }
    if (rejected > morning + evening) {
      setFormError('Rejected milk cannot exceed produced milk.')
      return
    }

    await createMilkLog({
      ...formData,
      cowId: cow.id,
      cowName: cow.name,
      morningLitres: morning,
      eveningLitres: evening,
      rejectedLitres: rejected,
      fatPercent: Number(formData.fatPercent || 0),
      snfPercent: Number(formData.snfPercent || 0),
    })

    setFormData({ ...EMPTY_FORM, date: formData.date })
    setMessage('Milk log saved.')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]">Daily Milk Log</h1>
          <p className="text-[var(--text-muted)] text-sm">Record AM and PM milk per cow, including rejected milk and quality notes.</p>
        </div>
        <button type="button" onClick={() => onNavigate?.('cow-herd')} className="btn-secondary">Cow Profiles</button>
      </div>

      {(error || formError || message) && (
        <div
          className="rounded-lg px-4 py-3 text-sm mb-4"
          style={{
            background: message ? '#f0fdf4' : '#fef2f2',
            color: message ? '#166534' : '#b42318',
          }}
        >
          {message || formError || error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="card lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Cow</label>
              <select name="cowId" value={formData.cowId} onChange={handleChange} className="input-field">
                <option value="">Select cow</option>
                {milkingCows.map((cow) => (
                  <option key={cow.id} value={cow.id}>{cow.name} ({cow.tagNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Date</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Morning L</label>
                <input type="number" min="0" step="0.1" name="morningLitres" value={formData.morningLitres} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Evening L</label>
                <input type="number" min="0" step="0.1" name="eveningLitres" value={formData.eveningLitres} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Rejected L</label>
                <input type="number" min="0" step="0.1" name="rejectedLitres" value={formData.rejectedLitres} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Fat %</label>
                <input type="number" min="0" step="0.1" name="fatPercent" value={formData.fatPercent} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">SNF %</label>
                <input type="number" min="0" step="0.1" name="snfPercent" value={formData.snfPercent} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} className="input-field resize-none" rows="3" placeholder="Feed change, sickness, heat, MCC quality note" />
            </div>
            <button type="submit" className="btn-primary w-full">Save Milk Log</button>
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {milkDropAlerts.length > 0 && (
            <div className="card" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
              <h2 className="text-lg font-bold text-orange-900 mb-3">Milk Drop Alerts</h2>
              <div className="space-y-2">
                {milkDropAlerts.slice(0, 5).map((alert) => (
                  <p key={alert.cow.id} className="text-sm text-orange-800">
                    <span className="font-semibold">{alert.cow.name}</span> is down {alert.dropPercent.toFixed(0)}% from recent average.
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-bold text-[var(--text)] mb-3">Entries for {formatDate(formData.date)}</h2>
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading milk logs...</p>
            ) : todayLogs.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No milk logs for this date.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                      <th className="py-2 pr-3">Cow</th>
                      <th className="py-2 pr-3 text-right">AM</th>
                      <th className="py-2 pr-3 text-right">PM</th>
                      <th className="py-2 pr-3 text-right">Rejected</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-3 font-medium">{log.cowName || '-'}</td>
                        <td className="py-2 pr-3 text-right">{Number(log.morningLitres || 0).toFixed(1)}</td>
                        <td className="py-2 pr-3 text-right">{Number(log.eveningLitres || 0).toFixed(1)}</td>
                        <td className="py-2 pr-3 text-right">{Number(log.rejectedLitres || 0).toFixed(1)}</td>
                        <td className="py-2 text-right font-semibold">{litresForLog(log).toFixed(1)} L</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
