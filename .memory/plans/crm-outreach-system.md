# Plan: CRM & Publisher Intelligence System for Create Studio Admin

## Context

We're doing daily email outreach to 5 user segments (41 emails/day, hand-sent). We need lightweight CRM functionality in the Create Studio Admin dashboard to:

1. Track outreach conversations with existing Create users (pulled from our DB)
2. Build a comprehensive publisher intelligence database from ad network sellers.json files
3. Auto-link scraped publishers to Create Studio users when domains match
4. Provide a daily queue to stay on target
5. Enable data-driven insights for targeted outreach and product strategy

The goal is NOT just to find competitor plugin users — it's to map the entire publisher landscape. Every publisher is a potential user for some part of Create (recipes, lists, how-tos, FAQs, affiliates). The more data we have, the more targeted and personalized our outreach can be.

## Data Model

### New Table: `Publishers`

Every publisher site discovered from sellers.json scraping. NOT just recipe sites — ALL publishers. This is our intelligence layer.

```ts
export const publishers = sqliteTable('Publishers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  domain: text('domain').notNull(),
  site_name: text('site_name'),           // From sellers.json "name" or scraped <title>

  // Contact info (scraped)
  contact_id: integer('contact_id').references(() => contacts.id), // FK to unified contact

  // Enrichment: publishing history
  site_category: text('site_category'),    // 'food' | 'diy' | 'travel' | 'lifestyle' | 'tech' | 'gaming' | etc.
  post_count: integer('post_count'),       // Total published posts (from X-WP-Total header)
  oldest_post_date: text('oldest_post_date'), // First post ever published
  newest_post_date: text('newest_post_date'), // Most recent post

  // Enrichment: content quality signals
  top_content: text('top_content', { mode: 'json' }).$type<TopContent[]>(),
  social_links: text('social_links', { mode: 'json' }).$type<Record<string, string>>(),

  // Ad network (from sellers.json source)
  ad_networks: text('ad_networks', { mode: 'json' }).$type<string[]>(), // Can be on multiple networks

  // WordPress info
  is_wordpress: integer('is_wordpress', { mode: 'boolean' }).default(false),
  wp_version: text('wp_version'),
  rest_api_available: integer('rest_api_available', { mode: 'boolean' }).default(false),

  // Create Studio linkage
  create_studio_site_id: integer('create_studio_site_id'), // FK to main app Sites table if matched

  // Scraping metadata
  last_scraped_at: text('last_scraped_at'),
  scrape_status: text('scrape_status'),    // 'pending' | 'scraped' | 'failed' | 'unreachable'
  scrape_error: text('scrape_error'),

  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  uniqueIndex('idx_publishers_domain').on(table.domain),
  index('idx_publishers_contact_id').on(table.contact_id),
  index('idx_publishers_site_category').on(table.site_category),
  index('idx_publishers_create_studio_site_id').on(table.create_studio_site_id),
  index('idx_publishers_scrape_status').on(table.scrape_status),
])

interface TopContent {
  title: string
  url: string
  comments?: number
  type?: string    // 'recipe' | 'how-to' | 'list' | 'post'
}
```

### New Table: `Contacts`

Unified contact records. Multiple publishers can share the same contact (one person owning multiple sites). This prevents emailing the same person for each of their 9 sites, and enables multi-site offers.

```ts
export const contacts = sqliteTable('Contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email'),
  name: text('name'),

  // Source tracking
  source: text('source').notNull(),        // 'scraped' | 'create_studio' | 'manual'
  create_studio_user_id: integer('create_studio_user_id'), // FK to main app Users table if matched

  // Aggregated insights (computed)
  site_count: integer('site_count').default(0),  // How many publishers they own

  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_contacts_email').on(table.email),
  index('idx_contacts_create_studio_user_id').on(table.create_studio_user_id),
])
```

### New Table: `Plugins`

Every WordPress plugin we discover across all publishers. This isn't just a lookup table — it's a market intelligence layer. Enriched with WordPress.org data (installs, ratings, pricing) to understand the competitive landscape and identify rollup opportunities.

