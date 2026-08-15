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
      /* A pinned column count from the page builder. One column on a phone
         whatever was picked - four 280px cards do not fit on a handset. */
      .gz-post-grid[data-cols] { grid-template-columns: 1fr; }
      @media (min-width: 640px) {
        .gz-post-grid[data-cols="2"], .gz-post-grid[data-cols="3"], .gz-post-grid[data-cols="4"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      }
      @media (min-width: 960px) {
        .gz-post-grid[data-cols="3"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .gz-post-grid[data-cols="4"] { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      }
      /* Card picture shape, picked per Entry List block. No attribute means the
         16:9 every card had before this was a choice. "As uploaded" is the one
         that stops cropping, so it drops object-fit's cover with the ratio. */
      .gz-post-grid[data-ratio="3-2"] .gz-post-card img { aspect-ratio: 3/2; }
      .gz-post-grid[data-ratio="4-3"] .gz-post-card img { aspect-ratio: 4/3; }
      .gz-post-grid[data-ratio="1-1"] .gz-post-card img { aspect-ratio: 1/1; }
      .gz-post-grid[data-ratio="auto"] .gz-post-card img { aspect-ratio: auto; height: auto; object-fit: fill; }

      /* Hover, also per block, and the same movement the shop's product cards
         make so a site running both reads as one thing. The transitions hang off
         the attribute rather than the card, so a listing left on "Nothing" has
         no transition to run. */
      .gz-post-grid[data-hover] .gz-post-card { transition: transform 0.25s ease, box-shadow 0.25s ease; }
      .gz-post-grid[data-hover] .gz-post-card img { transition: transform 0.4s ease; }
      .gz-post-grid[data-hover="lift"] .gz-post-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
      .gz-post-grid[data-hover="lift"] .gz-post-card:hover img { transform: scale(1.03); }
      .gz-post-grid[data-hover="grow"] .gz-post-card:hover { transform: scale(1.02); box-shadow: var(--shadow-lg); }
      @media (prefers-reduced-motion: reduce) {
        .gz-post-grid[data-hover] .gz-post-card,
        .gz-post-grid[data-hover] .gz-post-card img { transition: none; }
        .gz-post-grid[data-hover] .gz-post-card:hover,
        .gz-post-grid[data-hover] .gz-post-card:hover img { transform: none; }
      }

      .gz-load-more { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-top: 1.5rem; }
      .gz-load-more-btn { padding: 0.5rem 1.25rem; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg); color: var(--color-text); font-size: 0.875rem; cursor: pointer; }
      .gz-load-more-btn:hover:not(:disabled) { border-color: var(--color-primary); }
      .gz-load-more-btn:disabled { opacity: 0.6; cursor: default; }
      .gz-load-more-error { margin: 0; font-size: 0.8125rem; color: var(--color-text-muted); }
      .gz-post-card { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; text-decoration: none; color: inherit; display: block; }
      /* The card is one big link, so core's plain "a:hover { text-decoration:
         underline }" out-specificities the rule above and underlines the
         excerpt and byline as well as the title. Put the decoration back to
         none on the card itself (two classes beats a:hover) and hang the
         underline on the heading, which is the only part that reads as a link. */
      .gz-post-card:hover { text-decoration: none; }
      .gz-post-card:hover h3 { text-decoration: underline; }
      .gz-post-card img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
      .gz-post-card-body { padding: 1rem; }
      .gz-post-card h3 { margin: 0 0 0.375rem; font-size: 1.125rem; }
      .gz-post-card p { margin: 0; font-size: 0.875rem; color: var(--color-text-muted); }
      .gz-post-card-meta { display: flex; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--color-text-muted); }

      .gz-filter { margin: 0 0 1.5rem; }
      .gz-filter-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-text-muted); margin: 0 0 0.5rem; }
      .gz-filter-items { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 0.5rem; }
      .gz-filter-chip { display: inline-flex; align-items: center; gap: 0.375rem; padding: 0.3125rem 0.75rem; border: 1px solid var(--color-border); border-radius: 999px; background: var(--color-bg); color: var(--color-text); font-size: 0.8125rem; text-decoration: none; }
      /* Two classes beats core's plain "a:hover { text-decoration: underline }",
         which would otherwise underline every chip on hover. */
      .gz-filter-chip:hover { border-color: var(--color-primary); text-decoration: none; }
      .gz-filter-chip[data-active="true"] { border-color: var(--color-primary); background: var(--color-bg-subtle); font-weight: 600; }
      .gz-filter-count { color: var(--color-text-muted); font-size: 0.75rem; }
      .gz-filter-chip[data-active="true"] .gz-filter-count { color: var(--color-text); }
      .gz-filter-list .gz-filter-items { flex-direction: column; gap: 0.125rem; }
      .gz-filter-list .gz-filter-chip { border: none; border-radius: 0; padding: 0.25rem 0; background: none; justify-content: space-between; width: 100%; }
      .gz-filter-list .gz-filter-chip:hover { color: var(--color-primary); }
      .gz-filter-list .gz-filter-chip[data-active="true"] { background: none; color: var(--color-primary); }

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
