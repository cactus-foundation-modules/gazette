import { generateJSON } from '@tiptap/html'
import { proseExtensions } from '@/modules/gazette/lib/prose'
import type { PuckData } from '@/modules/gazette/lib/types'

// Everything imports as a single GazetteProse block for v1 - good enough for
// prose-heavy imported content; editors can split it into other body blocks
// afterwards if they want pull quotes / code blocks broken out.
export function htmlToBuilderData(html: string): PuckData {
   
  const json = generateJSON(html, proseExtensions as any)
  return {
    root: { props: {} },
    content: [
      { type: 'GazetteProse', props: { id: 'GazetteProse-' + crypto.randomUUID(), content: json } },
    ],
    zones: {},
  }
}
