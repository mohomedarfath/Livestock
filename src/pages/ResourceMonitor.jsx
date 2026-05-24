import { useState, useEffect, useMemo } from 'react'
import { Storage } from '../utils/storage'
import { useCurrency } from '../utils/currency.jsx'

export default function ResourceMonitor() {
  const { fmt } = useCurrency()
  const [resources, setResources] = useState([])
  const [flocks, setFlocks]       = useState([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    electricity: '', water: '', elecCost: '', waterCost: '', notes: '',
  })

  useEffect(() => {
    setResources(Storage.getResources())
    setFlocks(Storage.getFlocks())
  }, [])

  const save = (updated) => {
    setResources(updated)
    Storage.setResources(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const entry = {
      id: Date.now(),
      date:        form.date,
      electricity: parseFloat(form.electricity) || 0,
      water:       parseFloat(form.water)       || 0,
      elecCost:    parseFloat(form.elecCost)    || 0,
      waterCost:   parseFloat(form.waterCost)   || 0,
      notes:       form.notes,
    }
    save([entry, ...resources])
    setForm({ date: new Date().toISOString().split('T')[0], electricity: '', water: '', elecCost: '', waterCost: '', notes: '' })
    setShowForm(false)
  }

  const deleteEntry = (id) => save(resources.filter(r => r.id !== id))

  const thisMonth = new Date().toISOString().slice(0, 7)
  const totalBirds = flocks.reduce((s, f) => s + (parseInt(f.count) || parseInt(f.size) || 0), 0)

  const stats = useMemo(() => {
    const monthEntries = resources.filter(r => r.date.startsWith(thisMonth))
    const totalElec     = monthEntries.reduce((s, r) => s + r.electricity, 0)
    const totalWater    = monthEntries.reduce((s, r) => s + r.water, 0)
    const totalElecCost = monthEntries.reduce((s, r) => s + r.elecCost, 0)
    const totalWaterCost = monthEntries.reduce((s, r) => s + r.waterCost, 0)
    return { totalElec, totalWater, totalElecCost, totalWaterCost, days: monthEntries.length }
  }, [resources, thisMonth])

  // Last 30 days for chart
  const last30 = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const entry = resources.find(r => r.date === dateStr)
      days.push({ date: dateStr, label: d.getDate(), elec: entry?.electricity || 0, water: entry?.water || 0 })
    }
    return days
  }, [resources])

  const maxElec  = Math.max(...last30.map(d => d.elec), 1)
  const maxWater = Math.max(...last30.map(d => d.water), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>⚡ Energy & Water Monitor</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Track electricity and water usage — reduce costs, track sustainability</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary" style={{ fontSize: '13px' }}>
          {showForm ? '✕ Cancel' : '+ Log Today'}
        </button>
      </div>

      {/* This month stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {[
          { icon: '⚡', label: 'Electricity (this month)', value: `${stats.totalElec.toFixed(1)} kWh`, sub: `Cost: ${fmt(stats.totalElecCost.toFixed(0))}`, color: '#f59e0b', bg: '#fffbeb' },
          { icon: '💧', label: 'Water (this month)',       value: `${stats.totalWater.toFixed(0)} L`,   sub: `Cost: ${fmt(stats.totalWaterCost.toFixed(0))}`, color: '#2563eb', bg: '#eff6ff' },
          { icon: '💰', label: 'Total Utility Cost',       value: fmt((stats.totalElecCost + stats.totalWaterCost).toFixed(0)), sub: `${stats.days} days logged`, color: '#7c3aed', bg: '#f5f3ff' },
          ...(totalBirds > 0 ? [{
            icon: '🐔', label: 'Cost per Bird/month', value: fmt(((stats.totalElecCost + stats.totalWaterCost) / totalBirds).toFixed(2)),
            sub: `${totalBirds} birds`, color: '#16a34a', bg: '#f0fdf4',
          }] : []),
        ].map(c => (
          <div key={c.label} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>{c.icon}</div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{c.label}</p>
              <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: c.color, lineHeight: 1.2 }}>{c.value}</p>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Log form */}
      {showForm && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📊 Log Resource Usage</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>⚡ Electricity (kWh)</label>
                <input type="number" value={form.electricity} onChange={e => setForm(f => ({ ...f, electricity: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0.0" min="0" step="0.1" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>⚡ Electricity Cost</label>
                <input type="number" value={form.elecCost} onChange={e => setForm(f => ({ ...f, elecCost: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>💧 Water (Liters)</label>
                <input type="number" value={form.water} onChange={e => setForm(f => ({ ...f, water: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0" min="0" step="1" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>💧 Water Cost</label>
                <input type="number" value={form.waterCost} onChange={e => setForm(f => ({ ...f, waterCost: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="e.g. heater on, meter reading…" />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ fontSize: '14px', padding: '12px' }}>✓ Save Entry</button>
          </form>
        </div>
      )}

      {/* 30-day chart */}
      {resources.length > 0 && (
        <div className="card" style={{ padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📈 Last 30 Days</h2>

          {/* Electricity chart */}
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.04em' }}>⚡ Electricity (kWh)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px', marginBottom: '20px' }}>
            {last30.map(d => (
              <div key={d.date} title={`${d.date}: ${d.elec} kWh`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.elec > 0 ? '#f59e0b' : 'var(--border)', borderRadius: '2px 2px 0 0', height: `${(d.elec / maxElec) * 100}%`, minHeight: d.elec > 0 ? '4px' : '0' }} />
              </div>
            ))}
          </div>

          {/* Water chart */}
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 600, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '.04em' }}>💧 Water (Liters)</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '80px' }}>
            {last30.map(d => (
              <div key={d.date} title={`${d.date}: ${d.water} L`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', background: d.water > 0 ? '#2563eb' : 'var(--border)', borderRadius: '2px 2px 0 0', height: `${(d.water / maxWater) * 100}%`, minHeight: d.water > 0 ? '4px' : '0' }} />
              </div>
            ))}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: '10px', color: 'var(--text-dim)', textAlign: 'center' }}>Hover over a bar to see the day's value</p>
        </div>
      )}

      {/* History list */}
      {resources.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>⚡</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No resource logs yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>Log daily electricity and water usage to track costs and spot savings opportunities.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Log Today's Usage</button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📋 Usage Log</h2>
          </div>
          {resources.slice(0, 30).map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < Math.min(resources.length, 30) - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{r.date}</p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px', flexWrap: 'wrap' }}>
                  {r.electricity > 0 && <span style={{ fontSize: '12px', color: '#f59e0b' }}>⚡ {r.electricity} kWh</span>}
                  {r.water > 0      && <span style={{ fontSize: '12px', color: '#2563eb' }}>💧 {r.water} L</span>}
                  {r.notes          && <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{r.notes}</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                  {fmt((r.elecCost + r.waterCost).toFixed(0))}
                </p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>total cost</p>
              </div>
              <button onClick={() => deleteEntry(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '16px', flexShrink: 0 }}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
