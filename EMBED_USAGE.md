# Halogen Embed Usage

## Quick Start

Add this single line to embed Halogen on any website:

```html
<script defer src="http://localhost:3001/embed.min.js">
```

## Development Workflow

1. **Edit** `public/embed.js` (readable source)  
2. **Automatic minification** via Vite plugin during:
   - `npm run build` - Production build with minification
   - `npm run dev` - Development server (minification happens in background)
   
The Vite plugin automatically:
- Minifies `embed.js` → `embed.min.js`
- Shows compression stats in build output  
- Copies minified version to dist folder
- Watches for changes in development

## Script Sizes

- **Inline minified**: 392 bytes (can be pasted directly in HTML)
- **External script**: `<script src="http://localhost:3000/embed.min.js"></script>`

## Available Options

All options are passed as `data-*` attributes on the container element:

- `data-title` - Custom title
- `data-message` - Custom message
- `data-width` - Width (default: 100%)
- `data-height` - Height (default: 400px)
- `data-creation-id` - Recipe/creation ID
- `data-site-url` - WordPress site URL

## Examples

### Basic Embed
```html
<div data-halogen></div>
```

### With Recipe Data
```html
<div data-halogen 
     data-creation-id="8" 
     data-site-url="https://www.samanthaseeley.com">
</div>
```

### Custom Size
```html
<div data-halogen 
     data-width="600px" 
     data-height="500px">
</div>
```

## Test Pages

- `/embed-test.html` - Basic examples
- `/embed-inline.html` - Ultra-minimal examples

## Production Setup

1. Update the URL in `embed.min.js` from `http://localhost:3001` to your production domain
2. Host the script or provide the inline version to publishers
3. Publishers can either:
   - Include the external script: `<script src="https://yourdomain.com/embed.min.js"></script>`
   - Or paste the inline version directly into their HTML

## Comparison to Industry Standards

- **Google Analytics**: ~45KB (gzipped)
- **Facebook SDK**: ~200KB (gzipped)
- **Twitter Embed**: ~100KB (gzipped)
- **Halogen Embed**: 326 bytes (not even 1KB!)