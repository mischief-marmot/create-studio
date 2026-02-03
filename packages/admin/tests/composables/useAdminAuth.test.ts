import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAdminAuth } from '../../app/composables/useAdminAuth'

// Mock $fetch
global.$fetch = vi.fn()

// Mock navigateTo
global.navigateTo = vi.fn()

describe('useAdminAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
        firstname: 'John',
        lastname: 'Doe',
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockUser)

      const { login, adminUser, isAuthenticated } = useAdminAuth()

      const result = await login('admin@example.com', 'password')

      expect(result).toBe(true)
      expect(adminUser.value).toEqual(mockUser)
      expect(isAuthenticated.value).toBe(true)
      expect($fetch).toHaveBeenCalledWith('/api/admin/auth/login', {
        method: 'POST',
        body: { email: 'admin@example.com', password: 'password' },
      })
    })

    it('should handle login failure', async () => {
      vi.mocked($fetch).mockRejectedValueOnce({
        data: { message: 'Invalid credentials' },
      })

      const { login, adminUser, isAuthenticated, error } = useAdminAuth()

      const result = await login('admin@example.com', 'wrongpassword')

      expect(result).toBe(false)
      expect(adminUser.value).toBe(null)
      expect(isAuthenticated.value).toBe(false)
      expect(error.value).toBe('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('should successfully logout and redirect', async () => {
      // First login to set a user
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      }

      vi.mocked($fetch).mockResolvedValueOnce(mockUser)

      const { login, logout, adminUser } = useAdminAuth()

      // Login first
      await login('admin@example.com', 'password')
      expect(adminUser.value).toEqual(mockUser)

      // Now logout
      vi.mocked($fetch).mockResolvedValueOnce({ success: true })

      await logout()

      expect(adminUser.value).toBe(null)
      expect($fetch).toHaveBeenCalledWith('/api/admin/auth/logout', {
        method: 'POST',
      })
      expect(navigateTo).toHaveBeenCalledWith('/login')
    })
  })

  describe('fetchSession', () => {
    it('should fetch and set authenticated session', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@example.com',
        role: 'admin',
      }

      vi.mocked($fetch).mockResolvedValueOnce({
        authenticated: true,
        user: mockUser,
      })

      const { fetchSession, adminUser, isAuthenticated } = useAdminAuth()

      await fetchSession()

      expect(adminUser.value).toEqual(mockUser)
      expect(isAuthenticated.value).toBe(true)
    })

    it('should handle unauthenticated session', async () => {
      vi.mocked($fetch).mockResolvedValueOnce({
        authenticated: false,
        user: null,
      })

      const { fetchSession, adminUser, isAuthenticated } = useAdminAuth()

      await fetchSession()

      expect(adminUser.value).toBe(null)
      expect(isAuthenticated.value).toBe(false)
    })
  })
})
