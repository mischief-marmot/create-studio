import { describe, it, expect, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'

describe('Authentication Components', () => {
  it('login page renders correctly', async () => {
    const LoginPage = await import('~/pages/login.vue')
    const wrapper = await mountSuspended(LoginPage.default)
    
    expect(wrapper.find('h2').text()).toBe('Sign In')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('input[type="password"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Sign In')
  })

  it('register page renders correctly', async () => {
    const RegisterPage = await import('~/pages/register.vue')
    const wrapper = await mountSuspended(RegisterPage.default)
    
    expect(wrapper.find('h2').text()).toBe('Create Account')
    expect(wrapper.find('input[placeholder="John Doe"]').exists()).toBe(true)
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.findAll('input[type="password"]')).toHaveLength(2)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Create Account')
  })

  it('forgot password page renders correctly', async () => {
    const ForgotPasswordPage = await import('~/pages/forgot-password.vue')
    const wrapper = await mountSuspended(ForgotPasswordPage.default)
    
    expect(wrapper.find('h2').text()).toBe('Reset Password')
    expect(wrapper.find('input[type="email"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('Send Reset Link')
  })

  it('register page shows error for mismatched passwords', async () => {
    const RegisterPage = await import('~/pages/register.vue')
    const wrapper = await mountSuspended(RegisterPage.default)
    
    // Fill in form data
    await wrapper.find('input[placeholder="John Doe"]').setValue('Test User')
    await wrapper.find('input[type="email"]').setValue('test@example.com')
    
    const passwordInputs = wrapper.findAll('input[type="password"]')
    await passwordInputs[0].setValue('password123')
    await passwordInputs[1].setValue('password456')
    
    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Check for error
    expect(wrapper.find('.alert-error').exists()).toBe(true)
    expect(wrapper.find('.alert-error').text()).toContain('Passwords do not match')
  })
})