import { connection } from 'next/server'
import { getTagFilterOptions } from '@/modules/gazette/lib/db'
import { FilterBlockRender } from './filterBlockShared'
import { gazetteTagFilterPuckComponent, type GazetteTagFilterProps } from './GazetteTagFilterBlock'

export async function GazetteTagFilterRsc(props: GazetteTagFilterProps) {
  await connection()
  const options = await getTagFilterOptions()
  return (
    <FilterBlockRender
      props={props}
      dimension="tag"
      options={options}
      defaultAllLabel="All tags"
      ariaLabel="Filter posts by tag"
    />
  )
}

export const gazetteTagFilterPuckRscComponent = { ...gazetteTagFilterPuckComponent, render: GazetteTagFilterRsc }
