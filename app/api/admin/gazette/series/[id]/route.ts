import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getSeriesById, updateSeries, deleteSeries, getSeriesPosts } from '@/modules/gazette/lib/db'
import { slugifyTitle } from '@/modules/gazette/lib/slug'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const { id } = await params
  const series = await getSeriesById(id)
  if (!series) return errorResponse('Not found', 404)
  const posts = await getSeriesPosts(id)
  return NextResponse.json({ ...series, posts })
}

const Body = z.object({
  title: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const { id } = await params
  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const { title, slug, description } = parsed.data
  await updateSeries(id, { title, slug: slug ?? (title ? slugifyTitle(title) : undefined), description })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const { id } = await params
  await deleteSeries(id)
  return NextResponse.json({ ok: true })
}