```ts
export const plugins = sqliteTable('Plugins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  namespace: text('namespace').notNull(),   // REST API namespace: 'wp-recipe-maker', 'yoast', etc.
  slug: text('slug'),                       // WordPress.org slug (for API lookups)
  name: text('name').notNull(),             // Human-readable name

  // Classification
  category: text('category'),              // 'recipe' | 'seo' | 'forms' | 'ecommerce' | 'caching' | 'faq' | 'lists' | 'affiliate' | etc.
  primary_use: text('primary_use'),        // One-line description: "Recipe cards with schema markup"
  tags: text('tags', { mode: 'json' }).$type<string[]>(), // Freeform tags for flexible grouping: ['structured-data', 'schema', 'cards']

  // WordPress.org marketplace data (enriched via WP.org API)
  wp_org_installs: integer('wp_org_installs'),     // Active installs from WP.org
  wp_org_rating: real('wp_org_rating'),             // Average rating (0-5)
  wp_org_rating_count: integer('wp_org_rating_count'), // Number of ratings
  wp_org_last_updated: text('wp_org_last_updated'), // Last updated date on WP.org
  wp_org_tested_up_to: text('wp_org_tested_up_to'), // WordPress version tested up to
  wp_org_author: text('wp_org_author'),             // Plugin author/company

  // Pricing intelligence
  is_paid: integer('is_paid', { mode: 'boolean' }).default(false),
  pricing_model: text('pricing_model'),    // 'free' | 'freemium' | 'paid' | 'subscription'
  price_annual: real('price_annual'),      // Annual price for single site (if known)
  price_lifetime: real('price_lifetime'),  // Lifetime price (if known)

  // Competitive analysis
  is_competitor: integer('is_competitor', { mode: 'boolean' }).default(false),
  replaceable_by_create: integer('replaceable_by_create', { mode: 'boolean' }).default(false),
  create_feature_replacement: text('create_feature_replacement'), // Which Create feature replaces this: 'recipe-cards' | 'lists' | 'how-to' | 'faq' | 'affiliates' | null
  replacement_status: text('replacement_status'), // 'available' | 'planned' | 'future' | null — can we replace it now, or is it on the roadmap?

  // Publisher adoption (denormalized for quick queries)
  publisher_count: integer('publisher_count').default(0),       // How many publishers have this installed
  paid_publisher_count: integer('paid_publisher_count').default(0), // How many have the premium tier

  notes: text('notes'),
  last_enriched_at: text('last_enriched_at'), // When WP.org data was last fetched

  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  uniqueIndex('idx_plugins_namespace').on(table.namespace),
  index('idx_plugins_slug').on(table.slug),
  index('idx_plugins_category').on(table.category),
  index('idx_plugins_is_competitor').on(table.is_competitor),
  index('idx_plugins_replaceable').on(table.replaceable_by_create),
  index('idx_plugins_publisher_count').on(table.publisher_count),
  index('idx_plugins_create_feature').on(table.create_feature_replacement),
])
```

#### Plugin enrichment via WordPress.org API

The WordPress.org Plugin API is public and free:
```
GET https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&slug=wp-recipe-maker
```

Returns: name, version, active_installs, rating, num_ratings, last_updated, tested, author, short_description, tags, etc. We can run this enrichment in batch for all plugins with a known slug.

### New Table: `PublisherPlugins`

Many-to-many: which plugins each publisher has installed. This is where we detect paid plugin stacks, competing products, and replacement opportunities.

```ts
export const publisherPlugins = sqliteTable('PublisherPlugins', {
  publisher_id: integer('publisher_id').notNull().references(() => publishers.id, { onDelete: 'cascade' }),
  plugin_id: integer('plugin_id').notNull().references(() => plugins.id, { onDelete: 'cascade' }),
  tier: text('tier'),                      // 'free' | 'premium' (detected from route signatures)
  detected_at: text('detected_at'),
}, (table) => [
  primaryKey({ columns: [table.publisher_id, table.plugin_id] }),
  index('idx_pub_plugins_plugin_id').on(table.plugin_id),
  index('idx_pub_plugins_tier').on(table.tier),
])
```

### Updated Table: `Outreach`

The CRM layer — one record per contact we're reaching out to.

```ts
export const outreach = sqliteTable('Outreach', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contact_id: integer('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  segment: text('segment').notNull(),      // 'legacy' | 'current' | 'pro' | 'inactive' | 'wprm' | 'tasty' | 'non-recipe' | 'multi-site'
  status: text('status').notNull().default('queued'),
  stage: integer('stage').notNull().default(1), // 1=queued, 2=contacted, 3=responded, 4=engaged
  rating: integer('rating'),
  notes: text('notes'),
  email_count: integer('email_count').default(0),
  last_contacted_at: text('last_contacted_at'),
  last_responded_at: text('last_responded_at'),
  createdAt: text('createdAt'),
  updatedAt: text('updatedAt'),
}, (table) => [
  index('idx_outreach_contact_id').on(table.contact_id),
  index('idx_outreach_segment').on(table.segment),
  index('idx_outreach_status').on(table.status),
])
```

