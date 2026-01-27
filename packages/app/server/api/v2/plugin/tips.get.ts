/**
 * GET /api/v2/plugin/tips
 *
 * Returns the current tips and announcements feed for the Create plugin dashboard.
 * No authentication required — this is a public endpoint fetched server-to-server
 * by the WordPress plugin and cached via transient.
 *
 * Response format:
 * [
 *   {
 *     id: string           — Stable slug used for dismiss tracking (e.g. "2026-01-dark-mode")
 *     type: "tip" | "announcement" | "feature"
 *     title: string
 *     body: string
 *     url?: string         — Full external URL for "Learn more" link
 *     path?: string        — Relative admin path resolved by the plugin (e.g. "settings#appearance")
 *     published_at: string — ISO 8601
 *     expires_at?: string  — ISO 8601, plugin filters out expired items client-side
 *   }
 * ]
 *
 * Link resolution (handled by plugin):
 *   - `url`  — Used as-is (external link, opens in new tab)
 *   - `path` — Prepended with the site's WP admin URL to form an internal link
 *
 * Supported path shortcuts:
 *   - "settings"              → Create Settings page
 *   - "settings#appearance"   → Settings > Appearance tab
 *   - "settings#create-studio"→ Settings > Create Studio tab
 *   - "dashboard"             → Create Dashboard
 *   - "cards"                 → Cards collection
 */
export default defineEventHandler(() => {
  // TODO: Replace with database-backed admin UI.
  // For now, return a static list of tips and announcements.
  const tips = [
    {
      id: 'tip-structured-data',
      type: 'tip',
      title: 'Add structured data to every post',
      body: 'Embedding a Create card adds Recipe or HowTo schema automatically, helping your content appear in Google rich results.',
      url: 'https://help.create.studio/en/articles/8916609',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-list-cards',
      type: 'tip',
      title: 'Use List cards for roundups',
      body: 'List cards generate ItemList schema and link to your other content — great for roundup posts.',
      path: 'new-list',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-customize-colors',
      type: 'tip',
      title: 'Customize your card colors',
      body: 'Match your cards to your brand by setting primary and secondary colors in Settings.',
      path: 'settings#appearance',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-reviews',
      type: 'tip',
      title: 'Add reviews to boost engagement',
      body: 'Enable reviews on your cards to let readers rate your recipes. Higher engagement signals help with SEO.',
      path: 'settings#advanced',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-connect-studio',
      type: 'tip',
      title: 'Connect to Create Studio',
      body: 'Link your site to Create Studio for analytics, remote settings, and Pro features.',
      path: 'settings#create-studio',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-drag-dashboard',
      type: 'feature',
      title: 'Drag to reorder your dashboard',
      body: 'You can drag and drop dashboard widgets to arrange them however you like. Your layout is saved automatically.',
      path: 'dashboard',
      published_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'tip-keyboard-shortcuts',
      type: 'feature',
      title: 'Keyboard shortcuts available',
      body: 'Press ? on any Create page to see available keyboard shortcuts for faster editing.',
      path: 'dashboard',
      published_at: '2026-01-01T00:00:00Z',
    },
  ]

  return tips
})
