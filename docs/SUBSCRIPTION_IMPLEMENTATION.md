# Subscription System Implementation Summary

## Overview
A complete subscription management system has been implemented for Create Studio, integrating Stripe for payments and enabling site-based subscription tiers that control widget render modes.

## Key Features

### 1. Authentication & Password Management
- **Password Creation**: API-only users can set passwords to access web UI
- **Password Reset**: Secure token-based password reset flow via email
- **Login System**: Email/password authentication with JWT tokens
- **Auth Middleware**: Protected routes require authentication

### 2. Database Schema
New migrations created:
- `0003_create_subscriptions_table.sql` - Site-based subscriptions
- `0004_add_password_fields_to_users.sql` - Password management fields

### 3. Subscription Management
- **Site-Based**: Subscriptions linked to sites (not individual users)
- **Multiple Tiers**: Free, Premium, Inner Circle
- **Render Modes**:
  - Free tier: iframe rendering
  - Premium/Inner Circle: in-DOM rendering
- **Automatic Updates**: Stripe webhooks keep subscription status in sync

### 4. Stripe Integration
- **Checkout Sessions**: Create subscription purchases
- **Customer Portal**: Users can manage billing, cancel, update payment methods
- **Webhook Handling**: Automatic subscription status updates
- **Events Supported**:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## File Structure

### Database
```
server/database/migrations/
├── 0003_create_subscriptions_table.sql
└── 0004_add_password_fields_to_users.sql (adds password reset fields only)
```

**Important Note**: The migration reuses the existing `password` column from the Users table (which was previously unused) rather than creating a new `password_hash` column. Passwords are stored as bcrypt hashes in the existing `password` field.

### Server Utilities
```
server/utils/
├── auth.ts (enhanced with password functions)
├── database.ts (added SubscriptionRepository)
├── stripe.ts (NEW - Stripe operations)
└── mailer.ts (enhanced with password reset email)
```

### API Routes

#### Authentication
```
server/api/v2/auth/
├── request-password-reset.post.ts (Request password creation/reset email)
├── reset-password.post.ts (Create/reset password with token)
└── login.post.ts (Email/password login)
```

**Note**: We use a single flow for both initial password creation and password resets - both use the same token-based email flow.

#### Subscriptions
```
server/api/v2/subscriptions/
├── create-checkout-session.post.ts (Start Stripe checkout)
├── portal.post.ts (Open Stripe customer portal)
└── status/[siteId].get.ts (Get subscription status)
```

#### Webhooks
```
server/api/v2/webhooks/
└── stripe.post.ts (Handle Stripe events)
```

### Frontend Pages

#### Authentication
```
app/pages/auth/
├── login.vue (Login page)
├── reset-password/[token].vue (Create/reset password form)
└── request-reset.vue (Request password creation/reset email)
```

#### Settings
```
app/pages/settings/
└── site.vue (Site settings & subscription management)
```

### Email Templates
```
app/components/emails/
├── ConfirmEmail.vue (Email validation)
└── ResetPassword.vue (NEW - Password reset)
```

### Middleware
```
app/middleware/
└── auth.ts (Protected route middleware)
```

## Configuration

