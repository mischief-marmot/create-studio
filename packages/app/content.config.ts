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
    features: defineCollection({
      type: 'page',
      source: 'features/**',
      schema: z.object({
        '_published': z.boolean().optional(),
        title: z.string(),
        description: z.string(),
        icon: z.string().optional(),
        category: z.string().optional(),
        image: z.string().optional(),
        videoUrl: z.string().optional(),
        lastUpdated: z.string().optional(),
      }),
    }),
  },
})
