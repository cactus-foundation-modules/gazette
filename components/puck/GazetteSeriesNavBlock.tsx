import { connection } from 'next/server'
import { getVisiblePostBySlug } from '@/modules/gazette/lib/db'
import SeriesNav from '@/modules/gazette/components/public/SeriesNav'
import GazetteStyles from '@/modules/gazette/components/public/GazetteStyles'

// entrySlug is injected by the post page (lib/inject-entry-context.ts)
export type GazetteSeriesNavProps = { entrySlug?: string }

export function GazetteSeriesNavBlock() {
  return <div style={{ height: 60, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

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

export const gazetteSeriesNavPuckComponent = {
  label: 'Gazette: Series Navigation',
  fields: {},
  defaultProps: {},
  render: GazetteSeriesNavBlock,
}

export const gazetteSeriesNavPuckRscComponent = { ...gazetteSeriesNavPuckComponent, render: GazetteSeriesNavBlockRsc }
