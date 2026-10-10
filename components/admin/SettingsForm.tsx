'use client'

import { useState } from 'react'
import type { GazetteSettings } from '@/modules/gazette/lib/types'
import { SettingsHeaderActions, SettingsHeaderStatus } from '@/components/admin/SettingsHeaderActions'

// The gazette's settings, under Settings > General > Gazette. Each card is a section;
// the fields inside sit two across (see .settings-cols in core's stylesheet). The
// Save button lives in the Settings bar at the top of the page.
export default function SettingsForm({ settings: initial }: { settings: GazetteSettings }) {
  const [settings, setSettings] = useState(initial)
  const [newEmoji, setNewEmoji] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof GazetteSettings>(key: K, value: GazetteSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)
    try {
      const res = await fetch('/api/m/gazette/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const d = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(d?.error ?? 'Could not save the gazette settings')
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the gazette settings')
    } finally {
      setSaving(false)
    }
  }

  function addEmoji() {
    const emoji = newEmoji.trim()
    if (!emoji) return
    set('reactionSet', [...reactionSet, emoji])
    setNewEmoji('')
  }

  const reactionSet = settings.reactionSet ?? []

  return (
    <div className="settings-cols">
      <SettingsHeaderActions>
        <SettingsHeaderStatus message={saved ? 'Saved' : null} error={error || null} />
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </SettingsHeaderActions>

      <div className="card">
        <div className="card-title">Posts</div>
        <div className="field">
          <label htmlFor="gz-posts-per-page">Posts per page</label>
          <input
            id="gz-posts-per-page"
            type="number"
            min={1}
            max={100}
            value={settings.postsPerPage}
            onChange={(e) => set('postsPerPage', Number(e.target.value))}
          />
          <span className="field-hint">How many posts the listing, tag and archive pages show at a time.</span>
        </div>
        <div className="field">
          <label htmlFor="gz-post-links">Post links</label>
          <select
            id="gz-post-links"
            value={settings.postUrlStyle}
            onChange={(e) => set('postUrlStyle', e.target.value as GazetteSettings['postUrlStyle'])}
          >
            <option value="PREFIXED">Under the gazette (/gazette/your-post)</option>
            <option value="ROOT">Straight off the home page (/your-post)</option>
          </select>
          <span className="field-hint">
            Old links keep working and send readers on. Listings, tags and archives stay under /gazette.
          </span>
        </div>
        <div className="field">
          <label className="settings-check">
            <input type="checkbox" checked={settings.showViewCounts} onChange={(e) => set('showViewCounts', e.target.checked)} />
            Show view counts publicly
          </label>
        </div>
      </div>

      <div className="card">
        <div className="card-title">RSS</div>
        <div className="field field--wide">
          <label className="settings-check">
            <input type="checkbox" checked={settings.rssEnabled} onChange={(e) => set('rssEnabled', e.target.checked)} />
            Enable RSS feed
          </label>
        </div>
        <div className="field">
          <label htmlFor="gz-feed-title">Feed title</label>
          <input
            id="gz-feed-title"
            value={settings.feedTitle ?? ''}
            onChange={(e) => set('feedTitle', e.target.value || null)}
          />
        </div>
        <div className="field">
          <label htmlFor="gz-feed-description">Feed description</label>
          <textarea
            id="gz-feed-description"
            value={settings.feedDescription ?? ''}
            onChange={(e) => set('feedDescription', e.target.value || null)}
            rows={2}
          />
        </div>
      </div>

      <div className="card">
        <div className="card-title">Comments and reactions</div>
        <div className="field">
          <label className="settings-check">
            <input type="checkbox" checked={settings.commentsEnabled} onChange={(e) => set('commentsEnabled', e.target.checked)} />
            Enable comments
          </label>
        </div>
        <div className="field">
          <label className="settings-check">
            <input type="checkbox" checked={settings.commentsThreaded} onChange={(e) => set('commentsThreaded', e.target.checked)} />
            Threaded replies
          </label>
        </div>
        <div className="field">
          <label htmlFor="gz-comments-visibility">Who can see comments</label>
          <select
            id="gz-comments-visibility"
            value={settings.commentsVisibility}
            onChange={(e) => set('commentsVisibility', e.target.value as GazetteSettings['commentsVisibility'])}
          >
            <option value="PUBLIC">Everyone</option>
            <option value="MEMBERS_ONLY">Members only</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="gz-comment-moderation">Check comments</label>
          <select
            id="gz-comment-moderation"
            value={settings.commentModeration}
            onChange={(e) => set('commentModeration', e.target.value as GazetteSettings['commentModeration'])}
          >
            <option value="PRE">Before they are published</option>
            <option value="POST">After they are published</option>
          </select>
        </div>
        <div className="field">
          <label className="settings-check">
            <input type="checkbox" checked={settings.reactionsEnabled} onChange={(e) => set('reactionsEnabled', e.target.checked)} />
            Enable reactions
          </label>
        </div>
        <div className="field field--wide">
          <label htmlFor="gz-new-emoji">Reactions on offer</label>
          {reactionSet.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {reactionSet.map((emoji, i) => (
                <span key={`${emoji}-${i}`} className="badge badge-default" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {emoji}
                  <button
                    type="button"
                    aria-label={`Remove ${emoji}`}
                    onClick={() => set('reactionSet', reactionSet.filter((_, j) => j !== i))}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'inherit', padding: 0 }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="field-hint" style={{ display: 'block', marginBottom: '0.5rem' }}>None yet.</span>
          )}
          <div style={{ display: 'flex', gap: '0.375rem', maxWidth: '20rem' }}>
            <input
              id="gz-new-emoji"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmoji() } }}
              placeholder="Add an emoji…"
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={addEmoji}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
