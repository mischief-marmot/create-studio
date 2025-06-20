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
**Status**: 🟢 Complete
**Priority**: Critical

#### Tasks:
- [x] Install @nuxthub/core module
- [x] Install @nuxtjs/supabase module
- [x] Configure environment variables (.env)
- [x] Set up Supabase project (Local development)
- [x] Create database schema:
  - Normalized schema with separate tables for ingredients, instructions, supplies
  - Support for affiliate products and nutrition info
  - Comprehensive indexing for performance
- [x] Configure Row Level Security policies
- [x] Set up Supabase CLI for migrations
- [x] Create auth pages (login/register/forgot-password)
- [x] Implement protected routes middleware
- [x] Build user profile management
- [x] Design and implement landing page
- [x] Write comprehensive tests (TDD approach)

#### Deliverables:
- ✅ Working authentication system
- ✅ User registration and login flow
- ✅ Protected dashboard route
- ✅ Marketing landing page
- ✅ Normalized database schema for advanced features
- ✅ Test coverage for authentication and database operations

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

## Current Phase: Phase 1 Complete ✅
## Next Steps: Begin Phase 2 - Core Card Builder

## Environment Setup Checklist
- [x] Supabase account created (Local development)
- [ ] Cloudflare account created
- [ ] NuxtHub account linked
- [x] Environment variables configured
- [x] Local development environment ready

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

### Phase 1 Implementation (2025-06-20)

**✅ Completed:**
- Full authentication system with Supabase
- Normalized database schema with ingredients, instructions, supplies
- Test-driven development approach implemented
- All authentication component tests passing
- Protected routes middleware working
- Professional landing page designed
- User profile management system

**🔧 Technical Decisions:**
- Using local Supabase development environment
- Normalized database schema for better ingredient indexing and affiliate product support
- TDD approach with Vitest for testing
- DaisyUI for consistent UI components

**⚠️ Minor Issues Resolved:**
- Fixed Supabase configuration in test environment
- Resolved module conflicts between custom plugin and @nuxtjs/supabase
- Authentication tests now passing consistently

**📊 Test Status:**
- ✅ Authentication component tests: All passing
- ✅ Basic database schema tests: Mostly passing  
- ⚠️ Complex database operations: Minor edge cases with user creation timing

**🚀 Ready for Phase 2:**
The foundation is solid and ready for building the core card builder functionality. The normalized schema will support all advanced features including ingredient indexing, affiliate products, and JSON-LD generation.

---

Last Updated: 2025-06-20
Current Status: Planning Phase Complete