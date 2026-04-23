# Subscription Tiers Reference

> **Status:** Free+ tier is NOT YET LAUNCHED (coming soon, ad-supported).

## Pricing (Pro only)

| Interval   | Price       |
|------------|-------------|
| Monthly    | $15/month   |
| Quarterly  | $40/quarter |
| Annual     | $150/year   |
| Biennial   | $275/2 years|

## Feature Matrix

| Feature | Free | Free+ | Pro |
|---------|:----:|:-----:|:---:|
| JSON-LD Schema (rich results) | x | x | x |
| 5 Card styles | x | x | x |
| Recipe, How-To & List types | x | x | x |
| Nutrition Calculation (free API) | x | x | x |
| User Ratings & Reviews | x | x | x |
| Email support | x | x | x |
| Premium Themes (Editorial, Modern Elegant) | - | x | x |
| Interactive Mode | - | x (w/ Create ads) | x (own ads) |
| Servings Adjustment | - | x | x |
| Unit Conversion | - | x | x |
| Interactive Checklists | - | x | x |
| Review Responses & Management | - | x | x |
| Featured Reviews Block | - | x | x |
| Products in Lists | - | x | x |
| Bulk Import List Items | - | x | x |
| Custom CSS | - | x | x |
| Customize Interactive Mode settings | - | - | x |
| Priority support | - | - | x |
| **Render mode** | new-tab | new-tab | in-dom |

## Technical Reference

### Gatekeeper

WordPress plugin class: `lib/settings/class-gatekeeper.php`

**Gated feature keys:**
`theme_editorial`, `theme_modern`, `review_edit`, `review_respond`, `review_featured`, `featured_review_block`, `interactive_mode`, `servings_adjustment`, `checklists`, `unit_conversion`, `list_bulk_import`, `custom_css`

**Settings reset on downgrade:**
`products_display_mode`, `products_section_title`, `products_position`, `enable_checklists`, `enable_interactive_mode`, `interactive_mode_button_text`, `enable_unit_conversion`, `enable_servings_adjustment`, `custom_css`

### API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/v2/subscriptions/create-checkout-session` | Stripe checkout |
| `/api/v2/subscriptions/status/{siteId}` | Subscription status |

### Upgrade URL

```
{create_studio_base_url}/admin/upgrade?site_url={encoded_site_url}
```
