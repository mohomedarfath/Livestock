import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useCowMilkLogs, useMilkPayments } from '../../hooks/useCowData'
import { formatDate, sumLitres, todayIso } from './cowUtils'

const EMPTY_FORM = {
  fromDate: todayIso().slice(0, 8) + '01',
  toDate: todayIso(),
  buyerName: '',
  litres: '',
  rate: '',
  fatSnfBonus: '',
  deductions: '',
  actualPayment: '',
  notes: '',
}

export default function MilkPassbook() {
  const { fmt } = useCurrency()
  const { milkLogs } = useCowMilkLogs()
  const { milkPayments, loading, error, createMilkPayment } = useMilkPayments()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const loggedLitres = useMemo(() => {
    return sumLitres(milkLogs.filter((log) => log.date >= formData.fromDate && log.date <= formData.toDate))
  }, [formData.fromDate, formData.toDate, milkLogs])

  const expectedPayment = useMemo(() => {
    return (Number(formData.litres || loggedLitres || 0) * Number(formData.rate || 0)) +
      Number(formData.fatSnfBonus || 0) -
      Number(formData.deductions || 0)
  }, [formData.deductions, formData.fatSnfBonus, formData.litres, formData.rate, loggedLitres])

  const summary = useMemo(() => {
    const totalExpected = milkPayments.reduce((sum, payment) => sum + Number(payment.expectedPayment || 0), 0)
    const totalActual = milkPayments.reduce((sum, payment) => sum + Number(payment.actualPayment || 0), 0)
    return {
      totalLitres: milkPayments.reduce((sum, payment) => sum + Number(payment.litres || 0), 0),
      totalExpected,
      totalActual,
      variance: totalActual - totalExpected,
    }
  }, [milkPayments])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFormError('')
    setMessage('')
  }

  const useLoggedLitres = () => {
    setFormData((current) => ({ ...current, litres: loggedLitres.toFixed(1) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.fromDate || !formData.toDate || !formData.buyerName.trim()) {
      setFormError('Date range and buyer/MCC are required.')
      return
    }
    if (Number(formData.litres || loggedLitres || 0) <= 0 || Number(formData.rate || 0) <= 0) {
      setFormError('Litres and rate must be greater than 0.')
      return
    }

    await createMilkPayment({
      ...formData,
      buyerName: formData.buyerName.trim(),
      litres: Number(formData.litres || loggedLitres || 0),
      rate: Number(formData.rate || 0),
      fatSnfBonus: Number(formData.fatSnfBonus || 0),
      deductions: Number(formData.deductions || 0),
      expectedPayment,
      actualPayment: Number(formData.actualPayment || expectedPayment),
    })

    setFormData(EMPTY_FORM)
    setMessage('Milk payment saved.')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Milk Payment Passbook</h1>
        <p className="text-[var(--text-muted)] text-sm">Track expected payment, actual payment, deductions, quality bonuses, and MCC/buyer records.</p>
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Passbook litres</p>
          <p className="text-2xl font-bold text-[#2563eb]">{summary.totalLitres.toFixed(1)} L</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Expected</p>
          <p className="text-2xl font-bold text-[#059669]">{fmt(summary.totalExpected)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Actual</p>
          <p className="text-2xl font-bold text-[#7c3aed]">{fmt(summary.totalActual)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Variance</p>
          <p className={`text-2xl font-bold ${summary.variance >= 0 ? 'text-[#059669]' : 'text-[#dc2626]'}`}>{fmt(summary.variance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">From</label>
                <input type="date" name="fromDate" value={formData.fromDate} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">To</label>
                <input type="date" name="toDate" value={formData.toDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Buyer / MCC</label>
              <input name="buyerName" value={formData.buyerName} onChange={handleChange} className="input-field" placeholder="e.g., MILCO, Cargills, village buyer" />
            </div>
            <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs text-[var(--text-muted)]">Logged milk in range</p>
              <div className="flex items-center justify-between gap-3">
                <p className="font-bold text-[var(--text)]">{loggedLitres.toFixed(1)} L</p>
                <button type="button" onClick={useLoggedLitres} className="btn-secondary" style={{ minHeight: '34px', padding: '6px 10px' }}>Use</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Litres</label>
                <input type="number" min="0" step="0.1" name="litres" value={formData.litres} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Rate / L</label>
                <input type="number" min="0" step="0.01" name="rate" value={formData.rate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Fat/SNF Bonus</label>
                <input type="number" min="0" step="0.01" name="fatSnfBonus" value={formData.fatSnfBonus} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Deductions</label>
                <input type="number" min="0" step="0.01" name="deductions" value={formData.deductions} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Actual Payment</label>
              <input type="number" min="0" step="0.01" name="actualPayment" value={formData.actualPayment} onChange={handleChange} className="input-field" placeholder={String(expectedPayment.toFixed(2))} />
              <p className="text-xs text-[var(--text-muted)] mt-1">Expected: {fmt(expectedPayment)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="input-field resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full">Save Payment</button>
          </div>
        </form>

        <div className="card lg:col-span-2">
          <h2 className="text-lg font-bold text-[var(--text)] mb-3">Passbook Entries</h2>
          {loading ? (
            <p className="text-sm text-[var(--text-muted)]">Loading payments...</p>
          ) : milkPayments.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No milk payment records yet.</p>
          ) : (
            <div className="space-y-3">
              {milkPayments.map((payment) => {
                const variance = Number(payment.actualPayment || 0) - Number(payment.expectedPayment || 0)
                return (
                  <div key={payment.id} className="rounded-lg p-3 border border-[var(--border)]">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{payment.buyerName}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(payment.fromDate)} to {formatDate(payment.toDate)} | {payment.litres.toFixed(1)} L</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--text)]">{fmt(payment.actualPayment)}</p>
                        <p className={`text-xs ${variance >= 0 ? 'text-green-700' : 'text-red-700'}`}>{fmt(variance)} variance</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <span>Rate: {fmt(payment.rate)}</span>
                      <span>Bonus: {fmt(payment.fatSnfBonus)}</span>
                      <span>Deductions: {fmt(payment.deductions)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
