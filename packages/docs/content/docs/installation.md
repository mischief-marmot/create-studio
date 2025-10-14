---
title: Installation
description: Set up your development environment
---

# Installation

Get your development environment set up for Create Studio.

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher
- **Git**

## Clone the Repository

```bash
git clone <repository-url>
cd create-studio
```

## Install Dependencies

The project uses npm workspaces for monorepo management:

```bash
npm install
```

This will install dependencies for all packages in the monorepo.

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
# Clerk Authentication
NUXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
NUXT_CLERK_SECRET_KEY=your_secret_here

# Stripe
NUXT_STRIPE_SECRET_KEY=your_key_here
NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key_here

# Other services...
```

::callout{type="warning" title="API Keys Required"}
You'll need to sign up for Clerk and Stripe to get API keys for full functionality.
::

## Development Servers

Start the development server:

```bash
# Main app (runs on port 3001)
npm run dev

# Widgets package
npm run dev:widgets

# Documentation site (this site!)
npm run dev:docs
```

## Verify Installation

Visit `http://localhost:3001` to see the main app running. You should see the homepage with authentication options.

## Next Steps

- Read about [Test-Driven Development](/docs/test-driven-development)
- Explore the [Widgets Package](/docs/widgets-package)
- Learn about [State Management](/docs/state-management)
