import { describe, it, expect } from 'vitest'

// Example utility function to test
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Unit tests
describe('formatCurrency', () => {
  it('should format positive numbers correctly', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(0.99)).toBe('$0.99')
  })

  it('should format negative numbers correctly', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56')
    expect(formatCurrency(-50)).toBe('-$50.00')
  })

  it('should handle zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should handle very large numbers', () => {
    expect(formatCurrency(1000000)).toBe('$1,000,000.00')
    expect(formatCurrency(9999999.99)).toBe('$9,999,999.99')
  })
})