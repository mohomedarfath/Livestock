import { useState, useEffect } from 'react'
import { Storage } from '../utils/storage'

const CATEGORIES = {
  observation: { label: 'Observation',  icon: '👁️', color: '#2563eb', bg: '#eff6ff' },
  treatment:   { label: 'Treatment',    icon: '💊', color: '#dc2626', bg: '#fef2f2' },
  advisory:    { label: 'Advisory',     icon: '📋', color: '#16a34a', bg: '#f0fdf4' },
  emergency:   { label: 'Emergency',    icon: '🚨', color: '#dc2626', bg: '#fef2f2' },
  routine:     { label: 'Routine Visit',icon: '✅', color: '#d97706', bg: '#fffbeb' },
}

export default function VetNotes() {
  const [notes, setNotes]     = useState([])
  const [flocks, setFlocks]   = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter]   = useState('all')
  const [form, setForm]       = useState({
    title: '', category: 'observation', flockName: 'General',
    body: '', author: '', date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    setNotes(Storage.getVetNotes())
    setFlocks(Storage.getFlocks())
  }, [])

  const save = (updated) => {
    setNotes(updated)
    Storage.setVetNotes(updated)
  }

  const handleAdd = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.body.trim()) return
    const note = { id: Date.now(), ...form, createdAt: new Date().toISOString() }
    save([note, ...notes])
    setForm({ title: '', category: 'observation', flockName: 'General', body: '', author: '', date: new Date().toISOString().split('T')[0] })
    setShowForm(false)
  }

  const deleteNote = (id) => {
    save(notes.filter(n => n.id !== id))
  }

  const exportNotes = () => {
    const text = notes.map(n => {
      const cat = CATEGORIES[n.category]
      return [
        `[${cat.label.toUpperCase()}] ${n.title}`,
        `Date: ${n.date} | Flock: ${n.flockName}${n.author ? ` | By: ${n.author}` : ''}`,
        n.body,
        '---',
      ].join('\n')
    }).join('\n\n')

    const blob = new Blob([`CLUCKTRACK VET & ADVISOR NOTES\nExported: ${new Date().toLocaleDateString()}\n\n${text}`], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `vet-notes-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = filter === 'all' ? notes : notes.filter(n => n.category === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>🩺 Vet & Advisor Notes</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>Record vet visits, treatments and advisor recommendations</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {notes.length > 0 && (
            <button onClick={exportNotes} className="btn-secondary" style={{ fontSize: '13px' }}>📄 Export</button>
          )}
          <button onClick={() => setShowForm(v => !v)} className="btn-primary" style={{ fontSize: '13px' }}>
            {showForm ? '✕ Cancel' : '+ Add Note'}
          </button>
        </div>
      </div>

      {/* How it works callout */}
      <div style={{ padding: '14px 16px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '20px', flexShrink: 0 }}>💡</span>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 600, color: '#1d4ed8' }}>How to use Vet Collaboration</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', lineHeight: 1.5 }}>
            After a vet visit, type in what they said here. Share your farm data by pressing <strong>Export</strong> — it downloads a text file you can send via WhatsApp, email, or messaging app.
          </p>
        </div>
      </div>

      {/* Add note form */}
      {showForm && (
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>📝 New Vet / Advisor Note</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Category selector */}
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Type of note</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(CATEGORIES).map(([key, c]) => (
                  <button
                    key={key} type="button"
                    onClick={() => setForm(f => ({ ...f, category: key }))}
                    style={{
                      padding: '8px 14px', borderRadius: '8px', border: `2px solid ${form.category === key ? c.color : 'var(--border)'}`,
                      background: form.category === key ? c.bg : 'var(--surface-2)',
                      color: form.category === key ? c.color : 'var(--text-muted)',
                      fontSize: '12px', fontWeight: form.category === key ? 600 : 400, cursor: 'pointer',
                    }}
                  >
                    {c.icon} {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Title / Subject *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="e.g. Respiratory symptoms check" required />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Flock</label>
                <select value={form.flockName} onChange={e => setForm(f => ({ ...f, flockName: e.target.value }))} className="input-field" style={{ fontSize: '13px' }}>
                  <option value="General">General (All Flocks)</option>
                  {flocks.map(fl => <option key={fl.id} value={fl.name}>{fl.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Vet / Advisor Name</label>
                <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} placeholder="Dr. Smith (optional)" />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" style={{ fontSize: '13px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Notes / Details *</label>
              <textarea
                value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                className="input-field" style={{ fontSize: '13px', resize: 'vertical', minHeight: '100px' }}
                placeholder="What did the vet say? What treatment was prescribed? What should you watch for?…"
                required
              />
            </div>

            <button type="submit" className="btn-primary" style={{ fontSize: '14px', padding: '12px' }}>💾 Save Note</button>
          </form>
        </div>
      )}

      {/* Filter tabs */}
      {notes.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[{ key: 'all', label: `All (${notes.length})`, color: 'var(--accent)', bg: 'var(--accent-bg)' },
            ...Object.entries(CATEGORIES).map(([key, c]) => ({ key, label: c.label, color: c.color, bg: c.bg }))
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: filter === tab.key ? 600 : 400, border: 'none', cursor: 'pointer',
                background: filter === tab.key ? tab.bg : 'var(--surface-2)',
                color: filter === tab.key ? tab.color : 'var(--text-muted)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🩺</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 6px' }}>No notes yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>After each vet visit or advisor call, record the key points here so nothing is forgotten.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">+ Add First Note</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(note => {
            const cat = CATEGORIES[note.category] || CATEGORIES.observation
            return (
              <div key={note.id} className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${cat.color}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '99px', background: cat.bg, color: cat.color, fontWeight: 600 }}>
                        {cat.icon} {cat.label}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{note.flockName}</span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{note.title}</h3>
                  </div>
                  <button onClick={() => deleteNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '16px', flexShrink: 0 }}>🗑️</button>
                </div>
                <p style={{ margin: '0 0 10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{note.body}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-dim)' }}>
                  {note.date}{note.author ? ` · ${note.author}` : ''}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
