---
title: Project Overview
description: Introduction to Create Studio
---

# Project Overview

Create Studio is a comprehensive platform for publishers and bloggers to create structured data cards (recipes, how-to guides, FAQs) with automatic JSON-LD generation and embeddable, interactive visual cards.

## What is Create Studio?

Create Studio enables content creators to:
- Build rich, structured content cards for recipes, how-to guides, and FAQs
- Automatically generate JSON-LD structured data for better SEO
- Embed interactive widgets on any website
- Manage content with a user-friendly editor
- Track nutrition information for recipes with advanced ingredient parsing

## Monorepo Structure

The project is organized as a monorepo with four main packages:

### @create-studio/shared

Framework-agnostic shared utilities, types, and storage layer.

**Key features:**
- TypeScript types for all data structures
- Storage adapters for different backends
- Utility functions used across packages
- Common validation and parsing logic

### @create-studio/widgets

Standalone Vue 3 widget library with Custom Elements.

**Key features:**
- Recipe cards with nutrition display
- How-to guides with step-by-step instructions
- FAQ accordions for Q&A content
- JSON-LD structured data generation
- Embeddable via Custom Elements
- Tiered rendering (free with iframe, pro with in-DOM)

### @create-studio/app

Main Nuxt application for creating and managing content.

**Key features:**
- User authentication system
- Content creation and editing interface
- Real-time preview system
- Nutrition calculation API (API Ninjas integration)
- Subscription management
- Blob storage for widget assets
- API endpoints for data management

### @create-studio/docs

Documentation site built with Nuxt Content.

**Key features:**
- Project documentation
- API reference
- Migration guides
- Development guidelines

## Technology Stack

### Core Framework
- **Nuxt 3** (v3.17.3) - Vue.js meta-framework
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety throughout

### Styling
- **Tailwind CSS v4** - Utility-first CSS with `@tailwindcss/vite`
- **DaisyUI** - Component library with custom themes
  - "claudette" (light theme)
  - "claudia" (dark theme)

### State & Data
- **Pinia** - State management
- **Pinia Persisted State** - State persistence

### Infrastructure
- **NuxtHub** - Cloudflare deployment and services
- **Cloudflare Pages** - Hosting
- **Cloudflare Workers** - Serverless functions
- **Cloudflare KV** - Key-value storage
- **Cloudflare Blob** - File storage for widget assets

### Authentication & Payments
- **nuxt-auth-utils** - Authentication utilities
- **Stripe** - Payment processing and subscriptions

### External APIs
- **API Ninjas** - Nutrition data API
- **Postmark** - Transactional email

### Testing
- **Vitest** - Unit and integration testing
- **@nuxt/test-utils** - Nuxt-specific testing utilities

## Key Features

### Content Management
- Create and edit recipes with ingredients and instructions
- Build how-to guides with numbered steps
- Manage FAQ sections
- Real-time preview of content

### Nutrition Calculation
- Automatic ingredient parsing with quantity extraction
- Support for unicode fractions (½, ¼, etc.)
- Per-serving and total recipe nutrition
- Intelligent handling of unparseable ingredients

### Widget Embedding
- JavaScript embed code for any website
- Custom Elements for modern browsers
- Responsive design
- SEO-friendly JSON-LD structured data

### Subscription Tiers
- **Free Tier**: Widgets render in iframe with Create Studio branding
- **Pro Tier**: Widgets render in-DOM with publisher's own styling

## Architecture Goals

1. **Separation of Concerns** - Widgets can be embedded independently
2. **Type Safety** - Full TypeScript coverage across all packages
3. **Test-Driven Development** - Comprehensive test suite with Vitest
4. **Modern Stack** - Latest stable versions of all dependencies
5. **Developer Experience** - Fast HMR, clear documentation, good tooling
6. **Performance** - Optimized builds, lazy loading, edge deployment
7. **Scalability** - Cloudflare infrastructure for global distribution

::callout{type="note" title="Next Steps"}
Continue to [Installation](/docs/installation) to set up your development environment.
::