import { useEffect, useMemo, useRef, useState } from 'react'

function matchesCommand(command, query) {
  const value = query.trim().toLowerCase()
  if (!value) return true
  return [command.label, command.group, command.keywords]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(value)
}

export default function CommandPalette({ commands = [], open, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)

  const filtered = useMemo(
    () => commands.filter((command) => matchesCommand(command, query)).slice(0, 8),
    [commands, query]
  )

  useEffect(() => {
    if (!open) return
    setQuery('')
    window.setTimeout(() => searchRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[75] flex items-start justify-center px-4 pt-20"
      style={{ background: 'var(--overlay)' }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-xl overflow-hidden rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 24px 70px var(--shadow-md)',
        }}
      >
        <div className="border-b p-3" style={{ borderColor: 'var(--border)' }}>
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and actions"
            className="input-field"
            aria-label="Search commands"
          />
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No matching command
            </div>
          ) : (
            filtered.map((command) => (
              <button
                key={command.id}
                type="button"
                className="focus-ring flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                style={{ color: 'var(--text)' }}
                onClick={() => {
                  onSelect(command)
                  onClose()
                }}
              >
                <span
                  aria-hidden
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)' }}
                >
                  {command.icon || command.label.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{command.label}</span>
                  {command.group && (
                    <span className="block text-xs" style={{ color: 'var(--text-dim)' }}>
                      {command.group}
                    </span>
                  )}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  Open
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
