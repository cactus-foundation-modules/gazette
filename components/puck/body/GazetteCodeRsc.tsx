import { createHighlighterCore, createCssVariablesTheme, type HighlighterCore } from 'shiki/core'
import { createOnigurumaEngine } from 'shiki/engine/oniguruma'
import CodeCopyButton from './CodeCopyButton'
import { escapeCode, type GazetteCodeProps } from './GazetteCode'

// The code block's published half: highlighted on the server, with token colours
// driven by CSS variables so one rendering serves both light and dark.
//
// Kept apart from GazetteCode.tsx because that file is reachable from the post
// editor, which is a client component - see the note at the top of it.
//
// Built from shiki's core rather than the `shiki` entry point. `codeToHtml` from
// the default bundle is one line shorter to write and brings the whole library
// with it: ~350 grammars, each its own lazily imported chunk the bundler still
// has to compile, for the nineteen languages this block actually offers. The
// nineteen pull 46 grammars once their embedded ones are counted (ruby alone
// carries 32 - haml, sql, javascript and the rest of what can appear inside a
// heredoc), which is still a small fraction of the bundle.

const cssVariablesTheme = createCssVariablesTheme({ name: 'cactus', variablePrefix: '--gz-shiki-' })

/**
 * One grammar per language GazetteCode offers, minus plaintext, which shiki
 * handles without one. Written out rather than derived from LANGUAGE_OPTIONS
 * because a dynamic `import('shiki/langs/' + name)` is exactly the barrel the
 * bundler cannot narrow - it would pull all ~350 back in, which is the thing
 * this file exists to avoid.
 */
const LANGS = [
  import('shiki/langs/bash.mjs'),
  import('shiki/langs/css.mjs'),
  import('shiki/langs/diff.mjs'),
  import('shiki/langs/go.mjs'),
  import('shiki/langs/html.mjs'),
  import('shiki/langs/javascript.mjs'),
  import('shiki/langs/json.mjs'),
  import('shiki/langs/jsx.mjs'),
  import('shiki/langs/markdown.mjs'),
  import('shiki/langs/php.mjs'),
  import('shiki/langs/python.mjs'),
  import('shiki/langs/ruby.mjs'),
  import('shiki/langs/rust.mjs'),
  import('shiki/langs/sql.mjs'),
  import('shiki/langs/swift.mjs'),
  import('shiki/langs/tsx.mjs'),
  import('shiki/langs/typescript.mjs'),
  import('shiki/langs/yaml.mjs'),
]

// Built once per server process, not once per code block. The default bundle's
// codeToHtml keeps its own singleton; a hand-built core highlighter does not, and
// loading 46 grammars and a wasm regex engine for every block on a post would be
// a good deal slower than the bundle it replaced.
let highlighter: Promise<HighlighterCore> | null = null
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= createHighlighterCore({
    themes: [cssVariablesTheme],
    langs: LANGS,
    engine: createOnigurumaEngine(import('shiki/wasm')),
  })
  return highlighter
}

export async function GazetteCodeRsc({ code = '', language = 'plaintext' }: GazetteCodeProps) {
  let html = ''
  try {
    const shiki = await getHighlighter()
    html = shiki.codeToHtml(code, { lang: language, theme: 'cactus' })
  } catch {
    // An unregistered language throws rather than falling back, and a post
    // written before a language was retired from the list is exactly when that
    // happens. Plain, escaped text beats an error page over a code block.
    html = `<pre class="gz-code-pre"><code>${escapeCode(code)}</code></pre>`
  }
  return (
    <figure className="gz-code">
      <div className="gz-code-header">
        <span className="gz-code-lang">{language}</span>
        <CodeCopyButton code={code} />
      </div>
      <div className="gz-code-highlighted" dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  )
}
