import { makeBodyRscConfig } from '@/modules/gazette/components/puck/body/bodyRscConfig'
import { extractHeadings } from '@/modules/gazette/lib/toc'
import type { PuckData } from '@/modules/gazette/lib/types'
import { CactusRender } from '@/lib/puck/CactusRender'

export default function PostBody({ builderData }: { builderData: PuckData | null }) {
  if (!builderData) return null
  const headings = extractHeadings(builderData)
  const config = makeBodyRscConfig(headings)
   
  return <CactusRender config={config} data={builderData as any} />
}
