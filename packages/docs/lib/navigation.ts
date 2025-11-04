export const navigation = [
  {
    title: 'Introduction',
    links: [
      { title: 'Getting Started', href: '/' },
      { title: 'Project Overview', href: '/docs/project-overview' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Monorepo Architecture', href: '/docs/monorepo-architecture' },
    ],
  },
  {
    title: 'Core Concepts',
    links: [
      { title: 'Architecture Overview', href: '/docs/architecture-overview' },
      { title: 'Shared Package', href: '/docs/shared-package' },
      { title: 'Widgets Package', href: '/docs/widgets-package' },
      { title: 'App Package', href: '/docs/app-package' },
      { title: 'Widget Embedding', href: '/docs/widget-embedding' },
      { title: 'Tiered Rendering', href: '/docs/tiered-rendering' },
    ],
  },
  {
    title: 'Development Guides',
    links: [
      { title: 'Development Setup', href: '/docs/development-setup' },
      { title: 'Test-Driven Development', href: '/docs/test-driven-development' },
      { title: 'Adding Features', href: '/docs/adding-features' },
      { title: 'Widget Development', href: '/docs/widget-development' },
      { title: 'API', href: '/docs/api' },
      { title: 'State Management', href: '/docs/state-management' },
    ],
  },
  {
    title: 'Advanced Topics',
    links: [
      { title: 'Migration Guide', href: '/docs/migration-guide' },
      { title: 'Service Worker Integration', href: '/docs/service-worker-integration' },
      { title: 'Push Notifications', href: '/docs/push-notifications' },
      { title: 'Subscription System', href: '/docs/subscription-system' },
      { title: 'Authentication', href: '/docs/authentication' },
      { title: 'Deployment', href: '/docs/deployment' },
      { title: 'Widget Storage', href: '/docs/widget-storage' },
    ],
  },
  {
    title: 'API Reference',
    links: [
      { title: 'Shared Package APIs', href: '/docs/shared-api' },
      { title: 'Widget APIs', href: '/docs/widget-api' },
      { title: 'Server APIs', href: '/docs/server-api' },
      { title: 'Composables', href: '/docs/composables' },
      { title: 'Types & Interfaces', href: '/docs/types' },
    ],
  },
  {
    title: 'Contributing',
    links: [
      { title: 'How to Contribute', href: '/docs/how-to-contribute' },
      { title: 'Code Style Guide', href: '/docs/code-style' },
      { title: 'Testing Guidelines', href: '/docs/testing-guidelines' },
      { title: 'Pull Request Process', href: '/docs/pull-request-process' },
    ],
  },
]

export interface NavigationLink {
  title: string
  href: string
}

export interface NavigationSection {
  title: string
  links: NavigationLink[]
}
