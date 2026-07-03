'use client'

import { useState } from 'react'
import { getOrCreateVisitorToken } from '@/modules/gazette/lib/visitor'

export default function Reactions({ postId, reactionSet, initialCounts }: {
  postId: string
  reactionSet: string[]
  initialCounts: Record<string, number>
}) {
  const [counts, setCounts] = useState(initialCounts)
  const [active, setActive] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState<string | null>(null)

  async function toggle(emoji: string) {
    setBusy(emoji)
    const visitorToken = getOrCreateVisitorToken()
    const wasActive = active[emoji] ?? false

    setActive((prev) => ({ ...prev, [emoji]: !wasActive }))
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + (wasActive ? -1 : 1) }))

    try {
      const res = await fetch('/api/m/gazette/public/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, emoji, visitorToken }),
      })
      const data = await res.json()
      if (data?.counts) setCounts(data.counts)
      if (typeof data?.active === 'boolean') setActive((prev) => ({ ...prev, [emoji]: data.active }))
    } catch {
      // Revert optimistic update on failure
      setActive((prev) => ({ ...prev, [emoji]: wasActive }))
      setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + (wasActive ? 1 : -1) }))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="gz-reactions">
      {reactionSet.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="gz-reaction-btn"
          data-active={active[emoji] ? 'true' : 'false'}
          disabled={busy === emoji}
          onClick={() => toggle(emoji)}
        >
          {emoji} {counts[emoji] ?? 0}
        </button>
      ))}
    </div>
  )
}
