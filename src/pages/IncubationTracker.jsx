import { useState, useEffect } from 'react'
import { Storage } from '../utils/storage'
import { useConfirm } from '../components/ui'

function daysUntilHatch(startDate) {
  const start = new Date(startDate)
  const hatch = new Date(start)
  hatch.setDate(hatch.getDate() + 21)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((hatch - today) / (1000 * 60 * 60 * 24))
}

function daysSinceStart(startDate) {
  const start = new Date(startDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today - start) / (1000 * 60 * 60 * 24))
}

function hatchDate(startDate) {
  const d = new Date(startDate)
  d.setDate(d.getDate() + 21)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const BREEDS = [
  'Rhode Island Red', 'Leghorn', 'Broiler (Cobb 500)', 'Broiler (Ross 308)',
  'Black Australorp', 'Buff Orpington', 'Silkie', 'Sussex', 'Plymouth Rock',
  'Easter Egger', 'Wyandotte', 'Local/Mixed Breed',
]

export default function IncubationTracker() {
  const confirm = useConfirm()
  const [batches, setBatches]   = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({
    batchName: '', breed: 'Rhode Island Red', startDate: new Date().toISOString().split('T')[0],
    eggCount: '', notes: '',
  })
  const [hatchForm, setHatchForm]   = useState(null) // batch id being recorded
  const [hatchCount, setHatchCount] = useState('')

  useEffect(() => {
    setBatches(Storage.getIncubations())
  }, [])

  const save = (updated) => {
    setBatches(updated)
    Storage.setIncubations(updated)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    const batch = {
      id: Date.now(), batchName: form.batchName || `Batch ${batches.length + 1}`,
      breed: form.breed, startDate: form.startDate, eggCount: parseInt(form.eggCount) || 0,
      status: 'incubating', candled7: false, candled14: false, candled18: false,
      hatched: null, notes: form.notes, createdAt: new Date().toISOString(),
    }
    save([batch, ...batches])
    setForm({ batchName: '', breed: 'Rhode Island Red', startDate: new Date().toISOString().split('T')[0], eggCount: '', notes: '' })
    setShowForm(false)
  }

  const toggleCandling = (id, day) => {
    save(batches.map(b => b.id === id ? { ...b, [`candled${day}`]: !b[`candled${day}`] } : b))
  }

  const recordHatch = (id) => {
    const count = parseInt(hatchCount)
    if (!count && count !== 0) return
    save(batches.map(b => b.id === id ? { ...b, hatched: count, status: 'hatched' } : b))
    setHatchForm(null)
    setHatchCount('')
  }

  const markFailed = (id) => {
    save(batches.map(b => b.id === id ? { ...b, status: 'failed' } : b))
  }

  const deleteBatch = async (id) => {
    const confirmed = await confirm({
      title: 'Delete batch record?',
      description: 'This incubation batch will be permanently removed.',
      confirmLabel: 'Delete batch',
      destructive: true,
    })
    if (!confirmed) return
    save(batches.filter(b => b.id !== id))
  }

  const active  = batches.filter(b => b.status === 'incubating')
  const done    = batches.filter(b => b.status !== 'incubating')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>🐣 Hatchery & Incubation</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Track your egg-to-chick journey — candling, hatch dates & rates</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary" style={{ fontSize: '13px' }}>
          {showForm ? '✕ Cancel' : '+ New Batch'}
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
        {[
          { icon: '🥚', label: 'Active Batches',  value: active.length,  color: '#d97706', bg: '#fffbeb' },
          { icon: '🐣', label: 'Total Eggs Set',  value: batches.reduce((s, b) => s + b.eggCount, 0), color: '#2563eb', bg: '#eff6ff' },
          { icon: '🐥', label: 'Chicks Hatched',  value: batches.filter(b => b.hatched != null).reduce((s, b) => s + (b.hatched || 0), 0), color: '#16a34a', bg: '#f0fdf4' },
          {
            icon: '📊', label: 'Avg Hatch Rate',
            value: (() => {
              const withData = batches.filter(b => b.hatched != null && b.eggCount > 0)
              if (!withData.length) return 'N/A'
              const avg = withData.reduce((s, b) => s + (b.hatched / b.eggCount) * 100, 0) / withData.length
              return `${Math.round(avg)}%`
            })(),
            color: '#7c3aed', bg: '#f5f3ff',
          },
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{c.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>🥚 Start New Incubation Batch</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Batch Name</label>
                <input value={form.batchName} onChange={e => setForm(f => ({ ...f, batchName: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="e.g. Spring Batch 1" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Breed</label>
                <select value={form.breed} onChange={e => setForm(f => ({ ...f, breed: e.target.value }))} className="input-field" style={{ fontSize: '13px' }}>
                  {BREEDS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Eggs Set</label>
                <input type="number" value={form.eggCount} onChange={e => setForm(f => ({ ...f, eggCount: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0" min="1" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="Incubator temperature, source flock…" />
            </div>
            <button type="submit" className="btn-primary" style={{ fontSize: '14px', padding: '12px' }}>🐣 Start Tracking</button>
          </form>
        </div>
      )}

      {/* Active batches */}
      {active.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>🔥 Active Batches ({active.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {active.map(b => {
              const day       = daysSinceStart(b.startDate)
              const daysLeft  = daysUntilHatch(b.startDate)
              const progress  = Math.min(100, Math.round((day / 21) * 100))
              const isUrgent  = daysLeft <= 3 && daysLeft >= 0

              return (
                <div key={b.id} className="card" style={{ padding: '18px', border: isUrgent ? '2px solid #f59e0b' : '1px solid var(--border)' }}>
                  {isUrgent && (
                    <div style={{ padding: '6px 12px', background: '#fef3c7', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', color: '#d97706', fontWeight: 600 }}>
                      🐣 Hatch day approaching! Expected: {hatchDate(b.startDate)}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>{b.batchName}</h3>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{b.breed} · {b.eggCount} eggs set · Started {b.startDate}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: daysLeft < 0 ? '#dc2626' : '#d97706' }}>
                        {daysLeft < 0 ? 'Overdue!' : `Day ${day}/21`}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                        {daysLeft < 0 ? 'Record hatch now' : `Hatch: ${hatchDate(b.startDate)}`}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop: '14px', height: '8px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '99px', background: progress >= 100 ? '#f59e0b' : '#16a34a', width: `${progress}%`, transition: 'width .3s' }} />
                  </div>

                  {/* Candling checklist */}
                  <div style={{ marginTop: '14px' }}>
                    <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.04em' }}>🕯️ Candling Schedule</p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[{ day: 7, label: 'Day 7' }, { day: 14, label: 'Day 14' }, { day: 18, label: 'Day 18 (Lockdown)' }].map(({ day: d, label }) => {
                        const done = b[`candled${d}`]
                        const due  = day >= d
                        return (
                          <button
                            key={d}
                            onClick={() => toggleCandling(b.id, d)}
                            style={{
                              padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                              background: done ? '#dcfce7' : due ? '#fef3c7' : 'var(--surface-2)',
                              color: done ? '#16a34a' : due ? '#d97706' : 'var(--text-dim)',
                            }}
                          >
                            {done ? '✅' : due ? '⏰' : '○'} {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: '14px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {hatchForm === b.id ? (
                      <>
                        <input
                          type="number" value={hatchCount} onChange={e => setHatchCount(e.target.value)}
                          placeholder="How many chicks hatched?" className="input-field"
                          style={{ flex: 1, fontSize: '13px', minWidth: '180px' }} min="0"
                        />
                        <button onClick={() => recordHatch(b.id)} className="btn-primary" style={{ fontSize: '12px' }}>✓ Record</button>
                        <button onClick={() => setHatchForm(null)} className="btn-secondary" style={{ fontSize: '12px' }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { setHatchForm(b.id); setHatchCount('') }} className="btn-primary" style={{ fontSize: '12px' }}>🐥 Record Hatch</button>
                        <button onClick={() => markFailed(b.id)} className="btn-secondary" style={{ fontSize: '12px', color: '#dc2626' }}>✗ Mark Failed</button>
                        <button onClick={() => deleteBatch(b.id)} style={{ fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}>🗑️</button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '48px', margin: '0 0 12px' }}>🥚</p>
          <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No active batches</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Start tracking your incubation to get candling reminders and hatch rate stats.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Start a Batch</button>
        </div>
      )}

      {/* Completed batches */}
      {batches.length > 0 && done.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '13px' }}>
          <p style={{ fontSize: '32px', margin: '0 0 8px' }}>📚</p>
          <p>No completed batches yet. History will appear here once batches finish.</p>
        </div>
      )}
      {done.length > 0 && (
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📚 History ({done.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {done.map(b => {
              const rate = b.eggCount > 0 && b.hatched != null ? Math.round((b.hatched / b.eggCount) * 100) : null
              return (
                <div key={b.id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: b.status === 'hatched' ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                    {b.status === 'hatched' ? '🐥' : '❌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{b.batchName} · {b.breed}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                      {b.eggCount} eggs set · {b.startDate}
                      {b.hatched != null && ` · ${b.hatched} hatched`}
                    </p>
                  </div>
                  {rate != null && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: rate >= 70 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626' }}>{rate}%</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>hatch rate</p>
                    </div>
                  )}
                  <button onClick={() => deleteBatch(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '16px' }}>🗑️</button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
