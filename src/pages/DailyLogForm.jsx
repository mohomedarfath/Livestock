import { useEffect, useState } from 'react'
import { clearDraft, loadDraft, saveDraft } from '../features/offline/drafts'
import { dailyLogRepository } from '../services/repositories/dailyLogRepository'
import { eggInventoryRepository } from '../services/repositories/eggInventoryRepository'
import { useTenant } from '../context/TenantContext'
import { useFlocks } from '../hooks/useFlocks'
import { useAnimalType } from '../animal/useAnimalType'

const DRAFT_KEY = 'daily-log-form'
const LOG_CACHE_KEY = 'clucktrack_logs'

const EMPTY_FORM = {
  flockId: '',
  flockName: '',
  eggs: '',
  deaths: '',
  feed: '',
  water: '',
  notes: '',
}

function readCachedLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_CACHE_KEY) || '[]')
  } catch {
    return []
  }
}

function writeCachedLogs(logs) {
  localStorage.setItem(LOG_CACHE_KEY, JSON.stringify(logs))
}

export default function DailyLogForm() {
  const { currentOrganization } = useTenant()
  const { flocks } = useFlocks()
  const { selectedAnimalType, animalTypeDetails } = useAnimalType()
  const showEggFields = selectedAnimalType === 'poultry' || selectedAnimalType === 'all'
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [logs, setLogs] = useState([])
  const [message, setMessage] = useState('')
  const [draftReady, setDraftReady] = useState(false)

  useEffect(() => {
    let ignore = false

    async function hydrateForm() {
      try {
        const nextLogs = await dailyLogRepository.list(currentOrganization?.id)
        if (!ignore) {
          setLogs(nextLogs)
          writeCachedLogs(nextLogs)
        }
      } catch {
        if (!ignore) {
          setLogs(readCachedLogs())
        }
      }

      const draft = await loadDraft(DRAFT_KEY)
      if (!ignore) {
        if (draft) setFormData(draft)
        setDraftReady(true)
      }
    }

    hydrateForm()

    return () => {
      ignore = true
    }
  }, [currentOrganization?.id])

  useEffect(() => {
    if (!draftReady) return
    saveDraft(DRAFT_KEY, formData)
  }, [draftReady, formData])

  const handleChange = (event) => {
    const { name, value } = event.target

    if (name === 'flockId') {
      const selected = flocks.find((flock) => String(flock.id) === String(value))
      setFormData((previous) => ({
        ...previous,
        flockId: value,
        flockName: selected ? selected.name : '',
      }))
      return
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!formData.eggs && !formData.deaths && !formData.feed && !formData.water) {
      setMessage('Please enter at least one value.')
      return
    }

    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const newLog = {
      id: `log_${Date.now()}`,
      date: today,
      time: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      flockId: formData.flockId || null,
      flockName: formData.flockName || '',
      eggs: formData.eggs ? parseInt(formData.eggs, 10) : 0,
      deaths: formData.deaths ? parseInt(formData.deaths, 10) : 0,
      feed: formData.feed ? parseFloat(formData.feed) : 0,
      water: formData.water ? parseFloat(formData.water) : 0,
      notes: formData.notes,
    }

    const savedLog = await dailyLogRepository.create(currentOrganization?.id, newLog)

    const updatedLogs = [savedLog, ...logs]
    writeCachedLogs(updatedLogs)
    setLogs(updatedLogs)

    if (showEggFields && newLog.eggs > 0) {
      await eggInventoryRepository.recordMovement({
        type: 'collected',
        quantity: newLog.eggs,
        unit: 'pieces',
        date: today,
        source: 'daily-log',
        notes: newLog.flockName
          ? `${newLog.flockName}: ${newLog.eggs} eggs collected${newLog.notes ? ` - ${newLog.notes}` : ''}`
          : `${newLog.eggs} eggs collected${newLog.notes ? ` - ${newLog.notes}` : ''}`,
      })
    }

    setFormData(EMPTY_FORM)
    await clearDraft(DRAFT_KEY)

    setMessage(navigator.onLine ? 'Saved successfully.' : 'Saved offline. It will sync when you reconnect.')
    setTimeout(() => setMessage(''), 3000)
  }

  const today = new Date().toISOString().split('T')[0]
  const todayLogs = logs.filter((log) => log.date === today)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]">Daily Log</h1>
        <p className="text-[var(--text-muted)] text-sm">Record today&apos;s farm activities with offline drafts and sync queue support.</p>
      </div>

      <form onSubmit={handleSubmit} className="card bg-[var(--surface)] mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">{animalTypeDetails.groupLabel} (Optional)</label>
            <select name="flockId" value={formData.flockId} onChange={handleChange} className="input-field">
              <option value="">All {animalTypeDetails.groupPlural.toLowerCase()} / general</option>
              {flocks.map((flock) => (
                <option key={flock.id} value={flock.id}>
                  {flock.name} ({flock.count} {animalTypeDetails.animalPlural.toLowerCase()})
                </option>
              ))}
            </select>
          </div>

          {showEggFields && (
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-2">Eggs Collected</label>
              <input type="number" name="eggs" value={formData.eggs} onChange={handleChange} placeholder="Number of eggs" className="input-field" min="0" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">{animalTypeDetails.animalLabel} Losses</label>
            <input type="number" name="deaths" value={formData.deaths} onChange={handleChange} placeholder="Number of deaths" className="input-field" min="0" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Feed Used (kg)</label>
            <input type="number" name="feed" value={formData.feed} onChange={handleChange} placeholder="Amount in kg" className="input-field" min="0" step="0.5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Water Used (Liters)</label>
            <input type="number" name="water" value={formData.water} onChange={handleChange} placeholder="Amount in liters" className="input-field" min="0" step="0.5" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-2">Notes (Optional)</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Any observations or issues?" className="input-field resize-none" rows="3" />
          </div>

          {message && (
            <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'color-mix(in srgb, #16a34a 12%, var(--surface))', color: '#166534' }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn-primary w-full">
            Save Entry
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-bold text-[var(--text)] mb-3">Today&apos;s Entries ({todayLogs.length})</h2>

        {todayLogs.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-[var(--text-muted)] text-sm">No entries yet. Start by filling out the form above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayLogs.map((log, index) => (
              <div key={log.id || index} className="card border" style={{ borderColor: 'var(--border)' }}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-[var(--text)]">{log.time}</p>
                    {log.flockName && <p className="text-xs text-[var(--text-dim)] mt-0.5">{log.flockName}</p>}
                  </div>
                  <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                    Entry #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3 text-sm">
                  {showEggFields && (
                    <div className="rounded p-2" style={{ background: '#fefce8' }}>
                      <p className="text-xs text-[var(--text-muted)]">Eggs</p>
                      <p className="font-bold text-yellow-700">{log.eggs}</p>
                    </div>
                  )}
                  <div className="rounded p-2" style={{ background: '#fef2f2' }}>
                    <p className="text-xs text-[var(--text-muted)]">Losses</p>
                    <p className="font-bold text-red-700">{log.deaths}</p>
                  </div>
                  <div className="rounded p-2" style={{ background: '#f0fdf4' }}>
                    <p className="text-xs text-[var(--text-muted)]">Feed (kg)</p>
                    <p className="font-bold text-green-700">{log.feed}</p>
                  </div>
                  <div className="rounded p-2" style={{ background: '#eff6ff' }}>
                    <p className="text-xs text-[var(--text-muted)]">Water (L)</p>
                    <p className="font-bold text-blue-700">{log.water}</p>
                  </div>
                </div>

                {log.notes && <p className="text-sm text-[var(--text)] border-t pt-2 italic">{log.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
