# Create Studio

Create structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation and embeddable, interactive visual cards.

## Monorepo Structure

This project is organized as a monorepo with three packages:

- **@create-studio/shared** - Shared utilities, types, and storage (framework-agnostic)
- **@create-studio/widgets** - Standalone Vue 3 widget library with Custom Elements
- **@create-studio/app** - Nuxt.js application (main site)

## Setup

Install dependencies for all packages:

```bash
npm install
```

## Development

Start the development server on `http://localhost:3001`:

```bash
npm run dev
```

This runs the Nuxt app development server. The widgets are built separately and uploaded to blob storage.

### Building Widgets

To build the widgets package:

```bash
npm run build:widgets
```

The widget chunks will be built and automatically uploaded to the running dev server's blob storage.

### Package-Specific Development

```bash
# Build shared package
npm run build:shared

# Build widgets package
npm run build:widgets

# Build app package
npm run build:app

# Run tests for specific package
npm run test:shared
npm run test:widgets
npm run test:app
```

## Production

Build all packages for production:

```bash
npm run build
```

This builds packages in dependency order:
1. @create-studio/shared
2. @create-studio/widgets (includes upload to blob)
3. @create-studio/app

Preview production build:

```bash
npm run preview
```

## Testing

Run all tests:

```bash
npm test
```

Run tests for specific package:

```bash
npm run test:shared
npm run test:widgets
npm run test:app
```

## Widget Embedding

### For Sites Without Create Studio Embed

```js
var script = document.createElement('script');
script.src = 'https://create.mediavine.com/embed/main.js'; // Production
// script.src = 'http://localhost:3001/embed/main.js'; // Local development

script.onload = async function() {
    await window.CreateStudio.init({
        siteUrl: "YOUR_SITE_URL",
        debug: false,
        baseUrl: "https://create.mediavine.com" // Production
        // baseUrl: "http://localhost:3001" // Local development
    });
    const apps = await window.CreateStudio.mountInteractiveMode();
};
document.body.appendChild(script);
```

### Tiered Rendering

- **Free Tier**: Widgets render in iframe with Create Studio branding/ads
- **Pro Tier**: Widgets render in-DOM with `cs:` prefixed styles for publisher ads

## Deployment

See [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for Nuxt deployment details.

The project is configured for Cloudflare Pages deployment via NuxtHub.

## Documentation

- [CLAUDE.md](CLAUDE.md) - Development guidelines and project overview
- [MONOREPO_MIGRATION.md](MONOREPO_MIGRATION.md) - Monorepo migration guide
- [SUBSCRIPTION_IMPLEMENTATION.md](SUBSCRIPTION_IMPLEMENTATION.md) - Subscription system details
