import { randomBytes, createHash } from 'crypto'
import { getSessionSecret } from '@/lib/config/env'

export const PREVIEW_TOKEN_EXPIRY_DAYS = 7

export function generatePreviewToken(): string {
  return randomBytes(32).toString('hex')
}

export function hashPreviewToken(token: string): string {
  return createHash('sha256').update(token + getSessionSecret()).digest('hex')
}

export function previewTokenExpiry(): Date {
  return new Date(Date.now() + PREVIEW_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
}
