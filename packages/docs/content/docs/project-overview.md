---
title: Project Overview
description: Introduction to Create Studio
---

# Project Overview

Create Studio is a comprehensive platform for building structured data cards with automatic JSON-LD generation and embeddable, interactive widgets.

## Monorepo Structure

The project is organized as a monorepo with three main packages:

### @create-studio/shared

Framework-agnostic shared utilities, types, and storage layer.

**Key features:**
- TypeScript types for all data structures
- Storage adapters for different backends
- Utility functions used across packages

### @create-studio/widgets

Standalone Vue 3 widget library with Custom Elements.

**Key features:**
- Recipe cards
- How-to guides
- FAQ accordions
- JSON-LD generation
- Embeddable via Custom Elements

### @create-studio/app

Main Nuxt.js application for creating and managing content.

**Key features:**
- User authentication (Clerk)
- Content editor
- Preview system
- Subscription management (Stripe)
- API endpoints

## Technology Stack

- **Nuxt 4** - Vue.js meta-framework
- **TypeScript** - Type safety throughout
- **Tailwind CSS v4** - Utility-first CSS
- **DaisyUI** - Component library
- **Pinia** - State management
- **NuxtHub** - Cloudflare deployment
- **Vitest** - Testing framework

## Architecture Goals

1. **Separation of Concerns** - Widgets can be used standalone
2. **Type Safety** - Full TypeScript coverage
3. **Test-Driven Development** - Comprehensive test suite
4. **Modern Stack** - Latest versions of all tools
5. **Developer Experience** - Fast HMR, good DX

::callout{type="note" title="Next Steps"}
Continue to [Installation](/docs/installation) to set up your development environment.
::
