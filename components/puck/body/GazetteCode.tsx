import { codeToHtml, createCssVariablesTheme } from 'shiki'
import CodeCopyButton from './CodeCopyButton'

export type GazetteCodeProps = { code?: string; language?: string }

const LANGUAGE_OPTIONS = [
  { value: 'plaintext', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'go', label: 'Go' },
  { value: 'html', label: 'HTML' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'jsx', label: 'JSX' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'tsx', label: 'TSX' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'yaml', label: 'YAML' },
]

const cssVariablesTheme = createCssVariablesTheme({ name: 'cactus', variablePrefix: '--gz-shiki-' })

// Editor canvas: synchronous, plain text - avoids loading shiki's WASM highlighter
// on every keystroke in the builder.
export function GazetteCode({ code = '', language = 'plaintext' }: GazetteCodeProps) {
  return (
    <figure className="gz-code">
      <div className="gz-code-header">
        <span className="gz-code-lang">{language}</span>
        <CodeCopyButton code={code} />
      </div>
      <pre className="gz-code-pre"><code>{code}</code></pre>
    </figure>
  )
}

// RSC: server-highlighted with token colours driven by CSS variables (theme-aware,
// no light/dark duplication needed).
export async function GazetteCodeRsc({ code = '', language = 'plaintext' }: GazetteCodeProps) {
  let html = ''
  try {
    html = await codeToHtml(code, { lang: language, theme: cssVariablesTheme })
  } catch {
    html = `<pre class="gz-code-pre"><code>${code.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))}</code></pre>`
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

export const gazetteCodeFieldDef = {
  label: 'Code',
  fields: {
    code: { type: 'textarea' as const, label: 'Code' },
    language: { type: 'select' as const, label: 'Language', options: LANGUAGE_OPTIONS },
  },
  defaultProps: { code: '', language: 'plaintext' },
  render: GazetteCode,
}
