'use client'

import { useEffect } from 'react'
import { getOrCreateVisitorToken } from '@/modules/gazette/lib/visitor'

export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const visitorToken = getOrCreateVisitorToken()
    fetch('/api/m/gazette/public/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, visitorToken }),
    }).catch(() => { /* best-effort */ })
  }, [postId])

  return null
}
