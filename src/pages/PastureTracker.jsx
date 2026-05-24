import { useState, useEffect } from 'react'
import { Storage } from '../utils/storage'
import { useConfirm } from '../components/ui'

export default function PastureTracker() {
  const confirm = useConfirm()
  const [zones, setZones]   = useState([])
  const [logs, setLogs]     = useState([])
  const [flocks, setFlocks] = useState([])
  const [showZoneForm, setShowZoneForm] = useState(false)
  const [showLogForm, setShowLogForm]   = useState(false)
  const [zoneForm, setZoneForm] = useState({ name: '', sizeSqm: '', maxBirds: '', notes: '' })
  const [logForm, setLogForm]   = useState({
    zoneId: '', flockName: 'General', birdCount: '', action: 'move_in',
    date: new Date().toISOString().split('T')[0], notes: '',
  })

  useEffect(() => {
    setZones(Storage.getPastures())
    setLogs(Storage.getPastureLogs())
    setFlocks(Storage.getFlocks())
  }, [])

  const saveZones = (v) => { setZones(v); Storage.setPastures(v) }
  const saveLogs  = (v) => { setLogs(v);  Storage.setPastureLogs(v) }

  const addZone = (e) => {
    e.preventDefault()
    if (!zoneForm.name.trim()) return
    saveZones([...zones, { id: Date.now(), ...zoneForm, sizeSqm: parseFloat(zoneForm.sizeSqm) || 0, maxBirds: parseInt(zoneForm.maxBirds) || 0, createdAt: new Date().toISOString() }])
    setZoneForm({ name: '', sizeSqm: '', maxBirds: '', notes: '' })
    setShowZoneForm(false)
  }

  const addLog = (e) => {
    e.preventDefault()
    if (!logForm.zoneId) return
    const zone = zones.find(z => z.id === Number(logForm.zoneId))
    saveLogs([{ id: Date.now(), ...logForm, zoneId: Number(logForm.zoneId), zoneName: zone?.name || 'Unknown Zone', birdCount: parseInt(logForm.birdCount) || 0 }, ...logs])
    setLogForm({ zoneId: '', flockName: 'General', birdCount: '', action: 'move_in', date: new Date().toISOString().split('T')[0], notes: '' })
    setShowLogForm(false)
  }

  const deleteZone = async (id) => {
    const confirmed = await confirm({
      title: 'Delete pasture zone?',
      description: 'All movement logs for this zone will still exist.',
      confirmLabel: 'Delete zone',
      destructive: true,
    })
    if (!confirmed) return
    saveZones(zones.filter(z => z.id !== id))
  }
  const deleteLog = async (id) => {
    const confirmed = await confirm({
      title: 'Delete movement log?',
      description: 'This removes the pasture movement history entry.',
      confirmLabel: 'Delete log',
      destructive: true,
    })
    if (!confirmed) return
    saveLogs(logs.filter(l => l.id !== id))
  }

  // Compute current birds per zone (last log entry per zone)
  const currentBirds = (zoneId) => {
    const zoneLogs = logs.filter(l => l.zoneId === zoneId).sort((a, b) => b.id - a.id)
    if (!zoneLogs.length) return 0
    const last = zoneLogs[0]
    return last.action === 'move_in' ? last.birdCount : 0
  }

  // Last used date per zone
  const lastUsed = (zoneId) => {
    const zoneLogs = logs.filter(l => l.zoneId === zoneId).sort((a, b) => b.id - a.id)
    return zoneLogs[0]?.date || null
  }

  // Days since last use
  const daysSince = (date) => {
    if (!date) return null
    const d = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return Math.floor((today - d) / (1000 * 60 * 60 * 24))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>🌿 Pasture & Free-Range Tracker</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Manage paddocks, track rotation & bird movements</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowZoneForm(v => !v)} className="btn-secondary" style={{ fontSize: '13px' }}>+ Add Zone</button>
          {zones.length > 0 && <button onClick={() => setShowLogForm(v => !v)} className="btn-primary" style={{ fontSize: '13px' }}>📍 Log Movement</button>}
        </div>
      </div>

      {/* Rotation tip */}
      <div style={{ padding: '12px 16px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '12px', color: '#16a34a', lineHeight: 1.5 }}>
        <strong>🔄 Rotation tip:</strong> Rest each pasture zone for at least 3–4 weeks before reusing. This breaks parasite cycles and lets grass recover. Aim to move birds to a fresh zone every 1–2 weeks.
      </div>

      {/* Add zone form */}
      {showZoneForm && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>🌿 Add Pasture Zone / Paddock</h3>
          <form onSubmit={addZone} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Zone Name *</label>
                <input value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="e.g. North Paddock A" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Size (m²)</label>
                <input type="number" value={zoneForm.sizeSqm} onChange={e => setZoneForm(f => ({ ...f, sizeSqm: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="500" min="0" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Max Birds</label>
                <input type="number" value={zoneForm.maxBirds} onChange={e => setZoneForm(f => ({ ...f, maxBirds: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="50" min="0" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes</label>
              <input value={zoneForm.notes} onChange={e => setZoneForm(f => ({ ...f, notes: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="Shade trees, water source, fencing notes…" />
            </div>
            <button type="submit" className="btn-primary" style={{ fontSize: '13px' }}>✓ Add Zone</button>
          </form>
        </div>
      )}

      {/* Log movement form */}
      {showLogForm && zones.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📍 Log Bird Movement</h3>
          <form onSubmit={addLog} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Zone *</label>
                <select value={logForm.zoneId} onChange={e => setLogForm(f => ({ ...f, zoneId: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} required>
                  <option value="">Select zone…</option>
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Flock</label>
                <select value={logForm.flockName} onChange={e => setLogForm(f => ({ ...f, flockName: e.target.value }))} className="input-field" style={{ fontSize: '13px' }}>
                  <option value="General">General</option>
                  {flocks.map(fl => <option key={fl.id} value={fl.name}>{fl.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Action</label>
                <select value={logForm.action} onChange={e => setLogForm(f => ({ ...f, action: e.target.value }))} className="input-field" style={{ fontSize: '13px' }}>
                  <option value="move_in">🐔 Move birds IN</option>
                  <option value="move_out">🚶 Move birds OUT (rest zone)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Bird Count</label>
                <input type="number" value={logForm.birdCount} onChange={e => setLogForm(f => ({ ...f, birdCount: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0" min="0" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
                <input type="date" value={logForm.date} onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes</label>
                <input value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="Reason for move…" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ fontSize: '13px' }}>✓ Log Movement</button>
          </form>
        </div>
      )}

      {/* Zone cards */}
      {zones.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🌿</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No pasture zones yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Create zones for each paddock or grazing area to start tracking rotation.</p>
          <button onClick={() => setShowZoneForm(true)} className="btn-primary">+ Add First Zone</button>
        </div>
      ) : (
        <div>
          <h2 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>🗺️ Your Zones ({zones.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
            {zones.map(z => {
              const birds   = currentBirds(z.id)
              const last    = lastUsed(z.id)
              const restDays = daysSince(last)
              const isEmpty  = birds === 0
              const wellRested = restDays == null || restDays >= 21
              const utilPct  = z.maxBirds > 0 ? Math.min(100, Math.round((birds / z.maxBirds) * 100)) : null

              return (
                <div key={z.id} className="card" style={{ padding: '16px', border: `2px solid ${isEmpty ? (wellRested ? '#bbf7d0' : 'var(--border)') : '#bfdbfe'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{z.name}</h3>
                      {z.sizeSqm > 0 && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>{z.sizeSqm} m²</p>}
                    </div>
                    <button onClick={() => deleteZone(z.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '14px' }}>🗑️</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{
                      padding: '4px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                      background: isEmpty ? '#f0fdf4' : '#eff6ff',
                      color: isEmpty ? '#16a34a' : '#2563eb',
                    }}>
                      {isEmpty ? '✅ Empty (resting)' : `🐔 ${birds} birds`}
                    </div>
                  </div>

                  {utilPct != null && !isEmpty && (
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ height: '6px', borderRadius: '99px', background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: utilPct > 80 ? '#dc2626' : '#2563eb', width: `${utilPct}%` }} />
                      </div>
                      <p style={{ margin: '3px 0 0', fontSize: '10px', color: 'var(--text-dim)' }}>{utilPct}% capacity</p>
                    </div>
                  )}

                  {last && (
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                      Last used: {last}
                      {isEmpty && restDays != null && (
                        <span style={{ marginLeft: '4px', color: restDays >= 21 ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                          ({restDays}d rest {restDays >= 21 ? '✅' : '⏳'})
                        </span>
                      )}
                    </p>
                  )}
                  {z.notes && <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>{z.notes}</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Movement history */}
      {logs.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📅 Movement History</h2>
          </div>
          {logs.slice(0, 30).map((l, i) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < Math.min(logs.length, 30) - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{l.action === 'move_in' ? '🐔' : '🌿'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>
                  {l.action === 'move_in' ? 'Moved in' : 'Moved out'} — {l.zoneName}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                  {l.flockName}{l.birdCount > 0 ? ` · ${l.birdCount} birds` : ''}{l.notes ? ` · ${l.notes}` : ''}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{l.date}</span>
                <button onClick={() => deleteLog(l.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '14px' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
