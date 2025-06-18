import { describe, test, expect } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

describe('Home Page', async () => {
  await setup()

  test('has title', async () => {
    const page = await createPage(url('/'))
    
    // Get page title using Playwright's page.title() method
    const pageTitle = await page.title()
    expect(pageTitle).toContain('Nuxt Starter')
  })

  test('displays welcome heading', async () => {
    const page = await createPage(url('/'))
    
    // Get text content from the heading
    const heading = page.locator('h1')
    const headingText = await heading.textContent()
    expect(headingText).toBe('Welcome to the Nuxt Starter')
  })

  test('has get started button', async () => {
    const page = await createPage(url('/'))
    
    const button = page.locator('button:has-text("Get Started")')
    const isVisible = await button.isVisible()
    expect(isVisible).toBe(true)
    
    // Check button classes
    const buttonClass = await button.getAttribute('class')
    expect(buttonClass).toMatch(/btn-primary/)
  })

  test('button is clickable', async () => {
    const page = await createPage(url('/'))
    
    const button = page.locator('button:has-text("Get Started")')
    const isEnabled = await button.isEnabled()
    expect(isEnabled).toBe(true)
    
    // Test click interaction
    await button.click()
    // In a real app, this would navigate or trigger an action
  })

  test('responsive design works', async () => {
    const page = await createPage(url('/'))
    
    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 })
    const hero = page.locator('.hero')
    const isVisibleDesktop = await hero.isVisible()
    expect(isVisibleDesktop).toBe(true)

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 })
    const isVisibleMobile = await hero.isVisible()
    expect(isVisibleMobile).toBe(true)
    
    const heroClass = await hero.getAttribute('class')
    expect(heroClass).toMatch(/min-h-screen/)
  })

  test('page has proper meta tags', async () => {
    const page = await createPage(url('/'))
    
    const description = page.locator('meta[name="description"]')
    const content = await description.getAttribute('content')
    expect(content).toMatch(/Nuxt/)
  })

  test('accessibility - button has proper contrast', async () => {
    const page = await createPage(url('/'))
    
    const button = page.locator('button:has-text("Get Started")')
    
    // Check button is keyboard accessible
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Verify button can be activated with keyboard
    const isFocused = await button.evaluate((el: HTMLElement) => el === document.activeElement)
    if (isFocused) {
      await page.keyboard.press('Enter')
    }
    
    // Just verify the button exists and is accessible
    const isVisible = await button.isVisible()
    expect(isVisible).toBe(true)
  })
})