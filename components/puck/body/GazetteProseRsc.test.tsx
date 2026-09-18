import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { makeGazetteProseRsc } from '@/modules/gazette/components/puck/body/GazetteProseRsc'

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
})
