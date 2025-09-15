# Create Studio

Create structured data cards for recipes, how-to guides, and FAQs with automatic JSON-LD generation and embeddable, interactive visual cards. 

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.


# Embed script on site without Create Studio embed
```js
var script = document.createElement('script');
script.src = 'http://localhost:3001/embed/create-studio.iife.js'; // change for running on production/preview

script.onload = async function() {
    await window.CreateStudio.init({
        siteUrl: "SITE_URL",
        debug: true,
        baseUrl: "http://localhost:3001"  // for local development
    });
    const apps = await window.CreateStudio.mountInteractiveMode();
};
document.body.appendChild(script);
```