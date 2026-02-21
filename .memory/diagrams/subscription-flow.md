# Subscription Flow: Site Creation to Pro Upgrade

```mermaid
sequenceDiagram
    actor User as User / Browser
    participant Vue as Settings Page<br/>(Vue)
    participant API as Create Studio<br/>API
    participant DB as Database<br/>(D1 / Drizzle)
    participant Stripe as Stripe
    participant WP as WordPress Site<br/>(Plugin)

    %% ── Phase 1: Site Creation ──
    rect rgb(59, 130, 246, 0.08)
    note over User, WP: Phase 1 — Site Creation
    User ->> Vue: Enters site URL
    Vue ->> API: POST /api/v2/sites/add { url }
    API ->> API: normalizeSiteUrl()<br/>isValidWordPressSiteUrl()
    API ->> DB: findOrCreateCanonicalSite(url)<br/>INSERT Sites (canonical_site_id = NULL)
    DB -->> API: site record
    API ->> DB: createPending(userId, siteId, 'owner')<br/>INSERT SiteUsers (verified_at = NULL)
    DB -->> API: pending site_user
    API -->> Vue: { pending: true, instructions }
    Vue -->> User: Show verification code instructions
    end

    %% ── Phase 2: Site Verification ──
    rect rgb(16, 185, 129, 0.08)
    note over User, WP: Phase 2 — Site Verification
    User ->> WP: Installs plugin, copies verification code
    User ->> Vue: Enters verification code
    Vue ->> API: POST /api/v2/sites/:id/verify { code }
    API ->> WP: POST /wp-json/mv-create/v1/verify-site-code<br/>{ code, token, user_id }
    WP -->> API: { success: true, name, versions }
    API ->> DB: markVerified(userId, siteId)<br/>SET verified_at = NOW()
    API ->> DB: UPDATE Sites (name, wp_version, etc.)
    API -->> Vue: { success: true, verified_at }
    Vue -->> User: Site verified
    end

    %% ── Phase 3: Pro Upgrade Checkout ──
    rect rgb(245, 158, 11, 0.08)
    note over User, WP: Phase 3 — Pro Upgrade Checkout
    User ->> Vue: Clicks "Upgrade" button
    Vue -->> User: SubscriptionUpgradeModal<br/>(Monthly / Quarterly / Annual / Biennial)
    User ->> Vue: Selects plan & clicks upgrade
    Vue ->> API: POST /api/v2/subscriptions/<br/>create-checkout-session { siteId, priceId }
    API ->> API: Guards: auth, owner role,<br/>canonical site, site verified
    API ->> Stripe: stripe.checkout.sessions.create()<br/>metadata: { site_id, user_id }
    Stripe -->> API: { url: checkout_url }
    API -->> Vue: { url: checkout_url }
    Vue ->> Stripe: window.location.href = checkout_url
    User ->> Stripe: Completes payment on<br/>Stripe hosted checkout
    Stripe -->> User: Redirect to /admin/settings?success=true
    end

    %% ── Phase 4: Webhook Processing ──
    rect rgb(168, 85, 247, 0.08)
    note over User, WP: Phase 4 — Stripe Webhook Processing
    Stripe -) API: POST /api/v2/webhooks/stripe<br/>customer.subscription.created
    API ->> API: verifyWebhookSignature()<br/>constructEvent(payload, sig, secret)
    API ->> API: handleWebhookEvent()<br/>determineTierFromPriceId() → 'pro'
    API ->> DB: subscriptionRepo.create()<br/>tier='pro', status='active'<br/>stripe_customer_id, stripe_subscription_id
    DB -->> API: subscription record
    API -) WP: POST /wp-json/mv-create/v1/webhooks/studio<br/>RS256 signed, fire-and-forget<br/>{ type: 'subscription_change', tier: 'pro' }
    note right of WP: Plugin updates<br/>feature gates
    end

    %% ── Phase 5: Post-Upgrade Experience ──
    rect rgb(236, 72, 153, 0.08)
    note over User, WP: Phase 5 — Post-Upgrade Experience
    User ->> Vue: Settings page loads
    Vue ->> API: GET /api/v2/subscriptions/status/:siteId
    API ->> DB: getActiveTier(siteId)<br/>status ∈ {active, trialing} → tier
    DB -->> API: { tier: 'pro', status: 'active' }
    API -->> Vue: { subscription, tier: 'pro' }
    Vue ->> API: GET /api/v2/subscriptions/details/:siteId
    API ->> Stripe: stripe.subscriptions.retrieve()<br/>stripe.invoices.list()
    Stripe -->> API: plan, payment method, invoices
    API -->> Vue: { plan, paymentMethod, invoices }
    Vue -->> User: Pro features unlocked<br/>Billing details displayed
    end
```

## Summary

This diagram traces the complete lifecycle from a publisher adding their WordPress site to Create Studio through upgrading to the Pro ("Create Unlocked") subscription tier. The flow spans five phases: site creation with canonical site modeling, WordPress plugin verification as a billing prerequisite, Stripe Checkout session initiation with metadata linking, asynchronous webhook processing that updates both the local database and the WordPress site, and the post-upgrade settings experience.

## Key Details

### Participants

| Participant | Technology | Role |
|---|---|---|
| User / Browser | — | Publisher interacting with the app |
| Settings Page | Vue 3 / Nuxt 4 | `pages/admin/settings.vue` + `SubscriptionUpgradeModal.vue` |
| Create Studio API | Nitro (Nuxt server) | `server/api/v2/` route handlers + `server/utils/stripe.ts` |
| Database | Cloudflare D1 / Drizzle ORM | `Sites`, `SiteUsers`, `Subscriptions` tables |
| Stripe | Stripe API | Checkout Sessions, Subscriptions, Billing Portal, Webhooks |
| WordPress Site | WP REST API + Create Plugin | Verification endpoint + webhook receiver |

### Database Tables Involved

| Table | Key Fields | Phase |
|---|---|---|
| `Sites` | `id`, `url`, `canonical_site_id` (NULL = canonical) | 1, 2 |
| `SiteUsers` | `user_id`, `site_id`, `verified_at`, `role`, `user_token` | 1, 2 |
| `Subscriptions` | `site_id`, `tier`, `status`, `stripe_customer_id`, `stripe_subscription_id` | 4, 5 |

### Billing Plans

| Plan | Price | Savings |
|---|---|---|
| Monthly | $15/mo | — |
| Quarterly | $40/quarter | ~$20/yr |
| Annual | $150/yr (default) | $30/yr |
| Biennial | $275/2yr | Best value |

### Checkout Guards (Phase 3)

All four must pass before a Stripe Checkout session is created:

1. User must be authenticated (Clerk session)
2. User must have `owner` role on the site
3. Site must be a canonical site (`canonical_site_id = NULL`)
4. Site must be verified (`verified_at IS NOT NULL`)

### Tier Resolution Logic

- `determineTierFromPriceId()` — all Stripe price IDs map to `'pro'`
- `getActiveTier()` — returns the subscription tier only when `status` is `active` or `trialing`; otherwise returns `'free'`
- The `free-plus` tier exists in the schema but is only assignable via admin tools, not through Stripe

### WordPress Webhook Security

- Signed with RS256 private key
- `X-Studio-Signature` header contains base64-encoded signature
- `X-Studio-Timestamp` header for replay protection
- Public key available at `GET /api/v2/webhooks/public-key`
- Fire-and-forget: failures are logged but never block the Stripe webhook response
