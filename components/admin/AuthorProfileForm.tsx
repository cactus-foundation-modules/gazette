'use client'

import { useState } from 'react'
import { OgImagePickerField } from '@/lib/puck/MediaPickerField'
import type { CustomField } from '@puckeditor/core'

export default function AuthorProfileForm({ userId, bio: initialBio, avatarId: initialAvatarId }: {
  userId: string
  bio: string
  avatarId: string
}) {
  const [bio, setBio] = useState(initialBio)
  const [avatarId, setAvatarId] = useState(initialAvatarId)
  const [saved, setSaved] = useState(false)

  async function save() {
    await fetch(`/api/m/gazette/admin/authors/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio, avatarId }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card" style={{ padding: '1.5rem', maxWidth: 480 }}>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Avatar</label>
      <div style={{ margin: '0.375rem 0 1rem' }}>
        <OgImagePickerField
          name="avatarId" id="avatarId"
          value={avatarId}
          onChange={setAvatarId}
          field={{ label: '' } as CustomField<string>}
        />
      </div>
      <label style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Bio (Markdown)</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={8}
        style={{ width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, fontFamily: 'inherit', fontSize: '0.875rem', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'vertical', margin: '0.375rem 0 1rem' }}
      />
      <button className="btn btn-primary btn-sm" onClick={save}>{saved ? 'Saved' : 'Save'}</button>
    </div>
  )
}
