import { prisma } from '@/lib/db/prisma'
import type { GazetteSettings } from './types'

export const DEFAULT_REACTION_SET = ['👍', '❤️', '🔥', '💡']

function mapRow(r: Record<string, unknown>): GazetteSettings {
  return {
    id: r.id as string,
    postsPerPage: r.posts_per_page as number,
    rssEnabled: r.rss_enabled as boolean,
    feedTitle: (r.feed_title as string | null) ?? null,
    feedDescription: (r.feed_description as string | null) ?? null,
    commentsEnabled: r.comments_enabled as boolean,
    commentsVisibility: r.comments_visibility as GazetteSettings['commentsVisibility'],
    commentModeration: r.comment_moderation as GazetteSettings['commentModeration'],
    commentsThreaded: r.comments_threaded as boolean,
    reactionsEnabled: r.reactions_enabled as boolean,
    reactionSet: (r.reaction_set as string[] | null) ?? null,
    showViewCounts: r.show_view_counts as boolean,
    updatedAt: r.updated_at as Date,
  }
}

export async function getGazetteSettings(): Promise<GazetteSettings> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "gz_settings" WHERE "id" = 'singleton' LIMIT 1
  `
  const row = rows[0]
  const settings = row
    ? mapRow(row)
    : {
        id: 'singleton', postsPerPage: 10, rssEnabled: true, feedTitle: null, feedDescription: null,
        commentsEnabled: true, commentsVisibility: 'PUBLIC' as const, commentModeration: 'PRE' as const,
        commentsThreaded: true, reactionsEnabled: true, reactionSet: null, showViewCounts: false,
        updatedAt: new Date(),
      }
  if (!settings.reactionSet || settings.reactionSet.length === 0) {
    settings.reactionSet = DEFAULT_REACTION_SET
  }
  return settings
}

export type UpdateSettingsInput = Partial<{
  postsPerPage: number
  rssEnabled: boolean
  feedTitle: string | null
  feedDescription: string | null
  commentsEnabled: boolean
  commentsVisibility: GazetteSettings['commentsVisibility']
  commentModeration: GazetteSettings['commentModeration']
  commentsThreaded: boolean
  reactionsEnabled: boolean
  reactionSet: string[]
  showViewCounts: boolean
}>

export async function updateGazetteSettings(input: UpdateSettingsInput): Promise<GazetteSettings> {
  const current = await getGazetteSettings()
  const merged = { ...current, ...input }

  await prisma.$executeRaw`
    INSERT INTO "gz_settings" (
      "id", "posts_per_page", "rss_enabled", "feed_title", "feed_description",
      "comments_enabled", "comments_visibility", "comment_moderation", "comments_threaded",
      "reactions_enabled", "reaction_set", "show_view_counts", "updated_at"
    ) VALUES (
      'singleton', ${merged.postsPerPage}, ${merged.rssEnabled}, ${merged.feedTitle}, ${merged.feedDescription},
      ${merged.commentsEnabled}, ${merged.commentsVisibility}, ${merged.commentModeration}, ${merged.commentsThreaded},
      ${merged.reactionsEnabled}, ${JSON.stringify(merged.reactionSet)}::jsonb, ${merged.showViewCounts}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "posts_per_page" = ${merged.postsPerPage},
      "rss_enabled" = ${merged.rssEnabled},
      "feed_title" = ${merged.feedTitle},
      "feed_description" = ${merged.feedDescription},
      "comments_enabled" = ${merged.commentsEnabled},
      "comments_visibility" = ${merged.commentsVisibility},
      "comment_moderation" = ${merged.commentModeration},
      "comments_threaded" = ${merged.commentsThreaded},
      "reactions_enabled" = ${merged.reactionsEnabled},
      "reaction_set" = ${JSON.stringify(merged.reactionSet)}::jsonb,
      "show_view_counts" = ${merged.showViewCounts},
      "updated_at" = CURRENT_TIMESTAMP
  `
  return getGazetteSettings()
}
