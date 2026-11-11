import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { makeGazetteProseRsc } from '@/modules/gazette/components/puck/body/GazetteProseRsc'
import { extractHeadings } from '@/modules/gazette/lib/toc'

describe('GazetteProseRsc', () => {
  it('renders headings and drops a javascript: link', () => {
    const Prose = makeGazetteProseRsc([])
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Go', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] },
      ],
    }
    const html = renderToStaticMarkup(<Prose id="p1" content={doc} />)
    expect(html).toContain('Title')
    expect(html).not.toMatch(/javascript:/i)
  })

  it('renders an HTML-string block (what the admin editor saves) with toc ids, sanitised', () => {
    const html = '<h2>Why bother</h2><p>Some <strong>bold</strong> words <a href="javascript:alert(1)">x</a></p><h3>Detail</h3>'
    const data = { root: { props: {} }, content: [{ type: 'GazetteProse', props: { id: 'p1', content: html } }] }
    const headings = extractHeadings(data)
    expect(headings.map((h) => [h.id, h.text, h.level])).toEqual([['why-bother', 'Why bother', 2], ['detail', 'Detail', 3]])
    const Prose = makeGazetteProseRsc(headings)
    const out = renderToStaticMarkup(<Prose id="p1" content={html} />)
    expect(out).toContain('<h2 id="why-bother">Why bother</h2>')
    expect(out).toContain('<h3 id="detail">Detail</h3>')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).not.toMatch(/javascript:/i)
  })
})
