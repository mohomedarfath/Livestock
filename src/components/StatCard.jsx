const TONE_COLORS = {
  neutral: { bg: 'var(--surface)', fg: 'var(--text)', accentBg: 'var(--surface-2, #f1f5f9)', accentFg: 'var(--text-muted)' },
  amber:   { bg: 'var(--surface)', fg: 'var(--color-warning-700)', accentBg: 'var(--color-warning-50)', accentFg: 'var(--color-warning-700)' },
  blue:    { bg: 'var(--surface)', fg: 'var(--color-info-700)', accentBg: 'var(--color-info-50)', accentFg: 'var(--color-info-700)' },
  green:   { bg: 'var(--surface)', fg: 'var(--color-success-700)', accentBg: 'var(--color-success-50)', accentFg: 'var(--color-success-700)' },
  orange:  { bg: 'var(--surface)', fg: 'var(--accent-ink)', accentBg: 'var(--accent-bg)', accentFg: 'var(--accent-ink)' },
  red:     { bg: 'var(--surface)', fg: 'var(--color-danger-700)', accentBg: 'var(--color-danger-50)', accentFg: 'var(--color-danger-700)' },
  violet:  { bg: 'var(--surface)', fg: 'var(--chart-violet)', accentBg: 'color-mix(in srgb, var(--chart-violet) 14%, var(--surface))', accentFg: 'var(--chart-violet)' },
}

export default function StatCard({ label, value, icon, tone = 'neutral', hint }) {
  const palette = TONE_COLORS[tone] || TONE_COLORS.neutral

  return (
    <div
      className="card"
      style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', minHeight: '72px' }}
    >
      {icon != null && (
        <div
          aria-hidden
          style={{
            width: '38px', height: '38px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: palette.accentBg, color: palette.accentFg,
            fontSize: '18px', flexShrink: 0,
          }}
        >
          {icon}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{
          margin: 0, fontSize: '11px', fontWeight: 600,
          letterSpacing: '.04em', textTransform: 'uppercase',
          color: 'var(--text-dim)',
        }}>
          {label}
        </p>
        <p style={{
          margin: '2px 0 0', fontSize: '20px', fontWeight: 700,
          color: tone === 'neutral' ? 'var(--text)' : palette.fg,
          lineHeight: 1.1,
        }}>
          {value}
        </p>
        {hint && (
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>{hint}</p>
        )}
      </div>
    </div>
  )
}
