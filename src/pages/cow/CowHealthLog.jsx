import { useMemo, useState } from 'react'
import { useCurrency } from '../../utils/currency.jsx'
import { useCowHealthRecords, useCows } from '../../hooks/useCowData'
import { addDays, daysUntil, formatDate, todayIso } from './cowUtils'

const EMPTY_FORM = {
  cowId: '',
  issueType: '',
  symptoms: '',
  medicine: '',
  dose: '',
  vetName: '',
  eventDate: todayIso(),
  withdrawalDays: '',
  cost: '',
  notes: '',
}

const ISSUE_TYPES = ['mastitis', 'fever', 'lameness', 'vaccination', 'deworming', 'milk fever', 'injury', 'routine check', 'other']

export default function CowHealthLog() {
  const { fmt } = useCurrency()
  const { cows } = useCows()
  const { healthRecords, loading, error, createHealthRecord } = useCowHealthRecords()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const activeWithdrawals = useMemo(() => {
    return healthRecords
      .filter((record) => {
        const remaining = daysUntil(record.withdrawalUntil)
        return remaining !== null && remaining >= 0
      })
      .sort((left, right) => String(left.withdrawalUntil).localeCompare(String(right.withdrawalUntil)))
  }, [healthRecords])

  const totalCost = useMemo(
    () => healthRecords.reduce((sum, record) => sum + Number(record.cost || 0), 0),
    [healthRecords]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setFormError('')
    setMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const cow = cows.find((item) => String(item.id) === String(formData.cowId))
    if (!cow) {
      setFormError('Select a cow.')
      return
    }
    if (!formData.issueType.trim()) {
      setFormError('Issue type is required.')
      return
    }

    const withdrawalDays = Number(formData.withdrawalDays || 0)
    await createHealthRecord({
      ...formData,
      cowId: cow.id,
      cowName: cow.name,
      withdrawalDays,
      withdrawalUntil: withdrawalDays > 0 ? addDays(formData.eventDate, withdrawalDays) : '',
      cost: Number(formData.cost || 0),
    })

    setFormData({ ...EMPTY_FORM, eventDate: formData.eventDate })
    setMessage('Health record saved.')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Cow Health & Withdrawal</h1>
        <p className="text-[var(--text-muted)] text-sm">Record sickness, vaccines, medicine, vet notes, costs, and milk withdrawal periods.</p>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Health records</p>
          <p className="text-2xl font-bold text-[#2563eb]">{healthRecords.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[var(--text-muted)]">Active withdrawal</p>
          <p className="text-2xl font-bold text-[#dc2626]">{activeWithdrawals.length}</p>
        </div>
        <div className="card md:col-span-2">
          <p className="text-xs text-[var(--text-muted)]">Medicine and vet cost</p>
          <p className="text-2xl font-bold text-[#7c3aed]">{fmt(totalCost)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <form onSubmit={handleSubmit} className="card">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Cow</label>
              <select name="cowId" value={formData.cowId} onChange={handleChange} className="input-field">
                <option value="">Select cow</option>
                {cows.map((cow) => <option key={cow.id} value={cow.id}>{cow.name} ({cow.tagNumber})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Issue</label>
                <select name="issueType" value={formData.issueType} onChange={handleChange} className="input-field">
                  <option value="">Select issue</option>
                  {ISSUE_TYPES.map((issue) => <option key={issue} value={issue}>{issue}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Date</label>
                <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Symptoms</label>
              <input name="symptoms" value={formData.symptoms} onChange={handleChange} className="input-field" placeholder="e.g., swollen udder, fever, low appetite" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Medicine</label>
                <input name="medicine" value={formData.medicine} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Dose</label>
                <input name="dose" value={formData.dose} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Vet Name</label>
              <input name="vetName" value={formData.vetName} onChange={handleChange} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Withdrawal Days</label>
                <input type="number" min="0" name="withdrawalDays" value={formData.withdrawalDays} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Cost</label>
                <input type="number" min="0" step="0.01" name="cost" value={formData.cost} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="input-field resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full">Save Health Record</button>
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          {activeWithdrawals.length > 0 && (
            <div className="card" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
              <h2 className="text-lg font-bold text-red-900 mb-3">Active Milk Withdrawal</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeWithdrawals.map((record) => (
                  <div key={record.id} className="rounded-lg p-3 bg-white border border-red-200">
                    <p className="font-semibold text-red-800">{record.cowName || 'Cow'} - {record.medicine || record.issueType}</p>
                    <p className="text-sm text-red-700 mt-1">Do not sell milk until {formatDate(record.withdrawalUntil)}.</p>
                    <p className="text-xs text-red-700 mt-1">{daysUntil(record.withdrawalUntil)} day(s) remaining</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h2 className="text-lg font-bold text-[var(--text)] mb-3">Health History</h2>
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading health records...</p>
            ) : healthRecords.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No health records yet.</p>
            ) : (
              <div className="space-y-3">
                {healthRecords.slice(0, 12).map((record) => (
                  <div key={record.id} className="rounded-lg p-3 border border-[var(--border)]">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{record.cowName || 'Cow'} - {record.issueType}</p>
                        <p className="text-sm text-[var(--text-muted)] mt-1">{record.symptoms || record.notes || 'No symptoms noted'}</p>
                        {record.medicine && <p className="text-xs text-[var(--text-muted)] mt-1">{record.medicine} {record.dose ? `| ${record.dose}` : ''}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[var(--text)]">{formatDate(record.eventDate)}</p>
                        <p className="text-xs text-[var(--text-muted)]">{fmt(record.cost)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
