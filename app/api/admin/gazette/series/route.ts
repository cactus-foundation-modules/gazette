import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listSeries, createSeries } from '@/modules/gazette/lib/db'
import { slugifyTitle } from '@/modules/gazette/lib/slug'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const series = await listSeries()
  return NextResponse.json({ series })
}

const Body = z.object({ title: z.string().min(1).max(200), description: z.string().max(500).optional().nullable() })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const { title, description } = parsed.data
  const slug = slugifyTitle(title)
  const series = await createSeries(title, slug, description ?? null)
  return NextResponse.json(series, { status: 201 })
}