### Kept: `OutreachEmails`

Individual email records for the timeline. Same as before.

```ts
export const outreachEmails = sqliteTable('OutreachEmails', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  outreach_id: integer('outreach_id').notNull().references(() => outreach.id, { onDelete: 'cascade' }),
  direction: text('direction').notNull(),   // 'sent' | 'received' | 'note'
  subject: text('subject'),
  template_variant: text('template_variant'),
  summary: text('summary'),
  sent_at: text('sent_at').notNull(),
}, (table) => [
  index('idx_outreach_emails_outreach_id').on(table.outreach_id),
])
```

### Key Design Decisions

1. **Publishers, not Leads.** Every site is a publisher — not just a "lead." We track all of them regardless of what plugins they use. Non-recipe publishers are candidates for Lists, FAQs, and future features.

2. **Contacts are deduplicated.** Multiple Publishers can share one Contact (same person, multiple sites). The email address and contact page scraping identifies shared ownership. This prevents duplicate outreach and enables multi-site offers ("upgrade all your sites with a discount").

3. **Plugins are a market intelligence layer.** The Plugins table isn't just a lookup — it's enriched with WordPress.org marketplace data (installs, ratings, pricing) and competitive classification. Every plugin gets a `category`, `primary_use`, `pricing_model`, `create_feature_replacement`, and `replacement_status`. This lets us:
   - See who has multiple paid plugins → they spend money on tooling
   - See who has WPRM + Tasty → tried multiple, might switch again
   - See who has WPRM + Create → using both, which one is primary?
   - See who has paid SEO + paid forms → they invest in their stack
   - Flag plugins Create could replace now vs. what's planned vs. future
   - Quantify the TAM for a new feature: "2,400 publishers use Plugin X — if we build this, that's the addressable market"
   - Identify the highest-value rollup targets: plugins with high install counts, high prices, and adjacent functionality

4. **Create sites are NOT skipped.** A publisher with `mv-create` in their namespaces gets a Publisher record AND gets linked to their Create Studio Site via `create_studio_site_id`. This lets us see the full picture: what else are they running alongside Create?

5. **Publishing velocity is derivable.** With `post_count`, `oldest_post_date`, and `newest_post_date` we can compute:
   - Posts per year, posts per month
   - Whether they're still actively publishing or stale
   - Growth rate ("you've published 120 posts in the last year — imagine if...")

6. **Outreach connects to Contacts, not Publishers.** Since one person may own multiple sites, we email the Contact, not each Publisher. The Outreach record links to a Contact, and we can see all their Publishers in the detail view.

## Relationships Diagram

```
sellers.json → Publishers (one per domain)
                  ↓ many-to-one
               Contacts (one per person, deduped by email)
                  ↓ one-to-one
               Outreach (one per contact we're reaching out to)
                  ↓ one-to-many
               OutreachEmails (email timeline)

Publishers ←→ Plugins (many-to-many via PublisherPlugins)
Publishers → Create Studio Sites (optional, if they're a Create user)
Contacts → Create Studio Users (optional, if they're a Create user)
```

## Rollup Strategy

The long-term vision for Create is to become a **rollup plugin** — one tool that replaces several adjacent publisher plugins under a single experience. The Plugins table is how we identify what to build next and who to build it for.

### How it works

1. **Discover:** The scraper finds all plugins across 14K+ publishers. New namespaces auto-create Plugin records.
2. **Classify:** We enrich each plugin with WP.org data (installs, ratings, pricing) and manually tag its `category`, `primary_use`, and whether it's `replaceable_by_create`.
3. **Quantify:** For each plugin category, we can see: how many publishers use it, how many pay for it, what they pay, and what it does.
4. **Prioritize:** Build features that replace the most common paid plugins with the highest overlap in our publisher base.
5. **Target:** When we ship a new feature, we already know exactly which publishers to contact and what to say: "You're paying $X/year for Plugin Y — Create now does this, included in Pro."

### Create feature → plugin replacement mapping

| Create Feature | Status | Replaces | Example Plugins |
|----------------|--------|----------|-----------------|
| Recipe Cards | Available | Recipe card plugins | WPRM, WP Tasty, EasyRecipe, Flavor |
| Lists & Roundups | Available | List/roundup plugins | WP Jenga Lists, custom solutions |
| How-To Cards | Available | How-to/step plugins | Jenga Steps, HowTo schema plugins |
| FAQ Cards | Planned | FAQ/accordion plugins | Ultimate FAQ, Jenga FAQ, Easy Accordion |
| Affiliate Links | Future | Affiliate management | ThirstyAffiliates, Pretty Links, JENGA links |
| Nutrition Labels | Available | Nutrition plugins | Jenga Nutrition, standalone nutrition tools |
| Print Templates | Available | Print plugins | Print-friendly tools |
| Schema/JSON-LD | Available | Schema plugins | Schema Pro, WP Schema (partial overlap) |