### Environment Variables
Add to `.env`:
```bash
# Stripe Configuration
NUXT_STRIPE_SECRET_KEY=sk_test_...
NUXT_STRIPE_WEBHOOK_SECRET=whsec_...
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Runtime Config
Added to `nuxt.config.ts`:
- `stripeSecretKey`
- `stripeWebhookSecret`
- `public.stripePublishableKey`

## User Flows

### 1. New User Creating Password for First Time
1. User creates account via API (existing flow)
2. User continues using API with JWT (no change)
3. When ready to subscribe:
   - Go to `/auth/request-reset` and enter email
   - Receive password creation email
   - Click link to `/auth/reset-password/{token}`
   - Create password
   - Redirected to login
   - Access `/settings/site` to subscribe

### 2. Subscription Purchase
1. User logs in to `/auth/login`
2. Navigates to `/settings/site`
3. Clicks "Upgrade to Premium"
4. Redirected to Stripe Checkout
5. Completes payment
6. Webhook updates subscription status
7. Widget render mode automatically switches to in-DOM

### 3. Subscription Management
1. User logs in
2. Goes to `/settings/site`
3. Clicks "Manage Billing"
4. Redirected to Stripe Customer Portal
5. Can update payment, cancel, view invoices

### 4. Password Reset
1. User clicks "Forgot Password" on login
2. Enters email at `/auth/request-reset`
3. Receives email with reset link (valid 1 hour)
4. Clicks link to `/auth/reset-password/{token}`
5. Sets new password
6. Redirected to login

## Widget Integration

The widget config endpoint (`/api/v2/site-config`) now includes:
```json
{
  "subscriptionTier": "free|premium|inner_circle",
  "renderMode": "iframe|in-dom",
  "features": {
    "inDomRendering": true|false,
    "customStyling": true|false,
    "analytics": true
  }
}
```

Widget behavior automatically adjusts based on subscription tier.

## Testing

### Unit Tests
- `tests/unit/auth-password.test.ts` - Password hashing and reset tokens

### Manual Testing Checklist
- [ ] Set password flow
- [ ] Login with email/password
- [ ] Password reset request
- [ ] Password reset with token
- [ ] Create checkout session
- [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Webhook subscription.created
- [ ] Webhook subscription.updated
- [ ] Webhook invoice.payment_succeeded
- [ ] Customer portal access
- [ ] Subscription cancellation
- [ ] Widget render mode switches based on tier

### Stripe Testing
```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local
stripe listen --forward-to http://localhost:3001/api/v2/webhooks/stripe

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_succeeded
```

## Security Considerations

1. **Password Requirements**: Minimum 8 characters (enforced client & server)
2. **Token Expiration**:
   - Password reset: 1 hour
   - Email validation: 24 hours
3. **Webhook Verification**: Stripe signature verification prevents spoofing
4. **JWT Auth**: All subscription endpoints require valid JWT
5. **Site Ownership**: Users can only manage subscriptions for their own sites
6. **Rate Limiting**: Consider adding to password reset endpoint

## Next Steps

### Immediate
1. Copy `.env.example` to `.env` and add Stripe keys
2. Get Stripe API keys from Stripe Dashboard
3. Set up Stripe webhook endpoint in Stripe Dashboard
4. Update `PREMIUM_PRICE_ID` in `/app/pages/settings/site.vue` with actual Stripe price ID
5. Update tier mapping in `/server/utils/stripe.ts` `determineTierFromPriceId()` with actual price IDs

### Future Enhancements
- Add user's sites list endpoint
- Add trial period support
- Add subscription usage analytics
- Add promo code support
- Add email notifications for subscription events
- Add grace period for failed payments
- Add team/multi-user support per site
- Add subscription downgrade handling

## Troubleshooting

### Webhooks Not Working
1. Check webhook secret matches Stripe Dashboard
2. Verify endpoint is publicly accessible (use ngrok for local dev)
3. Check Stripe Dashboard webhook logs for errors
4. Ensure raw body is being read correctly

### Login Issues
1. Check JWT secret is configured
2. Verify password was set (check DB)
3. Check browser localStorage for auth_token

### Subscription Not Updating
1. Check webhook was received (Stripe Dashboard)
2. Verify site_id is in subscription metadata
3. Check database Subscriptions table
4. Review server logs for errors

## Database Queries

Useful queries for debugging:

```sql
-- Check user's password (stored in existing password column)
SELECT id, email, password IS NOT NULL as has_password FROM Users WHERE email = 'user@example.com';

-- Check site's subscription
SELECT s.*, sub.* FROM Sites s
LEFT JOIN Subscriptions sub ON sub.site_id = s.id
WHERE s.url = 'example.com';

-- List all active subscriptions
SELECT * FROM Subscriptions WHERE status = 'active';

-- Check subscription tier
SELECT site_id, tier, status FROM Subscriptions;
```

## Support

For issues or questions:
- Check server logs: Look for errors in API routes
- Stripe Dashboard: View webhook delivery attempts
- Database: Query Subscriptions table directly
- Email: Verify Postmark is configured for password reset emails
