import { NextRequest, NextResponse } from 'next/server'
import { getVisiblePosts, resolveAuthorIdByUsername } from '@/modules/gazette/lib/db'
import { getGazetteSettings } from '@/modules/gazette/lib/settings'
import { toPostCards } from '@/modules/gazette/lib/post-cards'
import type { GazettePostSort } from '@/modules/gazette/lib/types'

// Feeds the Entry List block's "Load more" and infinite scroll modes. Public
// and read-only: it returns exactly the publicly visible posts the listing
// would have rendered on the next page, nothing a visitor couldn't already see.
const MAX_PER_PAGE = 48

function intParam(value: string | null): number | undefined {
  const parsed = parseInt(value ?? '', 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseSort(value: string | null): GazettePostSort | undefined {
  return value === 'oldest' || value === 'views' || value === 'title' || value === 'newest' ? value : undefined
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams
  const settings = await getGazetteSettings()

  const page = Math.max(1, intParam(sp.get('page')) ?? 1)
  const requested = intParam(sp.get('perPage'))
  // Capped, so the endpoint can't be talked into dumping the whole blog in one go.
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, requested && requested > 0 ? requested : settings.postsPerPage))

  const authorUsername = sp.get('author')
  const authorId = authorUsername ? await resolveAuthorIdByUsername(authorUsername) : null
  const year = intParam(sp.get('year'))
  const month = intParam(sp.get('month'))

  const { posts, total } = await getVisiblePosts({
    page,
    perPage,
    tagSlug: sp.get('tag') ?? undefined,
    seriesSlug: sp.get('series') ?? undefined,
    authorId: authorId ?? undefined,
    year: year && year > 0 ? year : undefined,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    sort: parseSort(sp.get('sort')),
  })

  return NextResponse.json({ items: await toPostCards(posts, settings.postUrlStyle), hasMore: page * perPage < total })
}
