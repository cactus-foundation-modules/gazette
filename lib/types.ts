export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CommentsVisibility = 'PUBLIC' | 'MEMBERS_ONLY'
export type CommentModeration = 'PRE' | 'POST'


export type PuckData = { root: { props?: Record<string, any> }; content: any[]; zones?: Record<string, any> }

export type GazettePost = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  status: PostStatus
  publishedAt: Date | null
  scheduledFor: Date | null
  featuredImageId: string | null
  authorId: string | null
  importedAuthorName: string | null
  seoTitle: string | null
  seoDescription: string | null
  canonicalUrl: string | null
  builderData: PuckData | null
  isPinned: boolean
  isPrivate: boolean
  viewCount: number
  seriesId: string | null
  seriesOrder: number | null
  previewTokenHash: string | null
  previewTokenExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type GazettePostListItem = Omit<GazettePost, 'builderData'>

export type GazetteTag = {
  id: string
  name: string
  slug: string
  createdAt: Date
}

export type GazetteTagWithCount = GazetteTag & { postCount: number }

export type GazetteSeries = {
  id: string
  title: string
  slug: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export type GazetteAuthorProfile = {
  id: string
  userId: string
  bio: string | null
  avatarId: string | null
  createdAt: Date
  updatedAt: Date
}

export type GazetteComment = {
  id: string
  postId: string
  parentId: string | null
  authorName: string
  authorEmail: string
  authorUserId: string | null
  body: string
  status: CommentStatus
  ipAddress: string | null
  createdAt: Date
  updatedAt: Date
}

export type GazetteSettings = {
  id: string
  postsPerPage: number
  rssEnabled: boolean
  feedTitle: string | null
  feedDescription: string | null
  commentsEnabled: boolean
  commentsVisibility: CommentsVisibility
  commentModeration: CommentModeration
  commentsThreaded: boolean
  reactionsEnabled: boolean
  reactionSet: string[] | null
  showViewCounts: boolean
  updatedAt: Date
}

export type GazettePostTemplate = {
  id: string
  title: string
  builderData: PuckData | null
  createdAt: Date
  updatedAt: Date
}

export type GazetteAccess = {
  isEditor: boolean
  isAuthor: boolean
  isContributor: boolean
  isAdminUser: boolean
}
