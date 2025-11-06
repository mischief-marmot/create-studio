import { defineStudioConfig } from '@nuxt/studio-app/config'

export default defineStudioConfig({
  // Studio configuration for Create Studio News blog
  title: 'Create Studio',
  description: 'Manage Create Studio News blog content',

  // Configure which content collections are editable in Studio
  content: {
    sources: {
      news: {
        name: 'News & Updates',
        description: 'Blog posts about Create Studio features and updates',
        prefix: '/news'
      }
    }
  },

  // GitHub integration
  github: {
    owner: 'mischief-marmot',
    repo: 'create-studio',
    branch: 'main',
    dir: 'packages/app/content'
  }
})
