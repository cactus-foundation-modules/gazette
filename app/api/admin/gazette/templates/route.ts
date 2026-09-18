import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canViewGazetteAdmin } from '@/modules/gazette/lib/permissions'
import { listTemplates, createTemplate } from '@/modules/gazette/lib/db'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!canViewGazetteAdmin(access)) return errorResponse('Forbidden', 403)

  const templates = await listTemplates()
  return NextResponse.json({ templates })
}

// The Puck document shape, loosely: a template is a starting point every
// writer can pick, so its outline is checked rather than taken on trust. Block
// props stay open - they are whatever each block defines.
const PuckBlock = z.object({ type: z.string(), props: z.record(z.string(), z.unknown()) }).passthrough()
const BuilderData = z.object({
  root: z.object({ props: z.record(z.string(), z.unknown()).optional() }).passthrough(),
  content: z.array(PuckBlock),
  zones: z.record(z.string(), z.array(PuckBlock)).optional(),
}).passthrough()

const Body = z.object({ title: z.string().min(1).max(200), builderData: BuilderData.optional().nullable() })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  // Editors only, matching rename and delete: a template is shared by every
  // writer, so adding one is an editorial call rather than a personal one.
  if (!access.isEditor) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const template = await createTemplate(parsed.data.title, parsed.data.builderData ?? null)
  return NextResponse.json(template, { status: 201 })
}
