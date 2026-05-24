const VARIANTS = {
  neutral: { bg: 'var(--surface-2)', fg: 'var(--text-muted)' },
  success: { bg: 'var(--color-success-50)', fg: 'var(--color-success-700)' },
  warning: { bg: 'var(--color-warning-50)', fg: 'var(--color-warning-700)' },
  danger: { bg: 'var(--color-danger-50)', fg: 'var(--color-danger-700)' },
  info: { bg: 'var(--color-info-50)', fg: 'var(--color-info-700)' },
}

export default function Badge({ variant = 'neutral', children, className = '' }) {
  const tone = VARIANTS[variant] || VARIANTS.neutral

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-caption font-semibold ${className}`}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {children}
    </span>
  )
}