The `replacement_status` field on the Plugins table tracks where we are: `'available'` (ship it now), `'planned'` (on the roadmap), or `'future'` (considering it). This lets us segment outreach by timing: "available" features get pitched today, "planned" features get teased.

### Example rollup pitch

> "You're currently paying for WPRM Premium ($79/yr), a FAQ plugin ($49/yr), and an affiliate link manager ($59/yr). That's $187/year for three plugins from three developers with three update cycles. Create Pro replaces all three for $99/year — recipes, FAQs, and affiliate management in one plugin, one interface, one support channel."

### Quantifying feature priorities

The Plugins table lets us query the addressable market for any new feature:

```sql
-- How many publishers use FAQ plugins, and how many pay for them?
SELECT
  p.name, p.wp_org_installs, p.price_annual, p.publisher_count, p.paid_publisher_count
FROM Plugins p
WHERE p.category = 'faq' AND p.publisher_count > 0
ORDER BY p.publisher_count DESC
```

This turns feature planning from "we think publishers want FAQs" into "847 publishers in our database use FAQ plugins, 312 pay for premium, averaging $49/year — that's $15K/year in addressable spend we could capture."

## Queryable Insights

With this schema, we can answer questions like:

### Outreach queries
| Question | Query |
|----------|-------|
| How many WPRM Premium users are on Mediavine? | Publishers × PublisherPlugins × Plugins WHERE namespace = 'wp-recipe-maker' AND tier = 'premium' AND ad_networks LIKE '%mediavine%' |
| Who has both WPRM and Tasty installed? | Publishers with 2+ entries in PublisherPlugins matching both namespaces |
| Who owns 3+ sites? | Contacts with site_count >= 3 |
| Who publishes 10+ posts/month and uses WPRM? | Publishers WHERE post_count / months_since(oldest_post_date) >= 10, joined to WPRM plugin |
| Which publishers have 3+ paid plugins? | Publishers with 3+ PublisherPlugins where tier = 'premium' or plugin.is_paid = true |
| Who has Create but not Pro? | Publishers with mv-create plugin, joined to Create Studio Sites/Subscriptions where tier != 'pro' |
| Food bloggers NOT using any recipe plugin? | Publishers WHERE site_category = 'food' AND no PublisherPlugins matching recipe category |
| Stale publishers (no new posts in 6 months)? | Publishers WHERE newest_post_date < 6 months ago |

### Product & rollup queries
| Question | Query |
|----------|-------|
| What's the TAM for FAQ cards? | Plugins WHERE category = 'faq' → SUM(publisher_count), SUM(paid_publisher_count × price_annual) |
| Which paid plugins have the most overlap with our publishers? | Plugins WHERE is_paid = true ORDER BY publisher_count DESC |
| Who pays for plugins Create already replaces? | PublisherPlugins × Plugins WHERE replaceable_by_create = true AND replacement_status = 'available' AND tier = 'premium' |
| What's the total annual spend on replaceable plugins per publisher? | Per publisher: SUM(plugin.price_annual) WHERE replaceable_by_create |
| Most common plugin stacks among food bloggers? | Publishers WHERE site_category = 'food' → GROUP BY plugin combination |
| Which plugin categories are publishers paying most for? | Plugins GROUP BY category, SUM(paid_publisher_count × price_annual) ORDER BY total DESC |
| What plugins do our Pro subscribers also use? | Publishers linked to Create Studio → their PublisherPlugins → tells us what Pro users also pay for |

## Changes

### 1. Add schema to admin database

**File:** `packages/admin/server/db/admin-schema.ts`

Add 6 new table definitions: Publishers, Contacts, Plugins, PublisherPlugins, Outreach, OutreachEmails.

### 2. Create migration

**File:** `packages/admin/server/db/migrations-admin/XXXX_create_publisher_intelligence.sql`

### 3. Add admin API routes

**New files in `packages/admin/server/api/admin/`:**

Publishers:
- `publishers/index.get.ts` — List with filters (category, ad_network, plugin, has_contact, is_wordpress, Create-linked)
- `publishers/[id].get.ts` — Single publisher with plugins, contact, Create Studio link
- `publishers/import.post.ts` — Bulk import from scraper JSON
- `publishers/reconcile.post.ts` — Match publishers to Create Studio sites by domain

