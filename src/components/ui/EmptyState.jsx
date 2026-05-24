export default function EmptyState({
  icon = 'No data',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div className={`card text-center ${className}`} style={{ padding: '32px 20px' }}>
      <div
        aria-hidden
        className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold"
        style={{ background: 'var(--accent-bg)', color: 'var(--accent-ink)' }}
      >
        {icon}
      </div>
      <h2 className="m-0 text-h3" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
