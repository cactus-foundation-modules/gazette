'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import PostCardGrid from './PostCardGrid'
import type { GazettePostCard, PostCardDisplay } from '@/modules/gazette/lib/types'

// What the endpoint needs to carry on from where the server render stopped.
export type PostListQuery = {
  perPage: number
  tag?: string
  series?: string
  author?: string
  year?: number
  month?: number
  sort?: string
}

// Used for both "Load more" and infinite scroll. Infinite scroll keeps the
// button as well as the observer: it is the only thing a keyboard gets, and it
// is the fallback when there's no IntersectionObserver to hand.
export default function PostListLoadMore({
  initialCards, initialPage, initialHasMore, query, mode, columns, display, loadMoreLabel, imageRatio, hover,
}: {
  initialCards: GazettePostCard[]
  initialPage: number
  initialHasMore: boolean
  query: PostListQuery
  mode: 'more' | 'infinite'
  columns?: string
  display?: PostCardDisplay
  loadMoreLabel: string
  imageRatio?: string
  hover?: string
}) {
  const [cards, setCards] = useState(initialCards)
  const [page, setPage] = useState(initialPage)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)
  const sentinel = useRef<HTMLDivElement | null>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    setFailed(false)
    try {
      const params = new URLSearchParams({ page: String(page + 1), perPage: String(query.perPage) })
      if (query.tag) params.set('tag', query.tag)
      if (query.series) params.set('series', query.series)
      if (query.author) params.set('author', query.author)
      if (query.year) params.set('year', String(query.year))
      if (query.month) params.set('month', String(query.month))
      if (query.sort) params.set('sort', query.sort)

      const res = await fetch(`/api/m/gazette/public/posts?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      const items: GazettePostCard[] = Array.isArray(data?.items) ? data.items : []

      // A post published between one page and the next shifts the window along,
      // which would otherwise show the same card twice.
      setCards((prev) => {
        const seen = new Set(prev.map((c) => c.id))
        return [...prev, ...items.filter((item) => !seen.has(item.id))]
      })
      setPage((p) => p + 1)
      setHasMore(!!data?.hasMore)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, page, query])

  useEffect(() => {
    // One failed fetch stops the auto-loading, otherwise a visitor sitting at
    // the bottom of a broken list retries forever. The button still works.
    if (mode !== 'infinite' || !hasMore || failed) return
    const el = sentinel.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => { if (entries.some((e) => e.isIntersecting)) void loadMore() },
      { rootMargin: '400px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [mode, hasMore, failed, loadMore])

  return (
    <>
      <PostCardGrid cards={cards} columns={columns} display={display} imageRatio={imageRatio} hover={hover} />
      <div className="gz-load-more" ref={sentinel}>
        {hasMore && (
          <button type="button" className="gz-load-more-btn" onClick={() => void loadMore()} disabled={loading}>
            {loading ? 'Loading...' : failed ? 'Try again' : loadMoreLabel}
          </button>
        )}
        {failed && <p className="gz-load-more-error" role="alert">That did not load. Have another go.</p>}
      </div>
    </>
  )
}
