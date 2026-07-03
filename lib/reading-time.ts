import type { PuckData } from './types'
import { extractProseText } from './prose'

const WORDS_PER_MINUTE = 230

export function readingTimeMinutes(builderData: PuckData | null): number {
  if (!builderData?.content) return 1
  let words = 0
  for (const block of builderData.content) {
    if (block?.type !== 'GazetteProse') continue
    const text = extractProseText(block.props?.content)
    if (text) words += text.split(/\s+/).filter(Boolean).length
  }
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE))
}
