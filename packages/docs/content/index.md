---
title: Getting Started
description: Welcome to Create Studio documentation
---

# Welcome to Create Studio

Create Studio is a powerful platform for publishers and bloggers to build structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation and embeddable, interactive visual cards.

## Quick Start

Create Studio is organized as a monorepo with four main packages:

- **@create-studio/app** - Nuxt application (main site)
- **@create-studio/widgets** - Standalone Vue 3 widget library with Custom Elements
- **@create-studio/shared** - Shared utilities, types, and storage (framework-agnostic)
- **@create-studio/docs** - Documentation site (you're here!)

### Installation

Get started by cloning the repository and installing dependencies:

```bash
# Clone the repository
gh repo clone mischiefmarmot/create-studio
cd create-studio

# Install all dependencies
npm install
```

### Development

Start the development server:

```bash
# Start the main application
npm run dev
npm run dev:docs # (optional) for documentation site development
npm run dev:widgets # (optional) for widget development
```

This will start the Nuxt app at `http://localhost:3001`.

::callout{type="note" title="Port Configuration"}
- **Main App**: Port 3001
- **Docs Site**: Port 3002 (`npm run dev:docs`)
- **Widgets**: Watches for changes in `packages/widgets` and uploads to Blob storage
::

### Building

Build the application for production:

```bash
npm run build
npm run build:docs # (optional) for documentation site production
npm run build:widgets # (optional) for widget production
```

This will generate static files in `packages/app/dist` and `packages/docs/dist`.
::

### Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run specific package tests
npm run test:app
npm run test:widgets
npm run test:shared

```

## Technology Highlights

- **Nuxt 4** - Modern Vue.js framework
- **TypeScript** - Full type safety
- **Tailwind CSS v4** - Latest utility-first CSS
- **Cloudflare** - Edge deployment
- **Vitest** - Fast unit testing

## Next Steps

Explore the documentation to learn more:

:::card-grid
::card{icon="📖" title="Project Overview" to="/docs/project-overview"}
Understand the architecture and components
::

::card{icon="🚀" title="Installation Guide" to="/docs/installation"}
Set up your development environment
::

::card{icon="🔌" title="API Reference" to="/docs/api"}
Integrate with our REST APIs
::

::card{icon="📦" title="Migration Guide" to="/docs/migration-guide"}
Upgrade from previous versions
::
:::

## Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: You're in the right place!
- **API Docs**: Check the [API Reference](/docs/api) for endpoint details

Ready to create amazing structured content? Let's get started! 🚀
