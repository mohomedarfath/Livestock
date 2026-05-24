export default function Tabs({ tabs, value, onChange, ariaLabel = 'Tabs' }) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const selected = tab.value === value
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold"
            style={{
              background: selected ? 'var(--accent-bg)' : 'var(--surface)',
              color: selected ? 'var(--accent-ink)' : 'var(--text-muted)',
              border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
            }}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