Contacts:
- `contacts/index.get.ts` — List contacts with site counts, outreach status
- `contacts/[id].get.ts` — Single contact with all their publishers
- `contacts/merge.post.ts` — Merge duplicate contacts (same person, different emails)

Plugins:
- `plugins/index.get.ts` — List all discovered plugins with publisher counts, sortable by installs/publishers/price
- `plugins/[id].get.ts` — Single plugin with all publishers using it, tier breakdown
- `plugins/[id].patch.ts` — Update plugin metadata (name, category, pricing, competitive flags, replacement mapping)
- `plugins/enrich.post.ts` — Batch-enrich plugins from WordPress.org API (installs, ratings, last updated)
- `plugins/categories.get.ts` — Aggregate stats by category: publisher count, paid count, total addressable spend

Outreach:
- `outreach/index.get.ts` — List outreach records with segment/status filters
- `outreach/[id].get.ts` — Single outreach with contact, publishers, email timeline
- `outreach/[id].patch.ts` — Update status, stage, rating, notes
- `outreach/[id]/emails.post.ts` — Log a new email
- `outreach/daily-queue.get.ts` — Today's queue grouped by segment
- `outreach/stats.get.ts` — Aggregate stats

Insights:
- `insights/plugin-landscape.get.ts` — Plugin distribution across all publishers, grouped by category
- `insights/multi-site-owners.get.ts` — Contacts with multiple sites
- `insights/paid-plugin-stacks.get.ts` — Publishers with multiple paid plugins, total spend
- `insights/publishing-velocity.get.ts` — Posts/month analysis
- `insights/rollup-opportunities.get.ts` — Replaceable plugins ranked by addressable spend (publisher_count × price_annual)
- `insights/feature-tam.get.ts` — Total addressable market per Create feature (current + planned)

### 4. Add admin pages

- `outreach/index.vue` — Main CRM view (unchanged from previous plan)
- `publishers/index.vue` — Publisher intelligence table
- `publishers/[id].vue` — Publisher detail with plugin stack, content, contact
- `plugins/index.vue` — Plugin marketplace intelligence (all discovered plugins, sortable by installs/publishers/price, filterable by category/competitive status/replacement status, inline editing of classification fields)
- `plugins/[id].vue` — Plugin detail: WP.org stats, pricing, which publishers use it, tier breakdown, replacement mapping
- `insights/index.vue` — Dashboard with charts: plugin category landscape, rollup opportunity sizing, feature TAM, publishing velocity distribution

### 5. Sidebar navigation

```ts
{ section: 'CRM' },
{ name: 'Outreach', href: '/outreach', icon: UserGroupIcon },
{ name: 'Publishers', href: '/publishers', icon: GlobeAltIcon },
{ name: 'Insights', href: '/insights', icon: ChartBarSquareIcon },
```

### 6. Scraper pipeline

Standalone script (Python or Node) that:
1. Fetches sellers.json from all 4 networks
2. Deduplicates domains
3. Probes each domain's `/wp-json/` — records ALL namespaces, not just recipe ones
4. For each discovered namespace, upserts into Plugins table
5. Scrapes contact pages, deduplicates by email into Contacts
6. Enriches with post count, oldest/newest post, categories, top content
7. Outputs JSON for bulk import via admin API

### 7. Plugin enrichment pipeline

Separate job (can be triggered from admin or scheduled):
1. For each Plugin with a known `slug`, fetch from WordPress.org API: `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&slug={slug}`
2. Update: `wp_org_installs`, `wp_org_rating`, `wp_org_rating_count`, `wp_org_last_updated`, `wp_org_tested_up_to`, `wp_org_author`
3. Manual classification step in admin UI: set `category`, `primary_use`, `tags`, `pricing_model`, `price_annual`, `is_competitor`, `replaceable_by_create`, `create_feature_replacement`, `replacement_status`
4. Recompute denormalized counts: `publisher_count`, `paid_publisher_count`

### 7. Reconciliation jobs

- **Publisher → Create Studio Site:** Match by domain. Set `create_studio_site_id`.
- **Contact → Create Studio User:** Match by email. Set `create_studio_user_id`.
- **Contact dedup:** Group publishers by email → link to same Contact.
- **Plugin dedup:** When a new namespace is discovered, check if it already exists before inserting.

## Prototypes

- **CRM Admin UI:** `/Users/jm/Sites/wordpress/plugins/create/.memory/plans/crm-admin.prototype.html`
- **Scraping Pipeline Flow:** `/Users/jm/Sites/wordpress/plugins/create/.memory/plans/scraping-flow.prototype.html`
