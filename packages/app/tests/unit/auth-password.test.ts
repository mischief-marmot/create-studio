import { describe, it, expect } from 'vitest'
import {
  hashUserPassword,
  verifyUserPassword,
  generatePasswordResetToken,
  verifyPasswordResetToken
} from '~/server/utils/auth'

describe('Password Hashing', () => {
  it('should hash a password', async () => {
    const password = 'mySecurePassword123!'
    const hash = await hashUserPassword(password)

    expect(hash).toBeDefined()
    expect(hash).not.toBe(password)
    expect(hash.length).toBeGreaterThan(0)
  })

  it('should verify correct password against hash', async () => {
    const password = 'mySecurePassword123!'
    const hash = await hashUserPassword(password)

    const isValid = await verifyUserPassword(password, hash)
    expect(isValid).toBe(true)
  })

  it('should reject incorrect password', async () => {
    const password = 'mySecurePassword123!'
    const wrongPassword = 'wrongPassword'
    const hash = await hashUserPassword(password)

    const isValid = await verifyUserPassword(wrongPassword, hash)
    expect(isValid).toBe(false)
  })

  it('should generate different hashes for same password', async () => {
    const password = 'mySecurePassword123!'
    const hash1 = await hashUserPassword(password)
    const hash2 = await hashUserPassword(password)

    expect(hash1).not.toBe(hash2)
    expect(await verifyUserPassword(password, hash1)).toBe(true)
    expect(await verifyUserPassword(password, hash2)).toBe(true)
  })
})

describe('Password Reset Tokens', () => {
  it('should generate password reset token', async () => {
    const token = await generatePasswordResetToken({
      id: 1,
      email: 'test@example.com'
    })

    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.length).toBeGreaterThan(0)
  })

  it('should verify valid password reset token', async () => {
    const userData = {
      id: 1,
      email: 'test@example.com'
    }

    const token = await generatePasswordResetToken(userData)
    const decoded = await verifyPasswordResetToken(token)

    expect(decoded.id).toBe(userData.id)
    expect(decoded.email).toBe(userData.email)
  })

  it('should reject invalid password reset token', async () => {
    const invalidToken = 'invalid.token.string'

    await expect(verifyPasswordResetToken(invalidToken)).rejects.toThrow()
  })

  it('should reject password reset token with wrong type', async () => {
    // Generate a regular validation token instead of password reset
    const { generateValidationToken } = await import('~/server/utils/auth')
    const validationToken = await generateValidationToken({
      id: 1,
      email: 'test@example.com'
    })

    await expect(verifyPasswordResetToken(validationToken)).rejects.toThrow('Invalid token type')
  })
})
