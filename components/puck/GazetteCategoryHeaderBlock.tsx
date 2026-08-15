import type { CSSProperties } from 'react'

// [ANCHOR] - heading/description are injected by the listing pages
// (lib/inject-category-context.ts) since a shared "gazetteCategory" layout has
// no fixed heading of its own (index/tag/series/author/archive each differ).
//
// Careful with field names: the injector Object.assigns the whole context over
// these props, so a field called `heading`, `description`, `page`, `baseUrl`,
// `year` or `month` would be silently overwritten at render time. The page
// builder's own wording therefore lives in `headingText`/`descriptionText`.
export type GazetteCategoryHeaderProps = {
  heading?: string
  description?: string | null
  headingText?: string
  descriptionText?: string
  eyebrow?: string
  level?: string
  size?: string
  align?: string
  showDescription?: string
  divider?: string
  spaceBelow?: string
}

const YES_NO = [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]

// Toggles are 'true'/'false' strings defaulting to ON, because Puck does not
// apply defaultProps to data that was saved before a field existed: the live
// listing layouts hold `props: { id: 'header-1' }` and nothing else, so
// `undefined` has to mean "carry on exactly as before this block had options".
const shows = (value?: string) => value !== 'false'

const HEADING_SIZES: Record<string, string> = { sm: '1.25rem', md: '1.5rem', lg: '1.875rem', xl: '2.5rem' }
const SPACE_BELOW: Record<string, string> = { none: '0', sm: '1rem', md: '2rem', lg: '3rem' }

// One layout serves five listings, so a fixed heading here would replace "Tag:
// Standing desks", "Posts by Ada" and the rest with the same string on every
// page. `{title}` stands in for whatever the page injected, which lets the
// wording be dressed up ("All about {title}") without losing which page it is.
export function resolveHeaderText(custom: string | undefined, injected: string | null | undefined): string {
  const own = (injected ?? '').trim()
  const text = (custom ?? '').trim()
  if (!text) return own
  return text.replace(/\{title\}/g, own).trim()
}

function wrapperStyle(props: GazetteCategoryHeaderProps): CSSProperties {
  const ruled = props.divider === 'true'
  return {
    textAlign: props.align === 'center' ? 'center' : undefined,
    marginBottom: SPACE_BELOW[props.spaceBelow ?? 'default'],
    paddingBottom: ruled ? '1rem' : undefined,
    borderBottom: ruled ? '1px solid var(--color-border)' : undefined,
  }
}

const EYEBROW_STYLE: CSSProperties = {
  margin: '0 0 0.5rem',
  fontSize: '0.8125rem',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--color-text-muted)',
}

// The heading tag follows the level so the page keeps a sensible outline; the
// size is separate, because a listing that wants a modest H1 shouldn't have to
// demote itself to an H2 to get one.
function headerParts(props: GazetteCategoryHeaderProps) {
  const level = props.level === 'h2' || props.level === 'h3' ? props.level : 'h1'
  return { Tag: level as 'h1' | 'h2' | 'h3', headingStyle: { fontSize: HEADING_SIZES[props.size ?? 'theme'] } as CSSProperties }
}

// Editor canvas: the same markup as the live render, with stand-in wording
// where the page will supply its own, dimmed to say so. Bars would hide what
// every one of these options actually does to the header.
export function GazetteCategoryHeader(props: GazetteCategoryHeaderProps) {
  return (
    <div style={{ opacity: 0.6 }}>
      <GazetteCategoryHeaderRsc
        {...props}
        heading={props.heading ?? 'Page heading'}
        description={props.description ?? "The page's own description"}
      />
    </div>
  )
}

export function GazetteCategoryHeaderRsc(props: GazetteCategoryHeaderProps) {
  const heading = resolveHeaderText(props.headingText, props.heading)
  const description = shows(props.showDescription) ? resolveHeaderText(props.descriptionText, props.description) : ''
  const eyebrow = (props.eyebrow ?? '').trim()
  if (!heading && !description && !eyebrow) return null

  const { Tag, headingStyle } = headerParts(props)

  return (
    <div style={wrapperStyle(props)}>
      {eyebrow && <p style={EYEBROW_STYLE}>{eyebrow}</p>}
      {heading && <Tag style={headingStyle}>{heading}</Tag>}
      {description && <p style={{ color: 'var(--color-text-muted)' }}>{description}</p>}
    </div>
  )
}

export const gazetteCategoryHeaderPuckComponent = {
  label: 'Gazette: Category Header [Anchor]',
  fields: {
    headingText: { type: 'text' as const, label: "Heading (blank for the page's own, {title} for it)" },
    level: {
      type: 'select' as const,
      label: 'Heading level',
      options: [
        { value: 'h1', label: 'Main heading' },
        { value: 'h2', label: 'Section heading' },
        { value: 'h3', label: 'Smaller heading' },
      ],
    },
    size: {
      type: 'select' as const,
      label: 'Heading size',
      options: [
        { value: 'theme', label: 'As the theme' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
        { value: 'xl', label: 'Extra large' },
      ],
    },
    eyebrow: { type: 'text' as const, label: 'Small label above (blank for none)' },
    align: { type: 'select' as const, label: 'Alignment', options: [{ value: 'left', label: 'Left' }, { value: 'center', label: 'Centred' }] },
    showDescription: { type: 'select' as const, label: 'Description', options: YES_NO },
    descriptionText: { type: 'text' as const, label: "Description (blank for the page's own)" },
    divider: { type: 'select' as const, label: 'Line underneath', options: YES_NO },
    spaceBelow: {
      type: 'select' as const,
      label: 'Space underneath',
      options: [
        { value: 'default', label: 'As the theme' },
        { value: 'none', label: 'None' },
        { value: 'sm', label: 'Small' },
        { value: 'md', label: 'Medium' },
        { value: 'lg', label: 'Large' },
      ],
    },
  },
  defaultProps: {
    headingText: '', level: 'h1', size: 'theme', eyebrow: '', align: 'left',
    showDescription: 'true', descriptionText: '', divider: 'false', spaceBelow: 'default',
  },
  // Wording for a description that has been switched off is a knob that
  // silently changes nothing.
  resolveFields: (data: { props?: GazetteCategoryHeaderProps }, { fields }: { fields: Record<string, unknown> }) => {
    const rest = { ...fields }
    if (!shows(data.props?.showDescription)) delete rest.descriptionText
    return rest
  },
  permissions: { delete: false, duplicate: false },
  render: GazetteCategoryHeader,
}

export const gazetteCategoryHeaderPuckRscComponent = { ...gazetteCategoryHeaderPuckComponent, render: GazetteCategoryHeaderRsc }
