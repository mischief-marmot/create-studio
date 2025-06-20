import { describe, test, expect } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'

describe('Protected Routes', async () => {
  await setup()

  test('unauthenticated user is redirected to login when accessing dashboard', async () => {
    const page = await createPage(url('/dashboard'))
    
    // Should redirect to login page
    expect(page.url()).toMatch(/\/login/)
  })

  test('unauthenticated user can access public pages', async () => {
    const page = await createPage(url('/'))
    
    // Should be able to access home page
    expect(page.url()).toMatch(/\/$/)
  })

  test('unauthenticated user can access auth pages', async () => {
    const loginPage = await createPage(url('/login'))
    expect(loginPage.url()).toMatch(/\/login/)
    
    const registerPage = await createPage(url('/register'))
    expect(registerPage.url()).toMatch(/\/register/)
    
    const forgotPage = await createPage(url('/forgot-password'))
    expect(forgotPage.url()).toMatch(/\/forgot-password/)
  })
})