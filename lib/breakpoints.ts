import { getSiteConfig } from '@/lib/config/site'
import { resolveBreakpoints } from '@/lib/design/tokens'

// Resolve the site's responsive breakpoints (Styles > Spacing & Breakpoints)
// so gazette's article layout switches (e.g. the table-of-contents sidebar vs
// its collapsed mobile form) track the same widths as core Grid/Split blocks
// rather than a hardcoded pixel value. Media queries can't read CSS custom
// properties, so the resolved width is baked into the rule at render time.
export async function getGazetteBreakpoints() {
  const config = await getSiteConfig()
  return resolveBreakpoints(config?.designTokens)
}
