import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
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
    }),
    legal: defineCollection({
      type: 'page',
      source: 'legal/**',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        lastUpdated: z.string(),
        type: z.enum(['privacy', 'cookies', 'terms']),
      }),
    }),
    features: defineCollection({
      type: 'page',
      source: 'features/**',
      schema: z.object({
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        image: z.string().optional(),
      }),
    }),
    releases: defineCollection({
      type: 'page',
      source: 'releases/**',
      schema: z.object({
        _published: z.boolean().optional(),
        title: z.string(),
        description: z.string(),
        version: z.string(),
        product: z.enum(['create-plugin', 'create-studio']),
        date: z.string(),
        ogImage: z.string().optional(),
        highlights: z.array(z.object({
          title: z.string(),
          description: z.string(),
          type: z.enum(['feature', 'enhancement', 'fix', 'breaking']),
        })).optional(),
        previousVersion: z.string().optional(),
      }),
    }),
  },
})
