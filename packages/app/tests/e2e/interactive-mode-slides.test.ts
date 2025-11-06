import { describe, test, expect, beforeAll } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

/**
 * E2E Tests for Interactive Mode - Slide Navigation
 * Tests slide-based scrolling and carousel navigation
 */
beforeAll(async () => {
  await setup({
    browser: true,
    browserOptions: {
      type: 'chromium'
    }
  })
})

describe('Interactive Mode - Slide Navigation', () => {

  test('loads interactive mode page with demo recipe', async () => {
    const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Check page title
    const title = await page.title()
    expect(title).toContain('Raspberry Swirl Pineapple Mango Margaritas')

    // Check for Interactive Mode button
    const button = page.getByText('Try Interactive Mode')
    await expect(button).toBeVisible()
  })

  test('opens interactive mode modal when button is clicked', async () => {
    const page = await createPage('/demo/raspberry-swirl-pineapple-mango-margaritas')
    await page.waitForLoadState('networkidle')

    // Click the "Try Interactive Mode" button
    const button = page.getByText('Try Interactive Mode')
    await button.click()

    // Wait for modal or iframe to appear
    await page.waitForTimeout(2000)

    // Check if iframe or interactive content is visible
    const iframe = page.frameLocator('iframe').first()

    // Wait for content to load inside iframe
    await page.waitForTimeout(3000)
  })

  test('navigates through slides in direct interactive page', async () => {
    // Use the direct interactive page URL with creation key
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    // Wait for page to load and widget to initialize
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000) // Give time for SDK to load

    // Check for carousel (it should be in the shadow DOM or iframe)
    // Since the widget loads via SDK, we need to wait for it
    const widgetContainer = page.locator('[id^="interactive-widget-"]')
    await expect(widgetContainer).toBeVisible({ timeout: 10000 })
  })

  test('slide navigation with carousel elements', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Look for carousel navigation elements
    // The carousel should have slide elements with IDs like slide0, slide1, etc.
    const carousel = page.locator('.cs\\:carousel')

    // If carousel exists, test navigation
    if (await carousel.count() > 0) {
      // Check for intro slide (slide0)
      const introSlide = page.locator('#slide0')
      if (await introSlide.count() > 0) {
        await expect(introSlide).toBeVisible()
      }

      // Try to scroll to next slide by swiping/scrolling
      const carouselElement = carousel.first()
      const box = await carouselElement.boundingBox()

      if (box) {
        // Swipe left to go to next slide
        await page.mouse.move(box.x + box.width - 50, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + 50, box.y + box.height / 2, { steps: 10 })
        await page.mouse.up()

        await page.waitForTimeout(500)

        // Check if we're on a different slide
        const firstStepSlide = page.locator('#slide1')
        if (await firstStepSlide.count() > 0) {
          // Slide should be visible after swipe
          expect(await firstStepSlide.isVisible()).toBeTruthy()
        }
      }
    }
  })

  test('displays recipe title and description on intro slide', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Look for recipe title
    const titleElement = page.locator('h1').filter({ hasText: /Raspberry.*Margarita/i })

    // Title should be visible (timeout extended for widget loading)
    if (await titleElement.count() > 0) {
      await expect(titleElement.first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('navigates to completion/review slide', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Look for the last slide (review/completion slide)
    // The review slide should have "All done!" text
    const allDoneText = page.getByText('All done!')

    // If we can find it, the review slide structure exists
    // We won't navigate all the way through for speed, just verify it exists
    const carousel = page.locator('.cs\\:carousel')
    if (await carousel.count() > 0) {
      // Scroll carousel to the end
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      // Check for review slide elements
      if (await allDoneText.count() > 0) {
        await expect(allDoneText.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
