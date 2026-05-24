const STATUS_STYLES = {
  ok:    { color: '#16a34a', label: 'OK' },
  low:   { color: '#d97706', label: 'Low' },
  empty: { color: '#dc2626', label: 'Empty' },
}

export default function StatusDot({ status = 'ok', showLabel = true, size = 8 }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.ok

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
      <span
        aria-hidden
        style={{
          width: `${size}px`, height: `${size}px`, borderRadius: '999px',
          background: style.color, flexShrink: 0,
          boxShadow: `0 0 0 2px color-mix(in srgb, ${style.color} 18%, transparent)`,
        }}
      />
      {showLabel && (
        <span style={{ fontSize: '12px', fontWeight: 600, color: style.color }}>
          {style.label}
        </span>
      )}
    </span>
  )
}
