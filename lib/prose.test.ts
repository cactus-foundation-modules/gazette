import { describe, it, expect } from 'vitest'
import { extractProseText, renderProseHtml } from '@/modules/gazette/lib/prose'
import { normaliseProseContent } from '@/modules/gazette/lib/prose-normalise'
import { readingTimeMinutes } from '@/modules/gazette/lib/reading-time'
import type { PuckData } from '@/modules/gazette/lib/types'

const doc = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Fish & chips' }] },
  ],
}

describe('prose content shapes', () => {
  it('extracts the same text from JSON and from an HTML string', () => {
    expect(extractProseText(doc)).toBe('Title Fish & chips')
    expect(extractProseText('<h2>Title</h2><p>Fish &amp; chips</p>')).toBe('Title Fish & chips')
  })

  it('renders an HTML string as given, with heading ids injected', () => {
    expect(renderProseHtml('<h2>Title</h2><p>x</p>', ['title'])).toBe('<h2 id="title">Title</h2><p>x</p>')
  })

  it('counts reading time for string blocks', () => {
    const words = Array.from({ length: 500 }, () => 'word').join(' ')
    const data: PuckData = { root: { props: {} }, content: [{ type: 'GazetteProse', props: { id: 'a', content: `<p>${words}</p>` } }] }
    expect(readingTimeMinutes(data)).toBe(3)
  })

  it('normalises HTML-string prose to TipTap JSON on save, leaving JSON and other blocks alone', () => {
    const data: PuckData = {
      root: { props: {} },
      content: [
        { type: 'GazetteProse', props: { id: 'a', content: '<h2>Title</h2><p>Fish &amp; <strong>chips</strong></p>' } },
        { type: 'GazetteProse', props: { id: 'b', content: doc } },
        { type: 'GazettePullQuote', props: { id: 'c', quote: '<p>not prose</p>' } },
      ],
      zones: { 'x:slot': [{ type: 'GazetteProse', props: { id: 'd', content: '<p>Nested</p>' } }] },
    }
    const out = normaliseProseContent(data)
    const a = out.content[0].props.content
    expect(a.type).toBe('doc')
    expect(a.content[0]).toMatchObject({ type: 'heading', attrs: { level: 2 } })
    expect(extractProseText(a)).toBe('Title Fish & chips')
    expect(renderProseHtml(a)).toContain('<strong>chips</strong>')
    expect(out.content[1].props.content).toEqual(doc)
    expect(out.content[2].props.quote).toBe('<p>not prose</p>')
    expect(out.zones?.['x:slot'][0].props.content.type).toBe('doc')
    // Input is not mutated.
    expect(typeof data.content[0].props.content).toBe('string')
  })
})
