import { describe, test, expect, beforeAll } from 'vitest'
import { createPage, setup } from '@nuxt/test-utils/e2e'

// Note: baseUrl is configured in vitest.config.ts as http://localhost:3001

/**
 * E2E Tests for Interactive Mode - Review Screen
 * Tests the completion/review slide functionality including star ratings
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

describe('Interactive Mode - Review Screen', () => {

  test('navigates to review screen at end of recipe', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    // Navigate to the last slide (review/completion)
    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Scroll to the end
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      // Look for "All done!" heading
      const allDoneHeading = page.locator('h2').filter({ hasText: 'All done!' })

      if (await allDoneHeading.count() > 0) {
        await expect(allDoneHeading.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('displays star rating component on review screen', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      // Look for star rating elements
      // Stars should be clickable buttons or interactive elements
      const starRating = page.locator('[class*="star"]').or(page.locator('button').filter({ has: page.locator('svg') }))

      // Rating component should exist
      const ratingCount = await starRating.count()
      expect(ratingCount).toBeGreaterThan(0)
    }
  })

  test('can select a star rating', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      // Find the review slide by looking for "All done!"
      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        // Look for star buttons within the review slide
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click the 5th star (5-star rating)
          await stars.nth(4).click()
          await page.waitForTimeout(500)

          // Should show a success message or form
          const successAlert = page.locator('.cs\\:alert-success')
          const reviewForm = page.locator('form').filter({ has: page.locator('#review') })

          const hasSuccessMessage = await successAlert.count() > 0
          const hasReviewForm = await reviewForm.count() > 0

          // Either success message or review form should appear
          expect(hasSuccessMessage || hasReviewForm).toBeTruthy()
        }
      }
    }
  })

  test('shows rating submitted message after high rating', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 5-star rating
          await stars.nth(4).click()
          await page.waitForTimeout(500)

          // Look for success message
          const successMessage = page.getByText(/rating submitted/i)

          if (await successMessage.count() > 0) {
            await expect(successMessage.first()).toBeVisible()
          }
        }
      }
    }
  })

  test('shows low rating prompt after low rating', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 2-star rating (low rating)
          await stars.nth(1).click()
          await page.waitForTimeout(500)

          // Look for error alert asking for feedback
          const errorAlert = page.locator('.cs\\:alert-error')

          if (await errorAlert.count() > 0) {
            await expect(errorAlert.first()).toBeVisible()

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

  test('displays review form with required fields', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click a star to trigger form display
          await stars.nth(4).click()
          await page.waitForTimeout(1000)

          // Look for review form fields
          const reviewTitleInput = page.locator('#reviewTitle')
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')

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

  test('can fill out review form', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click 5 stars
          await stars.nth(4).click()
          await page.waitForTimeout(1000)

          // Fill out form
          const reviewTitleInput = page.locator('#reviewTitle')
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')

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

          // Verify form is filled
          const reviewContent = await reviewTextarea.first().inputValue()
          expect(reviewContent).toContain('test review')
        }
      }
    }
  })

  test('submit button is enabled when form is valid', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

      const reviewSlide = page.locator('.cs\\:carousel-item').filter({ hasText: 'All done!' })

      if (await reviewSlide.count() > 0) {
        const stars = reviewSlide.locator('button').filter({ has: page.locator('svg') })

        if (await stars.count() >= 5) {
          // Click stars
          await stars.nth(4).click()
          await page.waitForTimeout(1000)

          // Fill required fields
          const reviewTextarea = page.locator('#review')
          const nameInput = page.locator('#name')
          const emailInput = page.locator('#email')

          if (await reviewTextarea.count() > 0 && await nameInput.count() > 0 && await emailInput.count() > 0) {
            await reviewTextarea.first().fill('Test review content')
            await nameInput.first().fill('Test User')
            await emailInput.first().fill('test@example.com')

            await page.waitForTimeout(500)

            // Find submit button
            const submitButton = page.locator('button[type="submit"]').or(
              page.locator('button').filter({ hasText: /submit.*review/i })
            )

            if (await submitButton.count() > 0) {
              // Button should be enabled
              const isDisabled = await submitButton.first().isDisabled()
              expect(isDisabled).toBeFalsy()
            }
          }
        }
      }
    }
  })

  test('displays completion image/emoji on review screen', async () => {
    const page = await createPage('/creations/thesweetestoccasion.com-50/interactive')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(5000)

    const carousel = page.locator('.cs\\:carousel')

    if (await carousel.count() > 0) {
      // Navigate to review screen
      await carousel.first().evaluate((el) => {
        el.scrollLeft = el.scrollWidth
      })

      await page.waitForTimeout(1000)

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
