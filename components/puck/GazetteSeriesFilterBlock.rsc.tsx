import { connection } from 'next/server'
import { getSeriesFilterOptions } from '@/modules/gazette/lib/db'
import { FilterBlockRender } from './filterBlockShared'
import { gazetteSeriesFilterPuckComponent, type GazetteSeriesFilterProps } from './GazetteSeriesFilterBlock'

// connection() first, so a listing embedding this block renders per request -
// a series published this morning has to show up in the filter without a
// redeploy, same as the post list itself.
export async function GazetteSeriesFilterRsc(props: GazetteSeriesFilterProps) {
  await connection()
  const options = await getSeriesFilterOptions()
  return (
    <FilterBlockRender
      props={props}
      dimension="series"
      options={options}
      defaultAllLabel="All series"
      ariaLabel="Filter posts by series"
    />
  )
}

export const gazetteSeriesFilterPuckRscComponent = { ...gazetteSeriesFilterPuckComponent, render: GazetteSeriesFilterRsc }
