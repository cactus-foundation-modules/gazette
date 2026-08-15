// Editor half only. The database-backed render lives in ./GazetteSeriesFilterBlock.rsc.
import {
  filterBlockDefaults, filterBlockFields, FilterBlockEditorPreview, type GazetteFilterBlockProps,
} from './filterBlockShared'

export type GazetteSeriesFilterProps = GazetteFilterBlockProps

const ARIA_LABEL = 'Filter posts by series'
const ALL_LABEL = 'All series'

export function GazetteSeriesFilter(props: GazetteSeriesFilterProps) {
  return (
    <FilterBlockEditorPreview
      props={props}
      samples={['Desk buying guide', 'Behind the scenes', 'Office ergonomics']}
      defaultAllLabel={ALL_LABEL}
      ariaLabel={ARIA_LABEL}
    />
  )
}

export const gazetteSeriesFilterPuckComponent = {
  label: 'Gazette: Series Filter',
  fields: filterBlockFields(),
  defaultProps: filterBlockDefaults('Series', ALL_LABEL),
  render: GazetteSeriesFilter,
}
