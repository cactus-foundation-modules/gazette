export type ParsedImportPost = {
  title: string
  slug: string | null
  excerpt: string | null
  bodyHtml: string
  tags: string[]
  authorEmail: string | null
  importedAuthorName: string | null
  publishedAt: Date | null
}

export type ImportPreviewRow = {
  title: string
  slug: string
  tags: string[]
  authorMatch: string
  action: 'Import' | 'Skip'
}

export type ImportResult = {
  imported: number
  skipped: number
  preview: ImportPreviewRow[]
}
