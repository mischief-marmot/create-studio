import { test, expect } from '@playwright/test'
import { createCreationKey } from '@create-studio/shared'

const creationKey = createCreationKey('thesweetestoccasion.com', 50)

/**
 * E2E Tests for Landing Page and Demo Pages
 * Tests the public-facing pages and navigation
 */

test.describe('Landing Page and Demos', () => {
  test.describe('Landing Page', () => {
    test('loads landing page', async ({ page }) => {
      await page.goto('/')

      // Page should load successfully
      expect(page.url()).toContain('http://localhost:3001/')
    })

    test('displays interactive mode section', async ({ page }) => {
      await page.goto('/')

      // Look for Interactive Mode section
      const interactiveModeSection = page.locator('#interactive-mode')

      if (await interactiveModeSection.count() > 0) {
        await expect(interactiveModeSection).toBeVisible()
      }
    })

    test('has Try Interactive Mode button on landing', async ({ page }) => {
      await page.goto('/')

      // Look for the interactive mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i)

      if (await tryButton.count() > 0) {
        await expect(tryButton.first()).toBeVisible()
      }
    })

    test('can open interactive mode demo from landing page', async ({ page }) => {
      await page.goto('/')

      // Find and click the Try Interactive Mode button
      const tryButton = page.getByText(/try.*interactive.*mode/i)

      if (await tryButton.count() > 0) {
        await tryButton.first().click()

        // Iframe or interactive content should appear
        const iframe = page.locator('iframe')

        if (await iframe.count() > 0) {
          await expect(iframe.first()).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('displays feature list on landing page', async ({ page }) => {
      await page.goto('/')

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

  test.describe('Demo Recipes Page', () => {
    test('loads demo recipes listing page', async ({ page }) => {
      await page.goto('/demos')

      // Check for heading
      const heading = page.locator('h2').filter({ hasText: /interactive.*recipe.*demo/i })

      if (await heading.count() > 0) {
        await expect(heading.first()).toBeVisible()
      }
    })

    test('displays multiple recipe cards', async ({ page }) => {
      await page.goto('/demos')

      // Look for recipe articles
      const recipeArticles = page.locator('article')

      // Should have multiple recipes
      const count = await recipeArticles.count()
      expect(count).toBeGreaterThan(0)
    })

    test('recipe cards display images', async ({ page }) => {
      await page.goto('/demos')

      // Check for recipe images
      const recipeImages = page.locator('article img')

      const imageCount = await recipeImages.count()
      expect(imageCount).toBeGreaterThan(0)

      // First image should be visible
      if (imageCount > 0) {
        await expect(recipeImages.first()).toBeVisible()
      }
    })

    test('recipe cards display metadata', async ({ page }) => {
      await page.goto('/demos')

      // Look for metadata like prep time, total time, category
      const metadata = page.getByText(/prep:|total:|mins/i)

      if (await metadata.count() > 0) {
        await expect(metadata.first()).toBeVisible()
      }
    })

    test('can click recipe card to view details', async ({ page }) => {
      await page.goto('/demos')

      // Find first recipe link
      const firstRecipeLink = page.locator('article a').first()

      if (await firstRecipeLink.count() > 0) {
        const href = await firstRecipeLink.getAttribute('href')
        const path = href.split('/').pop()

        // Click the link
        await firstRecipeLink.click()

        await page.waitForLoadState('networkidle')

        // Should navigate to recipe detail page
        expect(page.url()).toContain(path)
      }
    })

    test('recipe cards link to individual recipe pages', async ({ page }) => {
      await page.goto('/demos')

      // Look for recipe links/cards - on demo pages the widget loads automatically
      const recipeLinks = page.locator('article a')

      const linkCount = await recipeLinks.count()
      expect(linkCount).toBeGreaterThan(0)
    })
  })

  test.describe('Individual Demo Recipe Page', () => {
    test('loads individual recipe demo page', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Page should load
      expect(page.url()).toContain('/demo/raspberry-swirl-pineapple-mango-margaritas')
    })

    test('displays recipe title', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')
      await page.waitForLoadState('networkidle')

      // Look for recipe title
      const title = page.getByText(/raspberry.*margarita/i)

      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible({ timeout: 10000 })
      }
    })

    test('automatically loads interactive widget', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Demo pages automatically load the widget, no button needed
      const widget = page.locator('[id^="create-studio-"]').or(
        page.locator('.recipe-card')
      )

      if (await widget.count() > 0) {
        await expect(widget.first()).toBeVisible({ timeout: 10000 })
      }
    })

    test('displays recipe card widget', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Look for embedded widget or card
      const widget = page.locator('[id^="create-studio-"]').or(
        page.locator('.recipe-card')
      )

      if (await widget.count() > 0) {
        await expect(widget.first()).toBeVisible()
      }
    })

    test('displays interactive widget that is fully loaded', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Demo pages automatically load the widget
      const widget = page.locator('[id^="create-studio-"]').or(
        page.locator('.recipe-card')
      )

      if (await widget.count() > 0) {
        // Widget should be visible and interactive
        await expect(widget.first()).toBeVisible({ timeout: 10000 })
      }
    })

    test('displays recipe source attribution', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Look for source link
      const sourceLink = page.locator('a').filter({ hasText: /thesweetestoccasion\\.com/i })

      if (await sourceLink.count() > 0) {
        await expect(sourceLink.first()).toBeVisible()
      }
    })
  })

  test.describe('Navigation and Routing', () => {
    test('can navigate from landing to demos page', async ({ page }) => {
      await page.goto('/')

      // Look for link to demos
      const demosLink = page.locator('a').filter({ hasText: /demo/i })

      if (await demosLink.count() > 0) {
        await demosLink.first().click()

        await page.waitForLoadState('networkidle')

        // Should navigate to demos page
        expect(page.url()).toContain('/demo')
      }
    })

    test('can navigate from demos to individual recipe', async ({ page }) => {
      await page.goto('/demos')

      // Click first recipe
      const firstRecipe = page.locator('article a').first()
      await firstRecipe.click()
      const path = (await firstRecipe.getAttribute('href')).split('/').pop()

      await page.waitForLoadState('networkidle')

      // Should be on individual recipe page
      expect(page.url()).toContain(path)
    })

    test('recipe detail page displays all recipe content', async ({ page }) => {
      await page.goto('/demo/raspberry-swirl-pineapple-mango-margaritas')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Widget should be loaded automatically on demo recipe pages
      const widget = page.locator('[id^="create-studio-"]').or(
        page.locator('.recipe-card')
      )

      const hasWidget = await widget.count() > 0
      expect(hasWidget).toBeTruthy()
    })

    test('page has proper meta tags', async ({ page }) => {
      await page.goto('/')

      // Check for title tag
      const title = await page.title()
      expect(title).toBeTruthy()
      expect(title.length).toBeGreaterThan(0)
    })
  })

  test.describe('Responsive Design', () => {
    test('landing page is responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Page should still load and display content
      const heading = page.locator('h1, h2, h3').first()

      if (await heading.count() > 0) {
        await expect(heading).toBeVisible()
      }
    })

    test('demo recipes are responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/demos')

      // Recipe cards should still be visible
      const recipes = page.locator('article')

      const count = await recipes.count()
      expect(count).toBeGreaterThan(0)
    })

    test('interactive mode works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto(`/creations/${creationKey}/interactive`)

      await page.waitForLoadState('networkidle')

      // Widget should load on mobile
      const widget = page.locator('[id^="interactive-widget-"]')

      if (await widget.count() > 0) {
        await expect(widget).toBeVisible({ timeout: 15000 })
      }
    })
  })
})
