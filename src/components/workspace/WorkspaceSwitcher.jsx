import { useState } from 'react'
import { useWorkspaceMode } from '../../workspace/useWorkspaceMode'
import { WORKSPACE_MODES } from '../../workspace/workspaceModes'

export default function WorkspaceSwitcher() {
  const { workspaceMode, setWorkspaceMode, availableWorkspaces } = useWorkspaceMode()
  const [open, setOpen] = useState(false)

  if (availableWorkspaces.length <= 1) return null

  const current = WORKSPACE_MODES[workspaceMode] || WORKSPACE_MODES.farm

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="focus-ring flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
        style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)', fontWeight: 700 }}
      >
        <span>{current.shortLabel}</span>
        <span style={{ opacity: 0.65 }}>v</span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-50 rounded-xl overflow-hidden p-2"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px var(--shadow-md)',
            minWidth: '220px',
          }}
        >
          {availableWorkspaces.map((mode) => {
            const option = WORKSPACE_MODES[mode]
            const selected = mode === workspaceMode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setWorkspaceMode(mode)
                  setOpen(false)
                }}
                className="focus-ring w-full rounded-lg px-3 py-2 text-left"
                style={{
                  background: selected ? 'var(--accent-bg)' : 'transparent',
                  color: selected ? 'var(--accent-ink)' : 'var(--text-muted)',
                }}
              >
                <span className="block text-sm font-semibold">{option.label}</span>
                <span className="block text-xs" style={{ color: selected ? 'var(--accent-ink)' : 'var(--text-dim)' }}>
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
