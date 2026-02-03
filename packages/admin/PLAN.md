# Admin Portal Implementation Plan

## Overview

Create an admin portal for Create Studio at `packages/admin/`. This Nuxt 4 app extends the main app as a layer, sharing components, composables, and server utils.

**Deployment:**
- Local: Port 3002 (`npm run dev:admin`)
- Production: admin.create.studio

**Design:** Professional admin UI with sidebar navigation, same DaisyUI themes as main app (light/dark)

## Core Features

1. **Dashboard** - Overview with user metrics (total, signups, active), revenue metrics (MRR, subscription counts by tier, churn), and site metrics (total sites, verifications)
2. **User Management** - List/search users, view/edit profiles, reset passwords, disable/enable accounts
3. **Subscription Management** - View all subscriptions, modify tiers (upgrade/downgrade/grant free pro), cancel subscriptions, link to Stripe dashboard
4. **Site Management** - View sites, their configs, associated users
5. **Audit Logs** - Track admin actions (who, what, when)

## Technical Requirements

- Internal staff only access (separate admins table)
- Full user management (CRUD + account actions)
- Full subscription control
- Comprehensive dashboard metrics
- Audit logging for accountability
- Nuxt layer architecture sharing code with main app

---

## Task List

### Phase 1: Foundation ✅ COMPLETE
- [x] **#1** Set up admin package structure (package.json, nuxt.config.ts, etc.)
- [x] **#2** Add admins table to database schema
- [x] **#3** Add audit_logs table to database schema
- [x] **#17** Update root package.json with admin scripts

### Phase 2: Core Infrastructure (IN PROGRESS)
- [ ] **#4** Create admin authentication system
  - POST /api/admin/auth/login - admin login endpoint
  - POST /api/admin/auth/logout - admin logout
  - GET /api/admin/auth/session - get current admin session
  - Admin session middleware to protect admin routes
  - useAdminAuth composable for client-side

- [ ] **#15** Create reusable admin components
  - AdminDataTable.vue - sortable, filterable table with pagination
  - AdminStatCard.vue - metric card with trend indicator
  - AdminModal.vue - confirmation/form modals
  - AdminSearchInput.vue - debounced search field
  - AdminFilterDropdown.vue - filter selector
  - AdminBadge.vue - status badges (tier, status, etc.)

- [ ] **#18** Create admin seeding script
  - scripts/seed-admin.ts
  - Prompts for email and password
  - Creates admin with super_admin role

### Phase 3: Layout & Auth UI
- [ ] **#5** Create admin layout with sidebar navigation
  - Fixed sidebar with navigation links
  - Admin branding (Create Studio Admin)
  - Navigation: Dashboard, Users, Subscriptions, Sites, Audit Logs
  - Admin profile dropdown with logout
  - Mobile responsive drawer
  - Theme toggle (light/dark)
  - Professional editorial aesthetic

- [ ] **#6** Build admin login page
  - Email and password form
  - Error handling for invalid credentials
  - Redirect to dashboard on success
  - Protected route middleware redirect

- [ ] **#16** Add admin API endpoints
  - /auth/* - login, logout, session
  - /dashboard/stats - aggregated metrics
  - /users/* - CRUD + actions (reset password, disable)
  - /subscriptions/* - CRUD + tier modifications
  - /sites/* - read + config updates
  - /audit-logs - read with filters
  - All endpoints must check admin session and log to audit_logs

### Phase 4: Main Pages
- [ ] **#7** Build dashboard page with metrics
  - User metrics: total users, new signups (7d/30d), active users
  - Revenue metrics: MRR, subscription counts by tier, churn rate
  - Site metrics: total sites, verified sites, pending verifications
  - Stat cards with trend indicators
  - Recent activity feed

- [ ] **#8** Build users management page
  - Data table with search, filter, sort, pagination
  - Columns: name, email, sites count, subscription tier, status, created
  - Filter by: email verified, has sites, subscription tier
  - Row actions: view, edit, reset password, disable/enable

- [ ] **#10** Build subscriptions management page
  - Data table with all subscriptions
  - Columns: site, user, tier, status, period end, Stripe link
  - Filter by: tier (free/pro), status (active/canceled/past_due)
  - Actions: view in Stripe, modify tier, cancel

- [ ] **#12** Build sites management page
  - Data table with all sites
  - Columns: name, URL, owner, users count, subscription, verified, created
  - Filter by: verified status, has subscription
  - Search by URL or name

- [ ] **#14** Build audit logs page
  - Chronological list of admin actions
  - Filter by: admin, action type, entity type, date range
  - Show: timestamp, admin name, action, entity, changes summary
  - Expandable rows to see full change details

### Phase 5: Detail Pages
- [ ] **#9** Build user detail/edit page
  - User profile info (editable)
  - Associated sites list
  - Subscription history
  - Audit log for this user
  - Actions: reset password, send verification email, disable account

- [ ] **#11** Build subscription detail/edit page
  - Full subscription details
  - Stripe customer/subscription links
  - Modify tier (upgrade/downgrade/grant free pro)
  - Cancel subscription with confirmation
  - Billing history from Stripe

- [ ] **#13** Build site detail page
  - Site info and configuration
  - Associated users with roles
  - Subscription details
  - Site settings (interactive mode, etc.)

---

## Dependencies

```
#4  → blocks → #5, #6, #16
#5  → blocks → #7, #8, #10, #12, #14
#15 → blocks → #7, #8, #10, #12, #14
#16 → blocks → #7, #8, #10, #12, #14
#8  → blocks → #9
#10 → blocks → #11
#12 → blocks → #13
#3  → blocks → #14
```

## Database Schema (Added)

**Admins table:**
- id, email (unique), password (hashed)
- firstname, lastname
- role (super_admin, admin)
- last_login, createdAt, updatedAt

**AuditLogs table:**
- id, admin_id (FK)
- action, entity_type, entity_id
- changes (JSON), ip_address, user_agent
- createdAt

## Commands

```bash
npm run dev:admin     # Start admin portal on port 3002
npm run build:admin   # Build admin package
npm run test:admin    # Run admin tests
npm run seed:admin    # Seed initial admin user (to be implemented)
```
