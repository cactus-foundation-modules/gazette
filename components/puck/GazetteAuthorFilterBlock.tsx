// Editor half only. The database-backed render lives in ./GazetteAuthorFilterBlock.rsc.
import {
  filterBlockDefaults, filterBlockFields, FilterBlockEditorPreview, type GazetteFilterBlockProps,
} from './filterBlockShared'

export type GazetteAuthorFilterProps = GazetteFilterBlockProps

const ARIA_LABEL = 'Filter posts by author'
const ALL_LABEL = 'All authors'

export function GazetteAuthorFilter(props: GazetteAuthorFilterProps) {
  return (
    <FilterBlockEditorPreview
      props={props}
      samples={['Alex Morgan', 'Priya Shah', 'Sam Okafor']}
      defaultAllLabel={ALL_LABEL}
      ariaLabel={ARIA_LABEL}
    />
  )
}

export const gazetteAuthorFilterPuckComponent = {
  label: 'Gazette: Author Filter',
  fields: filterBlockFields(),
  defaultProps: filterBlockDefaults('Authors', ALL_LABEL),
  render: GazetteAuthorFilter,
}
