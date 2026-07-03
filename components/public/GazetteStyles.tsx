// Scoped .gz-* rules for public gazette pages. Colours are tokens throughout -
// no hardcoded hex - so the module respects the site's light/dark theme.
export default function GazetteStyles() {
  return (
    <style>{`
      .gz-container { max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }
      .gz-wide { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem; }

      .gz-prose { line-height: 1.75; color: var(--color-text); font-size: 1.0625rem; }
      .gz-prose p { margin: 0 0 1.25rem; }
      .gz-prose h2 { font-size: 1.5rem; font-weight: 700; margin: 2rem 0 1rem; scroll-margin-top: 5rem; }
      .gz-prose h3 { font-size: 1.25rem; font-weight: 700; margin: 1.75rem 0 0.875rem; scroll-margin-top: 5rem; }
      .gz-prose h4 { font-size: 1.0625rem; font-weight: 700; margin: 1.5rem 0 0.75rem; }
      .gz-prose a { color: var(--color-primary); }
      .gz-prose blockquote { margin: 0 0 1.25rem; padding: 0.75rem 1.25rem; border-left: 3px solid var(--color-border); color: var(--color-text-muted); }
      .gz-prose ul, .gz-prose ol { margin: 0 0 1.25rem; padding-left: 1.5rem; }

      .gz-pullquote { margin: 2rem 0; padding: 1.25rem 1.5rem; border-left: 4px solid var(--color-primary); background: var(--color-bg-subtle); border-radius: 0 6px 6px 0; }
      .gz-pullquote blockquote { margin: 0; font-size: 1.25rem; font-style: italic; color: var(--color-text); line-height: 1.6; }
      .gz-pullquote figcaption { margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted); }

      .gz-code { margin: 1.5rem 0; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
      .gz-code-header { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.875rem; background: var(--color-bg-subtle); border-bottom: 1px solid var(--color-border); font-size: 0.75rem; }
      .gz-code-lang { color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.03em; }
      .gz-code-copy { background: none; border: 1px solid var(--color-border); border-radius: 4px; padding: 0.125rem 0.5rem; font-size: 0.75rem; cursor: pointer; color: var(--color-text-muted); }
      .gz-code-pre, .gz-code-highlighted pre { margin: 0; padding: 1rem; overflow-x: auto; font-size: 0.875rem; }
      .gz-code-highlighted pre {
        background: var(--gz-shiki-bg, var(--color-bg-subtle)) !important;
        color: var(--gz-shiki-fg, var(--color-text)) !important;
      }

      .gz-image { margin: 1.5rem 0; }
      .gz-image img { width: 100%; height: auto; border-radius: 8px; display: block; }
      .gz-image figcaption { margin-top: 0.5rem; font-size: 0.8125rem; color: var(--color-text-muted); text-align: center; }
      .gz-image-placeholder { padding: 3rem; text-align: center; color: var(--color-text-muted); background: var(--color-bg-subtle); border-radius: 8px; }

      .gz-divider { border: none; border-top: 1px solid var(--color-border); margin: 2rem 0; }

      .gz-post-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
      .gz-post-card { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: block; }
      .gz-post-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
      .gz-post-card-body { padding: 1rem; }
      .gz-post-card h3 { margin: 0 0 0.375rem; font-size: 1.125rem; }
      .gz-post-card p { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); }
      .gz-post-card-meta { display: flex; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted); }

      .gz-pagination { display: flex; gap: 0.5rem; justify-content: center; margin-top: 2rem; }
      .gz-pagination a, .gz-pagination span { padding: 0.375rem 0.75rem; border: 1px solid var(--color-border); border-radius: 6px; text-decoration: none; color: var(--color-text); font-size: 0.875rem; }

      .gz-toc { border-left: 2px solid var(--color-border); padding-left: 1rem; font-size: 0.875rem; }
      .gz-toc a { display: block; padding: 0.25rem 0; color: var(--color-text-muted); text-decoration: none; }
      .gz-toc a:hover { color: var(--color-primary); }

      .gz-share { display: flex; gap: 0.5rem; margin: 1.5rem 0; }
      .gz-share button, .gz-share a { padding: 0.375rem 0.875rem; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text); font-size: 0.8125rem; text-decoration: none; cursor: pointer; }

      .gz-reactions { display: flex; gap: 0.5rem; margin: 1.5rem 0; flex-wrap: wrap; }
      .gz-reaction-btn { border: 1px solid var(--color-border); border-radius: 999px; padding: 0.375rem 0.75rem; background: var(--color-bg); cursor: pointer; font-size: 0.875rem; }
      .gz-reaction-btn[data-active="true"] { border-color: var(--color-primary); background: var(--color-bg-subtle); }

      .gz-comments { margin-top: 2.5rem; }
      .gz-comment { padding: 1rem 0; border-bottom: 1px solid var(--color-border); }
      .gz-comment-meta { font-size: 0.8125rem; color: var(--color-text-muted); margin-bottom: 0.375rem; }
      .gz-comment-reply { margin-left: 1.5rem; }

      .gz-author-bio { display: flex; gap: 1rem; align-items: flex-start; margin: 2rem 0; padding: 1.25rem; border: 1px solid var(--color-border); border-radius: 8px; }
      .gz-author-bio img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }

      .gz-series-nav { margin: 2rem 0; padding: 1rem; border: 1px solid var(--color-border); border-radius: 8px; }
    `}</style>
  )
}
