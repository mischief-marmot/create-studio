# Nuxt Studio - Self-Hosted CMS

This document explains how to use Nuxt Studio to manage content for the Create Studio website, including the News blog and Features documentation.

## What is Nuxt Studio?

Nuxt Studio is a visual content management system (CMS) for Nuxt Content v3. Unlike traditional CMS platforms, Studio is **self-hosted** and runs locally on your machine, providing a visual interface to create and edit markdown content files.

### Key Features

- 📝 **Visual Markdown Editor**: WYSIWYG editing with live preview
- 🎨 **Component Support**: Visual editing of MDC components (callouts, code blocks, etc.)
- 🖼️ **Media Management**: Upload and manage images directly
- 📱 **Responsive Preview**: See how content looks on different devices
- 🔄 **Git Integration**: Changes are saved as commits to your repository
- 🚀 **Real-time Updates**: See changes instantly in your dev server

## Self-Hosted vs. Cloud Studio

**Create Studio uses the self-hosted version**, which means:

- ✅ Runs locally on your machine
- ✅ No external service dependencies
- ✅ Complete control over your content
- ✅ Free to use
- ✅ Works with your existing git workflow

The cloud version (studio.nuxt.com) is a hosted service from Nuxt, but we've opted for self-hosted for better control and integration with our development workflow.

## Installation & Setup

### Prerequisites

- Node.js 18+ installed
- Git repository configured
- Nuxt dev server running

### Quick Start

1. **Start your Nuxt dev server** (in one terminal):
   ```bash
   npm run dev
   ```

2. **Start Nuxt Studio** (in another terminal):
   ```bash
   npm run studio
   ```

3. **Open Studio in your browser**:
   ```
   http://localhost:4000
   ```

That's it! Studio will automatically connect to your running Nuxt dev server.

## Content Collections

Create Studio has two content collections configured:

### 1. News Collection

**Location**: `packages/app/content/news/`
**Route**: `/news` and `/[slug]`
**Purpose**: Blog posts about Create Studio updates, features, and announcements

**Schema**:
```typescript
{
  _published: boolean     // Show/hide from public
  title: string          // Post title
  description: string    // Meta description
  date: string          // Publication date (YYYY-MM-DD)
  category?: string     // "Announcements", "Features", etc.
  image?: string        // Featured image URL
  author?: {
    name: string
    role?: string
    imageUrl?: string
  }
}
```

### 2. Features Collection

**Location**: `packages/app/content/features/`
**Route**: `/features` and `/features/[slug]`
**Purpose**: Documentation for Create Studio features

**Schema**:
```typescript
{
  _published: boolean      // Show/hide from public
  title: string           // Feature name
  description: string     // Short description
  icon?: string          // Emoji icon
  category?: string      // "User Experience", "Content", etc.
  image?: string         // Hero image URL
  videoUrl?: string      // Demo video URL
  lastUpdated?: string   // Last update date (YYYY-MM-DD)
}
```

## Using Nuxt Studio

### Creating New Content

1. Open Studio at `http://localhost:4000`
2. Navigate to the collection you want to add to (News or Features)
3. Click "New Document"
4. Fill in the frontmatter fields
5. Write your content using the visual editor
6. Click "Save" to commit changes to git

### Editing Existing Content

1. Open Studio
2. Browse to the document you want to edit
3. Make your changes
4. Studio auto-saves drafts locally
5. Click "Save" to commit

### Working with Components

Studio supports MDC (Markdown Components) syntax. Common components:

#### Callouts

```markdown
::callout{type="info"}
This is an info callout
::

::callout{type="warning"}
This is a warning
::

::callout{type="tip" title="Pro Tip"}
Custom title callouts
::
```

Types: `info`, `warning`, `tip`, `quote`, `danger`

#### Code Blocks

````markdown
```typescript
const example = "code block"
```
````

#### Images

```markdown
![Alt text](/path/to/image.jpg)
```

#### Links

```markdown
[Link text](https://example.com)
```

## Content Workflow

### Recommended Workflow

1. **Start dev server**: `npm run dev`
2. **Start Studio**: `npm run studio`
3. **Create/edit content** in Studio
4. **Preview changes** at `http://localhost:3001`
5. **Commit changes** (Studio does this automatically on save)
6. **Push to GitHub** when ready

