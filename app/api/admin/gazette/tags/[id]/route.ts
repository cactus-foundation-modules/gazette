import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess } from '@/modules/gazette/lib/permissions'
import { updateTag, deleteTag, countPostsForTag } from '@/modules/gazette/lib/db'
import { slugifyTitle } from '@/modules/gazette/lib/slug'

type Params = { params: Promise<{ id: string }> }

const Body = z.object({ name: z.string().min(1).max(60).optional(), slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional() })

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const { id } = await params
  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const { name, slug } = parsed.data
  await updateTag(id, { name, slug: slug ?? (name ? slugifyTitle(name) : undefined) })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const { id } = await params
  const count = await countPostsForTag(id)
  if (count > 0) return NextResponse.json({ error: `${count} posts use this tag`, count }, { status: 409 })

  await deleteTag(id)
  return NextResponse.json({ ok: true })
}
