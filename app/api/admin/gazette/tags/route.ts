import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { getTagsWithCounts, createTag } from '@/modules/gazette/lib/db'
import { slugifyTitle } from '@/modules/gazette/lib/slug'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const tags = await getTagsWithCounts()
  return NextResponse.json({ tags })
}

const Body = z.object({ name: z.string().min(1).max(60) })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const name = parsed.data.name.trim()
  const slug = slugifyTitle(name)
  const tag = await createTag(name, slug)
  return NextResponse.json(tag, { status: 201 })
}
