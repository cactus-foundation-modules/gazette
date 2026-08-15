import { connection } from 'next/server'
import { getAuthorFilterOptions } from '@/modules/gazette/lib/db'
import { FilterBlockRender } from './filterBlockShared'
import { gazetteAuthorFilterPuckComponent, type GazetteAuthorFilterProps } from './GazetteAuthorFilterBlock'

export async function GazetteAuthorFilterRsc(props: GazetteAuthorFilterProps) {
  await connection()
  const options = await getAuthorFilterOptions()
  return (
    <FilterBlockRender
      props={props}
      dimension="author"
      options={options}
      defaultAllLabel="All authors"
      ariaLabel="Filter posts by author"
    />
  )
}

export const gazetteAuthorFilterPuckRscComponent = { ...gazetteAuthorFilterPuckComponent, render: GazetteAuthorFilterRsc }
