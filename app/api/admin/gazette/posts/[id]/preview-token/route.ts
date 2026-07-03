import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { errorResponse } from '@/lib/utils'
import { getGazetteAccess, canEditPost } from '@/modules/gazette/lib/permissions'
import { getPostById, setPreviewToken } from '@/modules/gazette/lib/db'
import { generatePreviewToken, hashPreviewToken, previewTokenExpiry } from '@/modules/gazette/lib/preview'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  const access = await getGazetteAccess(user)
  if (!access.role && !access.isAdminUser) return errorResponse('Forbidden', 403)

  const { id } = await params
  const post = await getPostById(id)
  if (!post) return errorResponse('Not found', 404)
  if (!canEditPost(access, user.id, post)) return errorResponse('Forbidden', 403)

  const token = generatePreviewToken()
  const hash = hashPreviewToken(token)
  const expiresAt = previewTokenExpiry()

  await setPreviewToken(id, hash, expiresAt)

  return NextResponse.json({ url: `/gazette/preview/${token}`, expiresAt })
}
