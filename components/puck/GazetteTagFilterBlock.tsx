// Editor half only. The database-backed render lives in ./GazetteTagFilterBlock.rsc.
import {
  filterBlockDefaults, filterBlockFields, FilterBlockEditorPreview, type GazetteFilterBlockProps,
} from './filterBlockShared'

export type GazetteTagFilterProps = GazetteFilterBlockProps

const ARIA_LABEL = 'Filter posts by tag'
const ALL_LABEL = 'All tags'

export function GazetteTagFilter(props: GazetteTagFilterProps) {
  return (
    <FilterBlockEditorPreview
      props={props}
      samples={['Ergonomics', 'Home working', 'Storage']}
      defaultAllLabel={ALL_LABEL}
      ariaLabel={ARIA_LABEL}
    />
  )
}

export const gazetteTagFilterPuckComponent = {
  label: 'Gazette: Tag Filter',
  fields: filterBlockFields(),
  defaultProps: filterBlockDefaults('Tags', ALL_LABEL),
  render: GazetteTagFilter,
}
