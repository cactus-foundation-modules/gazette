'use client'

import { useEffect, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => string
    }
  }
}

type Props = {
  postId: string
  parentId?: string | null
  loggedIn: boolean
  commentsVisibility: 'PUBLIC' | 'MEMBERS_ONLY'
  onSubmitted?: () => void
}

export default function CommentForm({ postId, parentId = null, loggedIn, commentsVisibility, onSubmitted }: Props) {
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [body, setBody] = useState('')
  const [siteKey, setSiteKey] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/auth/config')
      .then((r) => r.json())
      .then((d) => { if (d?.turnstileSiteKey) setSiteKey(d.turnstileSiteKey) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!siteKey) return
    if (document.getElementById('gz-turnstile-script')) return
    const script = document.createElement('script')
    script.id = 'gz-turnstile-script'
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    document.body.appendChild(script)
  }, [siteKey])

  if (commentsVisibility === 'MEMBERS_ONLY' && !loggedIn) {
    return <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Only members can comment.</p>
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('/api/m/gazette/public/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId, parentId, authorName, authorEmail, body,
          'cf-turnstile-response': turnstileToken,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Could not post your comment')
        return
      }
      setStatus('sent')
      setMessage(data.message ?? 'Thank you. Your comment is awaiting moderation.')
      setBody('')
      onSubmitted?.()
    } catch {
      setStatus('error')
      setMessage('Could not post your comment - check your connection')
    }
  }

  if (status === 'sent') {
    return <p style={{ color: 'var(--color-success)', fontSize: '0.875rem' }}>{message}</p>
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxWidth: 480 }}>
      <input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="Name"
        required
        style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }}
      />
      <input
        type="email"
        value={authorEmail}
        onChange={(e) => setAuthorEmail(e.target.value)}
        placeholder="Email (not published)"
        required
        style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
        required
        rows={4}
        style={{ padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical' }}
      />
      {siteKey && (
        <div
          className="cf-turnstile"
          data-sitekey={siteKey}
          ref={(el) => {
            if (el && window.turnstile && !el.dataset.rendered) {
              el.dataset.rendered = 'true'
              window.turnstile.render(el, { sitekey: siteKey, callback: setTurnstileToken })
            }
          }}
        />
      )}
      {status === 'error' && <p style={{ color: 'var(--color-destructive)', fontSize: '0.8125rem' }}>{message}</p>}
      <button type="submit" className="btn btn-primary btn-sm" disabled={status === 'sending'} style={{ alignSelf: 'flex-start' }}>
        {status === 'sending' ? 'Posting…' : 'Post comment'}
      </button>
    </form>
  )
}
