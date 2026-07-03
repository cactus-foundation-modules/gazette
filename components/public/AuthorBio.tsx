import { prisma } from '@/lib/db/prisma'
import { getAuthorProfile } from '@/modules/gazette/lib/db'
import { markdownToHtml } from '@/lib/sanitize'

export default async function AuthorBio({ authorId, importedAuthorName }: { authorId: string | null; importedAuthorName: string | null }) {
  if (!authorId) {
    if (!importedAuthorName) return null
    return (
      <div className="gz-author-bio">
        <div><strong>{importedAuthorName}</strong></div>
      </div>
    )
  }

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: authorId }, select: { displayName: true, username: true } }),
    getAuthorProfile(authorId),
  ])
  if (!user) return null
  if (!profile?.bio && !profile?.avatarId) return null

  const avatar = profile.avatarId ? await prisma.media.findUnique({ where: { id: profile.avatarId }, select: { url: true } }) : null

  return (
    <div className="gz-author-bio">
      {avatar?.url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar.url} alt="" />
      )}
      <div>
        <strong>{user.displayName ?? user.username}</strong>
        {profile.bio && <div dangerouslySetInnerHTML={{ __html: markdownToHtml(profile.bio) }} />}
      </div>
    </div>
  )
}
