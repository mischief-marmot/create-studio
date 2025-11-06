# Nuxt Studio Integration

This document explains how Nuxt Studio is integrated with Create Studio for managing the News blog.

## What is Nuxt Studio?

[Nuxt Studio](https://studio.nuxt.com) is a web-based CMS interface for managing Nuxt Content. It provides:

- **Visual Editor**: Edit markdown content with a live preview
- **GitHub Integration**: Content changes are committed directly to your repository
- **Media Management**: Upload and manage images
- **Collaborative Editing**: Multiple team members can manage content
- **Draft Management**: Create drafts before publishing

## Current Implementation

### Content Structure

The Create Studio News blog is already fully implemented:

**Content Collection** (`packages/app/content.config.ts`):
```typescript
news: defineCollection({
  type: 'page',
  source: 'news/**',
  schema: z.object({
    '_published': z.boolean().optional(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    category: z.string().optional(),
    image: z.string().optional(),
    author: z.object({
      name: z.string(),
      role: z.string().optional(),
      imageUrl: z.string().optional(),
    }).optional(),
  }),
})
```

**Blog Pages**:
- `/news` - List view of all published posts
- `/[slug]` - Individual post view with navigation

**Content Location**: `packages/app/content/news/*.md`

### Studio Configuration Files

**`.nuxtrc`** - Enables Nuxt Studio mode:
```
shamefully_use_new_studio=true
```

**`studio.config.ts`** - Configures Studio integration:
- Defines content sources (news collection)
- GitHub repository configuration
- Content directory mapping

## Setting Up Nuxt Studio

### 1. Enable Studio for Your Repository

1. Go to [studio.nuxt.com](https://studio.nuxt.com)
2. Sign in with your GitHub account
3. Click "Connect a Repository"
4. Select `mischief-marmot/create-studio`
5. Grant necessary permissions

### 2. Access the Studio Interface

Once connected, you can access Studio at:
```
https://studio.nuxt.com/mischief-marmot/create-studio
```

### 3. Managing Content

**Create a New Blog Post**:
1. Navigate to the News collection in Studio
2. Click "New Document"
3. Fill in the frontmatter fields:
   - `_published`: Set to `true` to make it visible
   - `title`: Post title
   - `description`: Post summary (for SEO)
   - `date`: Publication date (YYYY-MM-DD format)
   - `category`: Post category (e.g., "Announcements", "Features")
   - `image`: Featured image path (e.g., `/img/blog/my-image.jpg`)
   - `author`: Author information object
4. Write your content using Markdown
5. Preview changes in real-time
6. Save (commits to repository)

**Edit Existing Posts**:
1. Browse the News collection
2. Select a post to edit
3. Make changes
4. Save (creates a new commit)

### 4. Content Components

The blog supports custom components in Markdown:

**Callouts**:
```markdown
::callout{type="info"}
This is an info callout
::

::callout{type="warning"}
This is a warning callout
::

::callout{type="tip" title="Pro Tip"}
This is a tip with a custom title
::

::callout{type="quote"}
This is a quote/testimonial callout
::
```

**Images**:
```markdown
![Alt text](/img/path/to/image.jpg)
```

**Links**:
```markdown
[Link text](/path/to/page)
[External link](https://example.com)
```

## Local Development

### Running with Studio Mode

Start the development server:
```bash
cd packages/app
npm run dev
```

The presence of `.nuxtrc` automatically enables Studio mode, which adds Studio-specific routes and functionality.

### Testing Content Changes

1. Create or edit markdown files in `packages/app/content/news/`
2. Set `_published: true` in frontmatter to make posts visible
3. Visit `http://localhost:3001/news` to see the blog index
4. Click a post to view the individual post page

### Content Schema Validation

The content schema is enforced by Zod (defined in `content.config.ts`). Invalid content will show errors in the browser console during development.

## Deployment

### Cloudflare D1 Database

The content is indexed in a Cloudflare D1 database for fast queries:

```typescript
content: {
  database: {
    type: 'd1',
    bindingName: 'DB'
  }
}
```

### Building for Production

```bash
npm run build
```

This builds the content database and generates static pages for all published posts.

## Troubleshooting

### Studio Not Showing Content

1. Check that `.nuxtrc` exists in `packages/app/`
2. Verify `studio.config.ts` has correct GitHub repository settings
3. Ensure your GitHub account has access to the repository

### Content Not Appearing on Site

1. Check that `_published: true` in the post's frontmatter
2. Verify the markdown file is in `packages/app/content/news/`
3. Check that the file follows the schema defined in `content.config.ts`
4. Look for validation errors in browser console

### Changes Not Saving in Studio

1. Verify you have write permissions to the repository
2. Check that the branch configured in `studio.config.ts` exists
3. Look for error messages in Studio interface

## References

- [Nuxt Content Documentation](https://content.nuxt.com)
- [Nuxt Studio Documentation](https://studio.nuxt.com/docs)
- [Nuxt Content Schema](https://content.nuxt.com/docs/content-config#schema)
- [Markdown Syntax Guide](https://www.markdownguide.org/basic-syntax/)

## Example Blog Post Structure

```markdown
---
_published: true
title: 'Introducing New Features'
description: 'Learn about the latest features in Create Studio'
date: '2025-11-06'
category: 'Features'
image: '/img/blog/new-features.jpg'
author:
  name: 'JM'
  role: 'Owner & Developer'
  imageUrl: '/img/misc/jm.jpg'
---

# Main Heading

Your content here...

## Subheading

More content...

::callout{type="info"}
Important information for readers
::

![Feature Screenshot](/img/screenshots/feature.jpg)
```
