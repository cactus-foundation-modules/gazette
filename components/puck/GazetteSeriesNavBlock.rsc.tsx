import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import SeriesNav from '@/modules/gazette/components/public/SeriesNav'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'
import { gazetteSeriesNavPuckComponent, type GazetteSeriesNavProps } from './GazetteSeriesNavBlock'

export async function GazetteSeriesNavBlockRsc(props: GazetteSeriesNavProps) {
  await connection()
  if (!props.entrySlug) return null
  const post = await getVisiblePostBySlug(props.entrySlug)
  if (!post?.seriesId) return null
  return (
    <>
      <GazetteStyles />
      <SeriesNav seriesId={post.seriesId} currentPostId={post.id} />
    </>
  )
}
export const gazetteSeriesNavPuckRscComponent = { ...gazetteSeriesNavPuckComponent, render: GazetteSeriesNavBlockRsc }