### Publishing Content

Content is controlled by the `_published` frontmatter field:

- `_published: false` - Draft, not visible on site
- `_published: true` - Published, visible on site

To publish:
1. Edit the document in Studio
2. Set `_published: true`
3. Save (commits to git)
4. Push changes

### File Organization

```
packages/app/content/
├── news/
│   ├── hello.md
│   ├── feature-announcement.md
│   └── ...
└── features/
    ├── interactive-mode.md
    ├── servings-adjustment.md
    └── ...
```

Each markdown file becomes a route based on its filename:
- `news/hello.md` → `/hello`
- `features/interactive-mode.md` → `/features/interactive-mode`

## Frontmatter Reference

### Common Fields

All content types support:

```yaml
---
_published: true            # Required: Show on site?
title: "Your Title"         # Required: Document title
description: "Summary"      # Required: Meta description
---
```

### News-Specific Fields

```yaml
---
date: "2025-11-06"         # Required: Publication date
category: "Announcements"   # Optional: Category badge
image: "/img/hero.jpg"     # Optional: Featured image
author:                     # Optional: Author info
  name: "John Doe"
  role: "Developer"
  imageUrl: "/img/john.jpg"
---
```

### Features-Specific Fields

```yaml
---
icon: "🎯"                 # Optional: Emoji icon
category: "User Experience" # Optional: Category badge
image: "/img/feature.png"  # Optional: Hero image
videoUrl: "https://..."    # Optional: Demo video
lastUpdated: "2025-11-06"  # Optional: Last update date
---
```

## Markdown Content

After the frontmatter, write your content in markdown:

```markdown
---
title: "My Post"
---

# Heading 1

This is a paragraph with **bold** and *italic* text.

## Heading 2

- List item 1
- List item 2

[Link to something](https://example.com)

![Image alt text](/img/photo.jpg)
```

## Troubleshooting

### Studio won't connect

**Issue**: Studio shows "Cannot connect to Nuxt"

**Solutions**:
- Ensure `npm run dev` is running on port 3001
- Check that dev server is accessible at `http://localhost:3001`
- Restart both dev server and Studio

### Changes not appearing

**Issue**: Edits in Studio don't show on the site

**Solutions**:
- Check `_published: true` in frontmatter
- Refresh your browser (clear cache if needed)
- Check the dev server terminal for errors
- Verify the file is in the correct collection folder

### Studio not starting

**Issue**: `npm run studio` fails

**Solutions**:
- Ensure you're in the `packages/app` directory
- Check Node.js version (18+ required)
- Clear npm cache: `npm cache clean --force`
- Reinstall dependencies: `npm install`

### Git conflicts

**Issue**: Studio commits conflict with manual edits

**Solutions**:
- Pull latest changes before starting Studio
- Don't manually edit files while Studio is saving
- Use git to resolve conflicts if they occur

## Advanced Configuration

### Content Config

The content configuration is in `packages/app/content.config.ts`:

```typescript
import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    news: defineCollection({
      type: 'page',
      source: 'news/**',
      schema: z.object({
        // Schema definition
      }),
    }),
    features: defineCollection({
      type: 'page',
      source: 'features/**',
      schema: z.object({
        // Schema definition
      }),
    }),
  },
})
```

### Adding New Collections

To add a new collection:

1. Add to `content.config.ts`
2. Create content directory (`content/collection-name/`)
3. Create index page (`app/pages/collection-name/index.vue`)
4. Update catch-all route if needed (`app/pages/[...slug].vue`)

## Resources

- [Nuxt Content Documentation](https://content.nuxt.com)
- [Nuxt Studio Documentation](https://content.nuxt.com/docs/studio)
- [MDC Syntax Guide](https://content.nuxt.com/docs/guide/writing/mdc)
- [Content Collections](https://content.nuxt.com/docs/guide/content-collections)

## Support

If you encounter issues:

1. Check this documentation first
2. Review Nuxt Content docs
3. Ask in the team Slack/Discord
4. Open an issue on GitHub

---

*Last updated: 2025-11-06*
