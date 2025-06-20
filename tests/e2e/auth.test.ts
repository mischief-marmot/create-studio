import { describe, test, expect } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

describe('Authentication Flow', async () => {
  await setup()

  test('login page loads correctly', async () => {
    const page = await createPage(url('/login'))
    
    // Check page title
    const title = page.locator('h2')
    expect(await title.textContent()).toBe('Sign In')
    
    // Check form elements exist
    expect(await page.locator('input[type="email"]').isVisible()).toBe(true)
    expect(await page.locator('input[type="password"]').isVisible()).toBe(true)
    expect(await page.locator('button[type="submit"]').textContent()).toBe('Sign In')
    
    // Check links
    expect(await page.locator('a[href="/forgot-password"]').isVisible()).toBe(true)
    expect(await page.locator('a[href="/register"]').isVisible()).toBe(true)
  })

  test('register page loads correctly', async () => {
    const page = await createPage(url('/register'))
    
    // Check page title
    const title = page.locator('h2')
    expect(await title.textContent()).toBe('Create Account')
    
    // Check form elements exist
    expect(await page.locator('input[placeholder="John Doe"]').isVisible()).toBe(true)
    expect(await page.locator('input[type="email"]').isVisible()).toBe(true)
    expect(await page.locator('input[type="password"]').first().isVisible()).toBe(true)
    expect(await page.locator('input[type="password"]').last().isVisible()).toBe(true)
    expect(await page.locator('button[type="submit"]').textContent()).toBe('Create Account')
    
    // Check link to login
    expect(await page.locator('a[href="/login"]').isVisible()).toBe(true)
  })

  test('forgot password page loads correctly', async () => {
    const page = await createPage(url('/forgot-password'))
    
    // Check page title
    const title = page.locator('h2')
    expect(await title.textContent()).toBe('Reset Password')
    
    // Check form elements
    expect(await page.locator('input[type="email"]').isVisible()).toBe(true)
    expect(await page.locator('button[type="submit"]').textContent()).toBe('Send Reset Link')
    
    // Check link to login
    expect(await page.locator('a[href="/login"]').isVisible()).toBe(true)
  })

  test('login with invalid credentials shows error', async () => {
    const page = await createPage(url('/login'))
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Wait for error to appear and check
    await page.waitForSelector('.alert-error', { timeout: 5000 })
    expect(await page.locator('.alert-error').isVisible()).toBe(true)
  })

  test('register with mismatched passwords shows error', async () => {
    const page = await createPage(url('/register'))
    
    // Fill form with mismatched passwords
    await page.fill('input[placeholder="John Doe"]', 'Test User')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.locator('input[type="password"]').nth(0).fill('password123')
    await page.locator('input[type="password"]').nth(1).fill('password456')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Check for error message
    expect(await page.locator('.alert-error').isVisible()).toBe(true)
    expect(await page.locator('.alert-error').textContent()).toContain('Passwords do not match')
  })

  test('navigation between auth pages works', async () => {
    const page = await createPage(url('/login'))
    
    // Navigate to register
    await page.click('a[href="/register"]')
    expect(page.url()).toMatch(/\/register/)
    
    // Navigate back to login
    await page.click('a[href="/login"]')
    expect(page.url()).toMatch(/\/login/)
    
    // Navigate to forgot password
    await page.click('a[href="/forgot-password"]')
    expect(page.url()).toMatch(/\/forgot-password/)
  })
})