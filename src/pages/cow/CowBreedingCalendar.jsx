import { useMemo, useState } from 'react'
import { useCowBreedingRecords, useCows } from '../../hooks/useCowData'
import { addDays, BREEDING_EVENT_TYPES, daysUntil, formatDate, statusLabel, todayIso } from './cowUtils'

const EMPTY_FORM = {
  cowId: '',
  eventType: 'heat',
  eventDate: todayIso(),
  aiDate: '',
  pregnancyCheckDate: '',
  pregnancyResult: '',
  expectedCalvingDate: '',
  dryOffDate: '',
  sireBull: '',
  technician: '',
  notes: '',
}

function buildDefaults(form) {
  const next = { ...form }
  if (form.eventType === 'heat' && !next.aiDate) next.aiDate = form.eventDate
  if (['heat', 'ai'].includes(form.eventType)) {
    if (!next.pregnancyCheckDate) next.pregnancyCheckDate = addDays(form.aiDate || form.eventDate, 60)
    if (!next.expectedCalvingDate) next.expectedCalvingDate = addDays(form.aiDate || form.eventDate, 283)
    if (!next.dryOffDate) next.dryOffDate = addDays(form.aiDate || form.eventDate, 223)
  }
  return next
}

export default function CowBreedingCalendar() {
  const { cows } = useCows()
  const { breedingRecords, loading, error, createBreedingRecord } = useCowBreedingRecords()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const reminders = useMemo(() => {
    return breedingRecords
      .flatMap((record) => [
        record.pregnancyCheckDate && { ...record, reminderType: 'Pregnancy check', reminderDate: record.pregnancyCheckDate },
        record.dryOffDate && { ...record, reminderType: 'Dry-off', reminderDate: record.dryOffDate },
        record.expectedCalvingDate && { ...record, reminderType: 'Expected calving', reminderDate: record.expectedCalvingDate },
        record.eventType === 'heat' && { ...record, reminderType: 'Expected next heat', reminderDate: addDays(record.eventDate, 21) },
      ].filter(Boolean))
      .filter((record) => {
        const remaining = daysUntil(record.reminderDate)
        return remaining !== null && remaining >= 0
      })
      .sort((left, right) => String(left.reminderDate).localeCompare(String(right.reminderDate)))
  }, [breedingRecords])

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
    if (!formData.eventDate) {
      setFormError('Event date is required.')
      return
    }

    const record = buildDefaults(formData)
    await createBreedingRecord({
      ...record,
      cowId: cow.id,
      cowName: cow.name,
    })

    setFormData({ ...EMPTY_FORM, eventDate: formData.eventDate })
    setMessage('Breeding record saved.')
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Breeding & Heat Calendar</h1>
        <p className="text-[var(--text-muted)] text-sm">Track heat, AI, pregnancy checks, dry-off dates, and expected calving.</p>
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
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Event</label>
                <select name="eventType" value={formData.eventType} onChange={handleChange} className="input-field">
                  {BREEDING_EVENT_TYPES.map((type) => <option key={type} value={type}>{statusLabel(type)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Event Date</label>
                <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">AI Date</label>
                <input type="date" name="aiDate" value={formData.aiDate} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Pregnancy Check</label>
                <input type="date" name="pregnancyCheckDate" value={formData.pregnancyCheckDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Expected Calving</label>
                <input type="date" name="expectedCalvingDate" value={formData.expectedCalvingDate} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Dry-off Date</label>
                <input type="date" name="dryOffDate" value={formData.dryOffDate} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Result</label>
                <select name="pregnancyResult" value={formData.pregnancyResult} onChange={handleChange} className="input-field">
                  <option value="">Not checked</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="open">Open</option>
                  <option value="recheck">Recheck</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">Sire / Semen</label>
                <input name="sireBull" value={formData.sireBull} onChange={handleChange} className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">AI Technician</label>
              <input name="technician" value={formData.technician} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes</label>
              <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="input-field resize-none" />
            </div>
            <button type="submit" className="btn-primary w-full">Save Breeding Record</button>
          </div>
        </form>

        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="text-lg font-bold text-[var(--text)] mb-3">Upcoming Reminders</h2>
            {reminders.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No upcoming breeding reminders yet.</p>
            ) : (
              <div className="space-y-3">
                {reminders.slice(0, 8).map((record) => (
                  <div key={`${record.id}-${record.reminderType}`} className="rounded-lg p-3 border border-[var(--border)]">
                    <div className="flex justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text)]">{record.cowName || 'Cow'} - {record.reminderType}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-1">{record.notes || statusLabel(record.eventType)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[var(--accent)]">{formatDate(record.reminderDate)}</p>
                        <p className="text-xs text-[var(--text-muted)]">{daysUntil(record.reminderDate)} day(s)</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg font-bold text-[var(--text)] mb-3">Breeding History</h2>
            {loading ? (
              <p className="text-sm text-[var(--text-muted)]">Loading breeding records...</p>
            ) : breedingRecords.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No breeding records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--text-muted)] border-b border-[var(--border)]">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Cow</th>
                      <th className="py-2 pr-3">Event</th>
                      <th className="py-2 pr-3">Result</th>
                      <th className="py-2">Calving</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breedingRecords.slice(0, 12).map((record) => (
                      <tr key={record.id} className="border-b border-[var(--border)]">
                        <td className="py-2 pr-3">{formatDate(record.eventDate)}</td>
                        <td className="py-2 pr-3 font-medium">{record.cowName || '-'}</td>
                        <td className="py-2 pr-3">{statusLabel(record.eventType)}</td>
                        <td className="py-2 pr-3">{record.pregnancyResult || '-'}</td>
                        <td className="py-2">{formatDate(record.expectedCalvingDate)}</td>
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
