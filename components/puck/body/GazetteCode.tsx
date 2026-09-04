import CodeCopyButton from './CodeCopyButton'

// The code block's editor half, and the field definition both halves share.
//
// Nothing in this file may import shiki, and that is not a style preference.
// bodyEditorConfig imports this file, PostEditor imports bodyEditorConfig, and
// PostEditor is a client component - so anything reachable from here is compiled
// into the post editor's browser bundle. When the shiki import lived here it took
// the highlighter, its regex engine and every one of the ~350 grammars in the
// default bundle with it, all so an editor canvas could render a <pre> of plain
// text. The highlighting lives in GazetteCodeRsc.tsx, which only the server-side
// config reaches.

export type GazetteCodeProps = { code?: string; language?: string }

/**
 * The languages the block offers, and therefore the only grammars
 * GazetteCodeRsc has to load. Exported so the two cannot drift: adding a
 * language here without adding its grammar there would leave the block offering
 * something it cannot highlight.
 */
export const LANGUAGE_OPTIONS = [
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

/** Escaping for the markup GazetteCodeRsc falls back to when it cannot highlight,
 *  kept here so both halves of the block agree on it. */
export function escapeCode(code: string): string {
  return code.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
}

// Editor canvas: synchronous, plain text - avoids loading a highlighter on every
// keystroke in the builder.
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

export const gazetteCodeFieldDef = {
  label: 'Code',
  fields: {
    code: { type: 'textarea' as const, label: 'Code' },
    language: { type: 'select' as const, label: 'Language', options: LANGUAGE_OPTIONS },
  },
  defaultProps: { code: '', language: 'plaintext' },
  render: GazetteCode,
}
