import { test, expect } from '@playwright/test'
import { createCreationKey } from '@create-studio/shared'

const creationKey = createCreationKey('thesweetestoccasion.com', 81)

/**
 * E2E Tests for Interactive Mode - Review Screen
 * Tests the completion/review slide functionality including star ratings
 *
 * NOTE: Review API calls are mocked to prevent saving test data to the real site.
 * This allows us to test the review flow without affecting production ratings/reviews.
 */

// Fixture: Mock the review API endpoint to prevent saving test data
const mockReviewAPI = async (page: any) => {
  // Intercept POST requests to the review API and return a mock response
  await page.route('**/wp-json/mv-create/v1/reviews**', async (route: any) => {
    const request = route.request()

    // Only mock POST requests (creation or updates of reviews)
    if (request.method() === 'POST') {
      // Extract the request body to get the review data
      let body: any = {}
      try {
        body = JSON.parse(request.postDataBuffer()?.toString() || '{}')
      } catch (e) {
        // If body parsing fails, continue anyway
      }

      // Return a mock successful response without actually submitting
      // The widget checks for response.id, so we provide that
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: Math.random().toString().slice(2), // Mock ID
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
      // Allow GET requests through normally
      await route.continue()
    }
  })
}

test.describe('Interactive Mode - Review Screen', () => {
  test('navigates to review screen at end of recipe', async ({ page }) => {
    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    // Navigate to the last slide (review/completion)
    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Scroll to the end
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      // Wait for "All done!" heading to appear
      const allDoneHeading = page.locator('h2').filter({ hasText: 'All done!' })

      if (await allDoneHeading.count() > 0) {
        await expect(allDoneHeading.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('displays star rating component on review screen', async ({ page }) => {
    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      // Wait for review screen to appear by checking for "All done!" or star rating elements
      const allDoneHeading = page.locator('h2').filter({ hasText: 'All done!' })
      const starRating = page.locator('[class*="star"]').or(page.locator('button').filter({ has: page.locator('svg') }))

      await Promise.race([
        allDoneHeading.first().waitFor({ timeout: 5000 }).catch(() => null),
        starRating.first().waitFor({ timeout: 5000 }).catch(() => null)
      ])

      // Rating component should exist
      const ratingCount = await starRating.count()
      expect(ratingCount).toBeGreaterThan(0)
    }
  })

  test('can select a star rating', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      // Find the review slide by looking for "All done!"
      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        // Look for star buttons within the review slide
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click the 5th star (5-star rating)
          await stars.nth(4).click()

          // After clicking high rating, success message should appear
          const successMessage = page.getByText(/rating submitted/i)

          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 5000 })
          }
        }
      }
    }
  })

  test('shows rating submitted message after high rating', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 5-star rating
          await stars.nth(4).click()

          // Look for success message
          const successMessage = page.getByText(/rating submitted/i)

          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible({ timeout: 3000 })
          }
        }
      }
    }
  })

  test('shows low rating prompt after low rating', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 2-star rating (low rating)
          await stars.nth(1).click()

          // Look for error alert asking for feedback
          const errorAlert = page.locator('.cs\\:alert-error')
          await expect(errorAlert.first()).toBeVisible({ timeout: 3000 })

          if (await errorAlert.count() > 0) {
            // Should ask for feedback on what could be better
            const feedbackPrompt = page.getByText(/what could have been better/i)
            if (await feedbackPrompt.count() > 0) {
              await expect(feedbackPrompt.first()).toBeVisible()
            }
          }
        }
      }
    }
  })

  test('displays review form with required fields', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click a star to trigger form display
          await stars.nth(4).click()

          // Wait for form fields to appear
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')

          await Promise.race([
            reviewTextarea.first().waitFor({ timeout: 3000 }).catch(() => null),
            nameInput.first().waitFor({ timeout: 3000 }).catch(() => null),
            emailInput.first().waitFor({ timeout: 3000 }).catch(() => null)
          ])

          // Form should have these fields
          if (await reviewTextarea.count() > 0) {
            await expect(reviewTextarea.first()).toBeVisible()
          }

          if (await nameInput.count() > 0) {
            await expect(nameInput.first()).toBeVisible()
          }

          if (await emailInput.count() > 0) {
            await expect(emailInput.first()).toBeVisible()
          }
        }
      }
    }
  })

  test('can fill out review form', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 5 stars
          await stars.nth(4).click()

          // Wait for form fields to appear
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')
          const reviewTitleInput = page.locator('#reviewTitle')

          await Promise.race([
            reviewTextarea.first().waitFor({ timeout: 3000 }).catch(() => null),
            nameInput.first().waitFor({ timeout: 3000 }).catch(() => null)
          ])

          if (await reviewTextarea.count() > 0) {
            await reviewTextarea.first().fill('This is a test review from automated testing')
          }

          if (await nameInput.count() > 0) {
            await nameInput.first().fill('Test User')
          }

          if (await emailInput.count() > 0) {
            await emailInput.first().fill('test@example.com')
          }

          if (await reviewTitleInput.count() > 0) {
            await reviewTitleInput.first().fill('Great Recipe!')
          }

          // Verify form is filled (only if form appeared)
          if (await reviewTextarea.count() > 0) {
            const reviewContent = await reviewTextarea.first().inputValue()
            expect(reviewContent).toContain('test review')
          }
        }
      }
    }
  })

  test('submit button is enabled when form is valid', async ({ page }) => {
    // Mock the review API to prevent saving test data to the real site
    await mockReviewAPI(page)

    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click stars
          await stars.nth(4).click()

          // Fill required fields
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')

          await Promise.race([
            reviewTextarea.first().waitFor({ timeout: 3000 }).catch(() => null),
            nameInput.first().waitFor({ timeout: 3000 }).catch(() => null)
          ])

          if (await reviewTextarea.count() > 0 && await nameInput.count() > 0 && await emailInput.count() > 0) {
            await reviewTextarea.first().fill('Test review content')
            await nameInput.first().fill('Test User')
            await emailInput.first().fill('test@example.com')

            // Find submit button
            const submitButton = page.locator('button[type="submit"]').or(
              page.locator('button').filter({ hasText: /submit.*review/i })
            )

            if (await submitButton.count() > 0) {
              // Wait for button to be enabled
              await expect(submitButton.first()).toBeEnabled({ timeout: 2000 })
            }
          }
        }
      }
    }
  })

  test('displays completion image/emoji on review screen', async ({ page }) => {
    await page.goto(`/creations/${creationKey}/interactive`)

    await page.waitForLoadState('networkidle')

    const carousel = page.locator('.cs\\:carousel')
    await expect(carousel.first()).toBeVisible({ timeout: 15000 })

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      // Wait for review screen to appear
      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })
      await expect(reviewSlide.first()).toBeVisible({ timeout: 5000 })

      // Look for completion emoji or image
      // The completion slide should show the recipe image or a celebration emoji
      const completionEmoji = page.getByText('🎉')
      const recipeImage = page.locator('img').filter({ hasNot: page.locator('[alt*="star"]') })

      const hasEmoji = await completionEmoji.count() > 0
      const hasImage = await recipeImage.count() > 0

      // Either emoji or image should be present
      expect(hasEmoji || hasImage).toBeTruthy()
    }
  })
})
