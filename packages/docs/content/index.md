---
title: Getting Started
description: Welcome to Create Studio documentation
---

# Welcome to Create Studio

Learn how to build and deploy structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation.

## Quick Start

Create Studio is organized as a monorepo with three main packages:

- **@create-studio/shared** - Shared utilities, types, and storage (framework-agnostic)
- **@create-studio/widgets** - Standalone Vue 3 widget library with Custom Elements
- **@create-studio/app** - Nuxt.js application (main site)

### Installation

Get started by cloning the repository and installing dependencies:

```bash
git clone <repository-url>
cd create-studio
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

This will start the Nuxt app at `http://localhost:3001`.

::callout{type="note" title="Development Note"}
The docs site runs on port 3002. Use `npm run dev:docs` to start just the documentation site.
::

## Next Steps

Explore the documentation to learn more about:

- Project architecture and structure
- Building and customizing widgets
- Working with the API
- Deployment to Cloudflare
