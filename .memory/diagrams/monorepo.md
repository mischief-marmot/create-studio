# Monorepo Architecture

```mermaid
graph TB
    subgraph monorepo["create-studio monorepo"]
        subgraph packages["packages/"]
            shared["@create-studio/shared<br/><i>TypeScript library</i><br/>Types, utils, lib"]
            app["@create-studio/app<br/><i>Nuxt 4 + NuxtHub</i><br/>Main SaaS platform"]
            widgets["@create-studio/widgets<br/><i>Vue 3 + Vite</i><br/>Embeddable card widgets"]
            admin["@create-studio/admin<br/><i>Nuxt 4 + NuxtHub</i><br/>Internal admin panel"]
            docs["@create-studio/docs<br/><i>Nuxt 4 + @nuxt/content</i><br/>Documentation site"]
        end
        workers["workers/<br/><i>Cloudflare Worker</i><br/>Proxy worker"]
    end

    subgraph external["External Repos"]
        plugin["wordpress/plugins/create<br/><i>PHP WordPress Plugin</i><br/>Recipe & how-to cards"]
        wpenv["wordpress/<br/><i>Docker + Worktrees</i><br/>Local WP dev environment"]
    end

    subgraph infra["Infrastructure"]
        cf_d1[("Cloudflare D1<br/>(SQLite)")]
        cf_r2[("Cloudflare R2<br/>(Storage)")]
        cf_workers["Cloudflare Workers"]
        stripe["Stripe<br/>Subscriptions"]
        clerk["Clerk<br/>Auth (app)"]
    end

    %% Package dependencies
    shared --> app
    shared --> widgets

    %% Deploy targets
    app -- "deploy" --> cf_workers
    app -- "D1 database" --> cf_d1
    admin -- "deploy" --> cf_workers
    admin -- "D1 database" --> cf_d1
    docs -- "deploy" --> cf_workers
    widgets -- "upload bundle" --> cf_r2
    workers -- "deploy" --> cf_workers

    %% External connections
    plugin -- "REST API<br/>(JWT + user token)" --> app
    wpenv -. "hosts" .-> plugin

    %% Service integrations
    app --> stripe
    app --> clerk
    admin --> stripe

    %% Widget delivery
    cf_r2 -- "serves widget JS" --> plugin

    %% Styles
    classDef nuxt fill:#00dc82,stroke:#333,color:#000
    classDef vue fill:#42b883,stroke:#333,color:#000
    classDef ts fill:#3178c6,stroke:#333,color:#fff
    classDef php fill:#777bb3,stroke:#333,color:#fff
    classDef infra fill:#f6921e,stroke:#333,color:#000
    classDef db fill:#336791,stroke:#333,color:#fff

    class app,admin,docs nuxt
    class widgets vue
    class shared ts
    class plugin php
    class cf_d1,cf_r2 db
    class cf_workers,stripe,clerk infra
```

## Package Summary

| Package | Framework | Deploy Target | Purpose |
|---------|-----------|---------------|---------|
| `@create-studio/shared` | TypeScript | npm (local) | Shared types, utils, lib code |
| `@create-studio/app` | Nuxt 4 + NuxtHub | Cloudflare Workers + D1 | Main SaaS platform (API + UI) |
| `@create-studio/widgets` | Vue 3 + Vite | Cloudflare R2 (CDN) | Embeddable interactive cards |
| `@create-studio/admin` | Nuxt 4 + NuxtHub | Cloudflare Workers + D1 | Internal admin panel |
| `@create-studio/docs` | Nuxt 4 + Content | Cloudflare Workers | Documentation site |

## External Repos

| Repo | Stack | Deploy Target | Purpose |
|------|-------|---------------|---------|
| `wordpress/plugins/create` | PHP / React / Preact | WordPress.org | WP plugin for recipe/how-to cards |
| `wordpress/` | Docker Compose | Local only | WP dev environment with worktrees |

## Key Data Flows

1. **Publisher creates card** &rarr; WP Plugin &rarr; REST API &rarr; `app` (Cloudflare D1)
2. **Card renders on site** &rarr; WP Plugin injects HTML &rarr; `widgets` JS loaded from R2/CDN
3. **Subscriptions** &rarr; `app` &harr; Stripe webhooks
4. **Auth** &rarr; `app` uses Clerk; WP Plugin uses JWT + per-user token verification flow
5. **Nutrition/scraper** &rarr; WP Plugin &rarr; `app` API endpoints
