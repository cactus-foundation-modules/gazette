import Link from 'next/link'
import { getSeriesById, getSeriesPosts } from '@/modules/gazette/lib/db'
import { getPostUrlStyle, postHref } from '@/modules/gazette/lib/post-url'

export default async function SeriesNav({ seriesId, currentPostId }: { seriesId: string; currentPostId: string }) {
  const [series, posts, style] = await Promise.all([getSeriesById(seriesId), getSeriesPosts(seriesId), getPostUrlStyle()])
  if (!series) return null

  const visible = posts.filter((p) => p.status === 'PUBLISHED' || p.status === 'SCHEDULED')
  const index = visible.findIndex((p) => p.id === currentPostId)
  if (index === -1) return null

  const prev = index > 0 ? visible[index - 1] : null
  const next = index < visible.length - 1 ? visible[index + 1] : null

  return (
    <div className="gz-series-nav">
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        Part {index + 1} of {visible.length} in <Link href={`/gazette/series/${series.slug}`}>{series.title}</Link>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
        {prev ? <Link href={postHref(prev.slug, style)}>&larr; {prev.title}</Link> : <span />}
        {next ? <Link href={postHref(next.slug, style)}>{next.title} &rarr;</Link> : <span />}
      </div>
    </div>
  )
}
