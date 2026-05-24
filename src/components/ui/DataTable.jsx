import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data,
  getRowKey,
  empty,
  footer,
  className = '',
}) {
  const rows = data || []

  return (
    <div className={`card overflow-hidden p-0 ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-semibold ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                  style={{ color: 'var(--text-muted)', minWidth: column.minWidth }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={getRowKey ? getRowKey(row) : row.id ?? index}
                className="border-b transition-colors hover:bg-[var(--surface-2)]"
                style={{ borderColor: 'color-mix(in srgb, var(--border) 48%, transparent)' }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-top ${column.align === 'right' ? 'text-right' : 'text-left'}`}
                    style={{ color: column.muted ? 'var(--text-muted)' : 'var(--text)' }}
                  >
                    {column.render ? column.render(row) : row[column.key] ?? '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          {footer && rows.length > 0 && (
            <tfoot>
              {footer}
            </tfoot>
          )}
        </table>
      </div>
      {rows.length === 0 && (
        <div className="p-4">
          {empty || (
            <EmptyState
              icon="None"
              title="No records found"
              description="Try changing the filters or adding a new record."
            />
          )}
        </div>
      )}
    </div>
  )
}
