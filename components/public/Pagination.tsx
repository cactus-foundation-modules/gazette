import Link from 'next/link'

export default function Pagination({ page, totalPages, baseUrl }: { page: number; totalPages: number; baseUrl: string }) {
  if (totalPages <= 1) return null
  const sep = baseUrl.includes('?') ? '&' : '?'
  return (
    <nav className="gz-pagination" aria-label="Pagination">
      {page > 1 && <Link href={`${baseUrl}${sep}page=${page - 1}`}>Previous</Link>}
      <span>Page {page} of {totalPages}</span>
      {page < totalPages && <Link href={`${baseUrl}${sep}page=${page + 1}`}>Next</Link>}
    </nav>
  )
}
