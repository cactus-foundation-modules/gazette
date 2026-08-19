// Server-only: reads SITE_URL/VERCEL_URL. Used for canonicals, share links and
// anywhere else a post needs its absolute address.
export function siteUrl(): string {
  return process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}
