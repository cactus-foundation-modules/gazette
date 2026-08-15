// Presentational only - no data access - so the Puck editor half of the filter
// blocks can render the exact same markup and classes as the RSC half.

export type GazetteFilterChip = {
  key: string
  label: string
  count?: number
  href: string
  active: boolean
}

export default function FilterChips({
  title, ariaLabel, items, variant, showCounts,
}: {
  title?: string
  ariaLabel: string
  items: GazetteFilterChip[]
  variant: 'pills' | 'list'
  showCounts: boolean
}) {
  if (items.length === 0) return null

  return (
    <nav className={variant === 'list' ? 'gz-filter gz-filter-list' : 'gz-filter'} aria-label={title || ariaLabel}>
      {title ? <h2 className="gz-filter-title">{title}</h2> : null}
      <ul className="gz-filter-items">
        {items.map((item) => (
          <li key={item.key}>
            <a
              className="gz-filter-chip"
              href={item.href}
              data-active={item.active ? 'true' : 'false'}
              aria-current={item.active ? 'true' : undefined}
            >
              {item.label}
              {showCounts && typeof item.count === 'number' && (
                <span className="gz-filter-count">{item.count}</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
