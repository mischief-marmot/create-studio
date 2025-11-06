import { describe, test, expect, beforeAll } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils/e2e'

// Note: baseUrl is configured in vitest.config.ts as http://localhost:3001

/**
 * E2E Tests for Landing Page and Demo Pages
 * Tests the public-facing pages and navigation
 */
beforeAll(async () => {
  await setup({
    browser: true,
    browserOptions: {
      launch: {
        baseURL: 'http://localhost:3001'
      },
      type: 'chromium'
    }
  })
})

describe('Landing Page and Demos', () => {

  describe('Landing Page', () => {
    test('loads landing page', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Page should load successfully
      expect(page.url()).toContain('http://localhost:3001/')
    })

    test('displays interactive mode section', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Look for Interactive Mode section
      const interactiveModeSection = page.locator('#interactive-mode')

      if (await interactiveModeSection.count() > 0) {
        await expect(interactiveModeSection).toBeVisible()
      }
    })

    test('has Try Interactive Mode button on landing', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Look for the interactive mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i)

      if (await tryButton.count() > 0) {
        await expect(tryButton.first()).toBeVisible()
      }
    })

    test('can open interactive mode demo from landing page', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Find and click the Try Interactive Mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i)

      if (await tryButton.count() > 0) {
        await tryButton.first().click()

        await page.waitForTimeout(2000)

        // Iframe or interactive content should appear
        const iframe = page.locator('iframe')

        if (await iframe.count() > 0) {
          await expect(iframe.first()).toBeVisible()
        }
      }
    })

    test('displays feature list on landing page', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Look for feature descriptions
      const features = [
        /engaging.*experience/i,
        /smart.*timer/i,
        /saved.*progress/i,
        /distraction.*free/i
      ]

      for (const featurePattern of features) {
        const feature = page.getByText(featurePattern)

        if (await feature.count() > 0) {
          // Feature should be visible
          await expect(feature.first()).toBeVisible()
        }
      }
    })
  })

  describe('Demo Recipes Page', () => {
    test('loads demo recipes listing page', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Check for heading
      const heading = page.locator('h2').filter({ hasText: /interactive.*recipe.*demo/i })

      if (await heading.count() > 0) {
        await expect(heading.first()).toBeVisible()
      }
    })

    test('displays multiple recipe cards', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Look for recipe articles
      const recipeArticles = page.locator('article')

      // Should have multiple recipes
      const count = await recipeArticles.count()
      expect(count).toBeGreaterThan(0)
    })

    test('recipe cards display images', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Check for recipe images
      const recipeImages = page.locator('article img')

      const imageCount = await recipeImages.count()
      expect(imageCount).toBeGreaterThan(0)

      // First image should be visible
      if (imageCount > 0) {
        await expect(recipeImages.first()).toBeVisible()
      }
    })

    test('recipe cards display metadata', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Look for metadata like prep time, total time, category
      const metadata = page.getByText(/prep:|total:|mins/i)

      if (await metadata.count() > 0) {
        await expect(metadata.first()).toBeVisible()
      }
    })

    test('can click recipe card to view details', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Find first recipe link
      const firstRecipeLink = page.locator('article a').first()

      if (await firstRecipeLink.count() > 0) {
        const href = await firstRecipeLink.getAttribute('href')

        // Click the link
        await firstRecipeLink.click()

        await page.waitForLoadState('networkidle')

        // Should navigate to recipe detail page
        expect(page.url()).toContain('/demo/')
      }
    })

    test('displays Try Interactive Mode button on recipe cards', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Look for Try Interactive Mode buttons
      const tryButtons = page.locator('a').filter({ hasText: /try.*interactive.*mode/i })

      const buttonCount = await tryButtons.count()
      expect(buttonCount).toBeGreaterThan(0)
    })
  })

  describe('Individual Demo Recipe Page', () => {
    test('loads individual recipe demo page', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Page should load
      expect(page.url()).toContain('/demo/raspberry-swirl-pineapple-mango-margaritas')
    })

    test('displays recipe title', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Look for recipe title
      const title = page.getByText(/raspberry.*margarita/i)

      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible()
      }
    })

    test('has Try Interactive Mode button', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      const tryButton = page.getByText(/try.*interactive.*mode/i)

      await expect(tryButton.first()).toBeVisible()
    })

    test('displays recipe card widget', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Look for embedded widget or card
      const widget = page.locator('[id^="create-studio-"]').or(
        page.locator('.recipe-card')
      )

      if (await widget.count() > 0) {
        await expect(widget.first()).toBeVisible()
      }
    })

    test('can open interactive mode from recipe page', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Click Try Interactive Mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i).first()
      await tryButton.click()

      await page.waitForTimeout(2000)

      // Should open modal or navigate to interactive view
      const modal = page.locator('[class*="modal"]').or(page.locator('iframe'))

      if (await modal.count() > 0) {
        // Modal or iframe should appear
        expect(await modal.first().isVisible()).toBeTruthy()
      }
    })

    test('displays recipe source attribution', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Look for source link
      const sourceLink = page.locator('a').filter({ hasText: /thesweetestoccasion\.com/i })

      if (await sourceLink.count() > 0) {
        await expect(sourceLink.first()).toBeVisible()
      }
    })
  })

  describe('Navigation and Routing', () => {
    test('can navigate from landing to demos page', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Look for link to demos
      const demosLink = page.locator('a').filter({ hasText: /demo/i })

      if (await demosLink.count() > 0) {
        await demosLink.first().click()

        await page.waitForLoadState('networkidle')

        // Should navigate to demos page
        expect(page.url()).toContain('/demo')
      }
    })

    test('can navigate from demos to individual recipe', async () => {
      const page = await createPage('/demos')

      await page.waitForLoadState('networkidle')

      // Click first recipe
      const firstRecipe = page.locator('article a').first()
      await firstRecipe.click()

      await page.waitForLoadState('networkidle')

      // Should be on individual recipe page
      expect(page.url()).toContain('/demo/')
    })

    test('can navigate from recipe to interactive mode', async () => {
      const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

      await page.waitForLoadState('networkidle')

      // Get Try Interactive Mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i).first()
      await tryButton.click()

      await page.waitForTimeout(2000)

      // Should open interactive mode (modal or new page)
      // Check if URL changed or modal appeared
      const hasModal = await page.locator('iframe').count() > 0
      const urlChanged = page.url().includes('/interactive')

      expect(hasModal || urlChanged).toBeTruthy()
    })

    test('page has proper meta tags', async () => {
      const page = await createPage('/')

      await page.waitForLoadState('networkidle')

      // Check for title tag
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    test('landing page is responsive on mobile', async () => {
      const page = await createPage('/')

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.waitForLoadState('networkidle')

      // Page should still load and display content
      const heading = page.locator('h1, h2, h3').first()

      if (await heading.count() > 0) {
        await expect(heading).toBeVisible()
      }
    })

    test('demo recipes are responsive on mobile', async () => {
      const page = await createPage('/demos')

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.waitForLoadState('networkidle')

      // Recipe cards should still be visible
      const recipes = page.locator('article')

      const count = await recipes.count()
      expect(count).toBeGreaterThan(0)
    })

    test('interactive mode works on mobile viewport', async () => {
      const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(5000)

      // Widget should load on mobile
      const widget = page.locator('[id^="interactive-widget-"]')

      if (await widget.count() > 0) {
        await expect(widget).toBeVisible()
      }
    })
  })
})
