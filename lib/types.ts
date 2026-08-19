export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED'
export type CommentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type CommentsVisibility = 'PUBLIC' | 'MEMBERS_ONLY'
export type CommentModeration = 'PRE' | 'POST'
// Where a post lives: 'PREFIXED' = /gazette/<slug>, 'ROOT' = /<slug>.
export type PostUrlStyle = 'PREFIXED' | 'ROOT'


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

export type GazettePostSort = 'newest' | 'oldest' | 'views' | 'title'

// Everything a post card draws, flattened and JSON-safe: the same shape comes
// out of the server render and out of /api/m/gazette/public/posts, so the
// load-more list can append to a server-rendered grid without a second code path.
export type GazettePostCard = {
  id: string
  title: string
  slug: string
  // Built server-side from the site's post URL style, so a card appended by the
  // load-more list links to the same place a server-rendered one does.
  href: string
  excerpt: string | null
  date: string | null
  // Formatted server-side. The browser's timezone isn't the server's, so
  // letting the client format would hand a hydrating card a different day.
  dateLabel: string | null
  imageUrl: string | null
  authorName: string | null
  commentCount: number
  viewCount: number
}

export type PostCardDisplay = {
  showImage?: boolean
  showExcerpt?: boolean
  showAuthor?: boolean
  showDate?: boolean
  showComments?: boolean
  showViews?: boolean
}

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
  postUrlStyle: PostUrlStyle
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
