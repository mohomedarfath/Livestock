export default function PageHeader({ title, subtitle, breadcrumbs, actions, className = '' }) {
  return (
    <header className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${className}`}>
      <div className="min-w-0">
        {breadcrumbs?.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-2 text-caption" style={{ color: 'var(--text-dim)' }}>
            <ol className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
              {breadcrumbs.map((item, index) => (
                <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden>/</span>}
                  {item.href ? (
                    <a className="link-accent" href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="page-title m-0">{title}</h1>
        {subtitle && <p className="page-subtitle mt-2 max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
