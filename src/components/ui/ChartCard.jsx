import EmptyState from './EmptyState'
import Skeleton from './Skeleton'

export default function ChartCard({ title, subtitle, children, empty, loading = false }) {
  return (
    <section
      className="card"
      style={{
        padding: '18px 20px',
        minHeight: '284px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ minHeight: '200px', flex: 1 }}>
        {loading ? <Skeleton /> : empty ? <EmptyState icon="-" title={empty} /> : children}
      </div>
    </section>
  )
}
