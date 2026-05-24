export default function IconButton({
  label,
  children,
  className = '',
  size = 'md',
  variant = 'secondary',
  ...props
}) {
  const dimension = size === 'sm' ? '34px' : '42px'
  const destructive = variant === 'danger'

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`focus-ring inline-flex shrink-0 items-center justify-center rounded-lg border transition ${className}`}
      style={{
        width: dimension,
        height: dimension,
        minWidth: dimension,
        color: destructive ? 'var(--color-danger-700)' : 'var(--text-muted)',
        background: destructive ? 'var(--color-danger-50)' : 'var(--surface)',
        borderColor: destructive
          ? 'color-mix(in srgb, var(--color-danger-500) 26%, transparent)'
          : 'var(--border)',
      }}
      {...props}
    >
      {children}
    </button>
  )
}
