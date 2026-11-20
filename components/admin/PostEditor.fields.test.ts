import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

// The post body carries core's Video block, whose aspect ratio, max width,
// alignment and padding fields are core's server-safe field stand-ins
// (lib/puck/fields/registry.tsx). They render nothing until an editor calls
// registerEditorFields(), so a post editor that forgets it shows empty rows in
// the sidebar - which is exactly how the Video block's settings went missing.
describe('Gazette post editor', () => {
  it('registers core field widgets at module scope', () => {
    const src = readFileSync(join(__dirname, 'PostEditor.tsx'), 'utf8')
    expect(src).toContain("import { registerEditorFields } from '@/lib/puck/fields/editor'")
    expect(src).toMatch(/^registerEditorFields\(\)$/m)
  })
})
