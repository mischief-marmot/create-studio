import type { Page } from '@playwright/test'
import mockRecipeData from '../fixtures/mock-recipe.json' with { type: 'json' }

/**
 * Mock WordPress API endpoints for testing
 *
 * This intercepts requests to /api/v2/fetch-creation (our proxy endpoint)
 * and returns the transformed HowTo data (including step array).
 *
 * NOTE: We mock /api/v2/fetch-creation instead of the WordPress API directly
 * because Playwright's browser-context mocking doesn't intercept server-side
 * HTTP requests made by our Nuxt server.
 */
export async function mockWordPressAPI(page: Page) {
  // Mock the app's fetch-creation API endpoint (used by widgets)
  await page.route('**/api/v2/fetch-creation', async (route) => {
    // Return transformed mock recipe data (with step array)
    // This simulates what the real endpoint returns after transformation
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify(mockRecipeData)
    })
  })

  // Mock the review API endpoint (already done in individual tests, but including for completeness)
  await page.route('**/wp-json/mv-create/v1/reviews**', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      let body: any = {}
      try {
        body = JSON.parse(request.postDataBuffer()?.toString() || '{}')
      } catch (e) {
        // If body parsing fails, continue anyway
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          id: Math.random().toString().slice(2),
          creation: body?.creation,
          rating: body?.rating,
          review_content: body?.review_content || null,
          review_title: body?.review_title || null,
          author_name: body?.author_name || null,
          author_email: body?.author_email || null,
          handshake: body?.handshake,
          created: Math.floor(Date.now() / 1000),
          modified: Math.floor(Date.now() / 1000)
        })
      })
    } else {
      await route.continue()
    }
  })
}

/**
 * Mock review API only (for tests that don't need full WordPress API mocking)
 */
export async function mockReviewAPI(page: Page) {
  await page.route('**/wp-json/mv-create/v1/reviews**', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      let body: any = {}
      try {
        body = JSON.parse(request.postDataBuffer()?.toString() || '{}')
      } catch (e) {
        // Continue anyway
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify({
          id: Math.random().toString().slice(2),
          creation: body?.creation,
          rating: body?.rating,
          review_content: body?.review_content || null,
          review_title: body?.review_title || null,
          author_name: body?.author_name || null,
          author_email: body?.author_email || null,
          handshake: body?.handshake,
          created: Math.floor(Date.now() / 1000),
          modified: Math.floor(Date.now() / 1000)
        })
      })
    } else {
      await route.continue()
    }
  })
}
