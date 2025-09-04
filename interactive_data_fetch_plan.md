## Implementation Plan for External Creation Data Fetching

Based on my analysis, I'll implement a system to fetch creation data from external WordPress sites and display it in the interactive mode. Here's the detailed plan:

### 1. **Enhanced API Route** (`/server/api/fetch-creation.post.ts`)
   - Accept `site_url`, `creation_id`, and `cache_bust` parameters
   - Check NuxtHub KV storage for cached data using key: `creation:${site_url}:${creation_id}`
   - **If `cache_bust=true`, skip cache and fetch fresh data**
   - If cached and not expired (24-hour TTL), return cached data
   - If not cached or cache busted, fetch from WordPress API
   - Transform the WordPress response to match the HowTo/Recipe format
   - Cache the transformed data in KV storage (even when cache_bust is used)
   - Return the transformed data

### 2. **Data Transformer Utility** (`/server/utils/creationTransformer.ts`)
   - Parse WordPress creation response
   - **Extract and process images from instructions:**
     - Find all `[mv_img id="XX"]` shortcodes in instructions
     - For each image ID, fetch from `{site_url}/wp-json/wp/v2/media/{id}`
     - Extract `source_url` from media response
     - Map images to corresponding steps
   - Convert HTML instructions to structured HowToStep array
   - Parse timers from instruction text (e.g., "bake for 30 minutes")
   - Map ingredients to recipeIngredient array
   - Handle nutrition data if available
   - Process product/equipment mappings
   - Clean HTML from description and instructions

### 3. **Update Interactive Page** (`/pages/creations/[id]/interactive/index.vue`)
   - Check for `site_url` query parameter
   - Optional: Check for `cache_bust` query parameter for development/testing
   - If site_url present, fetch data from API instead of local fixtures
   - Handle loading states while fetching external data
   - Fallback to local fixtures if no site_url provided
   - Pass both site_url and cache_bust to API

### 4. **Key Features**
   - **Caching**: 
     - 24-hour TTL for performance
     - `cache_bust` parameter to force fresh data fetch
     - Cache is always updated even when busting
   - **Image Processing**: 
     - Parse `[mv_img id="XX"]` shortcodes
     - Batch fetch media details from WordPress API
     - Cache image URLs with creation data
   - **Timer Detection**: Parse time mentions in instructions
   - **Error Handling**: Graceful fallbacks for missing data
   - **Type Safety**: Full TypeScript support with HowTo types

### 5. **Data Flow**
   1. User visits `/creations/1/interactive?site_url=http://localhost:8074&cache_bust=true`
   2. Page checks for site_url param and calls API with cache_bust flag
   3. API checks cache_bust parameter
   4. If cache_bust=true or not cached:
      - Fetches from `http://localhost:8074/wp-json/mv-create/v1/creations/1`
      - Parses instruction HTML for image shortcodes
      - Fetches each image from `http://localhost:8074/wp-json/wp/v2/media/{id}`
      - Transforms all data to HowTo format
   5. Stores/updates complete data in KV with 24-hour expiry
   6. Returns transformed data to page
   7. Page renders interactive mode with external data

### 6. **API Parameters**
   ```typescript
   {
     site_url: string;      // Required: WordPress site URL
     creation_id: number;   // Required: Creation ID
     cache_bust?: boolean;  // Optional: Force fresh fetch (default: false)
   }
   ```

### 7. **Files to Create/Modify**
   - **Update** `/server/api/fetch-creation.post.ts` - Add caching, transformation logic, and cache_bust parameter
   - **Create** `/server/utils/creationTransformer.ts` - Data transformation utilities
   - **Update** `/pages/creations/[id]/interactive/index.vue` - Add external data fetching

This approach provides a scalable solution for loading creation data from any WordPress site with the MV Create API, while maintaining performance through caching and properly handling all media assets. The cache_bust parameter ensures fresh data can be fetched when needed for testing or when content updates.