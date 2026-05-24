const VARIANTS = {
  success: {
    bg: 'var(--color-success-50)',
    fg: 'var(--color-success-700)',
    border: 'color-mix(in srgb, var(--color-success-500) 24%, transparent)',
    icon: '✓',
    role: 'status',
  },
  error: {
    bg: 'var(--color-danger-50)',
    fg: 'var(--color-danger-700)',
    border: 'color-mix(in srgb, var(--color-danger-500) 24%, transparent)',
    icon: '!',
    role: 'alert',
  },
  warning: {
    bg: 'var(--color-warning-50)',
    fg: 'var(--color-warning-700)',
    border: 'color-mix(in srgb, var(--color-warning-500) 30%, transparent)',
    icon: '!',
    role: 'status',
  },
  info: {
    bg: 'var(--color-info-50)',
    fg: 'var(--color-info-700)',
    border: 'color-mix(in srgb, var(--color-info-500) 24%, transparent)',
    icon: 'i',
    role: 'status',
  },
}

export default function Alert({ variant = 'info', title, children, className = '' }) {
  const tone = VARIANTS[variant] || VARIANTS.info

  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm ${className}`}
      role={tone.role}
      style={{
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
      }}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold"
          style={{
            background: 'color-mix(in srgb, currentColor 12%, transparent)',
            color: tone.fg,
          }}
        >
          {tone.icon}
        </span>
        <div className="min-w-0">
          {title && <p className="m-0 font-semibold">{title}</p>}
          <div className={title ? 'mt-1' : ''}>{children}</div>
        </div>
      </div>
    </div>
  )
}
