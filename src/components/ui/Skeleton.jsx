export default function Skeleton({ variant = 'card', count = 1, className = '' }) {
  const heights = {
    card: 'h-24',
    table: 'h-12',
    list: 'h-16',
  }

  return (
    <div className={`grid gap-3 ${className}`} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className={`animate-pulse rounded-lg ${heights[variant] || heights.card}`}
          style={{
            background: 'linear-gradient(90deg, var(--surface-2), color-mix(in srgb, var(--surface-2) 55%, var(--surface)), var(--surface-2))',
            border: '1px solid var(--border)',
          }}
        />
      ))}
    </div>
  )
}
