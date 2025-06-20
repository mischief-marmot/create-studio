# Recipe Card Generator - Project Development Plan

## Project Overview
A web application that allows publishers and bloggers to create structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards for their websites.

## Technical Stack
- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS v4, DaisyUI
- **Backend**: Supabase (Auth, Database, Realtime)
- **Edge Infrastructure**: NuxtHub, Cloudflare Workers, KV, R2, Queues
- **Deployment**: Cloudflare Pages via NuxtHub
- **Testing**: Vitest, Playwright

## Phase Tracking

### Phase 1: Foundation & Authentication (Week 1-2)
**Status**: 🔴 Not Started
**Priority**: Critical

#### Tasks:
- [ ] Install @nuxthub/core module
- [ ] Install @nuxtjs/supabase module
- [ ] Configure environment variables (.env)
- [ ] Set up Supabase project
- [ ] Create database schema:
  ```sql
  -- users table (extends Supabase auth.users)
  -- cards table (recipe/howto/faq storage)
  -- templates table (card templates)
  -- embeds table (generated embed tracking)
  ```
- [ ] Configure Row Level Security policies
- [ ] Set up Supabase CLI for migrations
- [ ] Create auth pages (login/register/forgot-password)
- [ ] Implement protected routes middleware
- [ ] Build user profile management
- [ ] Design landing page
- [ ] Implement landing page components

#### Deliverables:
- Working authentication system
- User registration and login flow
- Protected dashboard route
- Marketing landing page

---

### Phase 2: Core Card Builder (Week 3-4)
**Status**: 🔴 Not Started
**Priority**: Critical

#### Tasks:
- [ ] Define TypeScript interfaces for schemas:
  - [ ] Recipe (ingredients, instructions, nutrition)
  - [ ] HowTo (steps, tools, duration)
  - [ ] FAQPage (questions and answers)
  - [ ] Article/BlogPosting
- [ ] Create JSON-LD generator utilities
- [ ] Build form components:
  - [ ] Dynamic field arrays
  - [ ] Rich text editor integration
  - [ ] Image upload component
- [ ] Implement Cloudflare R2 for media storage
- [ ] Create real-time preview system
- [ ] Add theme customization options

#### Deliverables:
- Working card builder for all types
- JSON-LD generation and validation
- Live preview functionality
- Image/media upload system

---

### Phase 3: Storage & Management (Week 5-6)
**Status**: 🔴 Not Started
**Priority**: High

#### Tasks:
- [ ] Implement card CRUD operations
- [ ] Set up Cloudflare KV caching
- [ ] Create card versioning system
- [ ] Build dashboard UI:
  - [ ] Card list view
  - [ ] Search and filters
  - [ ] Bulk operations
- [ ] Add analytics tracking setup
- [ ] Create template system foundation

#### Deliverables:
- Full card management dashboard
- Caching layer implementation
- Version history for cards
- Basic template functionality

---

### Phase 4: Embed Generation & Distribution (Week 7-8)
**Status**: 🔴 Not Started
**Priority**: High

#### Tasks:
- [ ] Build HTML/CSS generator for embeds
- [ ] Create embed customization options
- [ ] Develop hydration script:
  - [ ] Rating components
  - [ ] Interactive timers
  - [ ] Step navigation
  - [ ] Checklist functionality
- [ ] Implement cross-origin communication
- [ ] Create embed tracking system
- [ ] Build embed preview tool

#### Deliverables:
- Embed generation system
- Interactive hydration script
- Embed customization UI
- Analytics tracking for embeds

---

### Phase 5: Advanced Features (Week 9-10)
**Status**: 🔴 Not Started
**Priority**: Medium

#### Tasks:
- [ ] Set up Cloudflare Queues
- [ ] Implement background jobs:
  - [ ] Image optimization
  - [ ] Batch embed generation
  - [ ] Analytics processing
- [ ] Build analytics dashboard
- [ ] Add team collaboration features
- [ ] Create sharing system
- [ ] Implement commenting

#### Deliverables:
- Queue system for background tasks
- Analytics dashboard
- Team collaboration features
- Performance optimizations

---

### Phase 6: Optimization & Launch (Week 11-12)
**Status**: 🔴 Not Started
**Priority**: Medium

#### Tasks:
- [ ] Performance audit and optimization
- [ ] Security audit
- [ ] Write comprehensive tests
- [ ] Create documentation
- [ ] Build API documentation
- [ ] Prepare example implementations
- [ ] Set up monitoring
- [ ] Launch preparation

#### Deliverables:
- Optimized application
- Complete test coverage
- Documentation site
- Production deployment

---

## Current Phase: None
## Next Steps: Begin Phase 1 - Foundation & Authentication

## Environment Setup Checklist
- [ ] Supabase account created
- [ ] Cloudflare account created
- [ ] NuxtHub account linked
- [ ] Environment variables configured
- [ ] Local development environment ready

## Key Decisions Pending
1. Rich text editor choice (TipTap, Quill, etc.)
2. Analytics service (Plausible, Umami, custom)
3. Queue implementation (Cloudflare Queues vs Supabase Edge Functions)
4. Pricing model and payment integration

## Resources & References
- [NuxtHub Documentation](https://hub.nuxt.com/)
- [Supabase Nuxt Module](https://supabase.nuxtjs.org/)
- [Schema.org Vocabulary](https://schema.org/)
- [Google Structured Data Guidelines](https://developers.google.com/search/docs/appearance/structured-data)

## Session Notes
*Add notes here about decisions made, blockers encountered, or important context for future sessions*

---

Last Updated: 2025-06-20
Current Status: Planning Phase Complete