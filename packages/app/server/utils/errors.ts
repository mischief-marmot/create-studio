/**
 * Error handling utilities for the services API
 * Maintains compatibility with the original Express API error responses
 */

export interface APIError {
  error: string
  details?: any
  statusCode?: number
}

/**
 * Standard error response format
 */
export function createAPIError(message: string, statusCode = 500, details?: any): APIError {
  return {
    error: message,
    details,
    statusCode
  }
}

/**
 * Handle and normalize errors for API responses
 */
export function handleAPIError(error: any): APIError {
  console.error('API Error:', error)

  // If it's already a formatted API error
  if (error.error && error.statusCode) {
    return error
  }

  // Handle different error types
  if (error.name === 'SequelizeUniqueConstraintError' || error.message?.includes('UNIQUE constraint failed')) {
    return createAPIError('Email already exists', 400, { field: 'email' })
  }

  if (error.name === 'SequelizeValidationError') {
    return createAPIError('Validation failed', 400, { validation: error.errors })
  }

  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return createAPIError('Authentication failed', 401)
  }

  if (error.message?.includes('not found')) {
    return createAPIError('Resource not found', 404)
  }

  // Default error
  return createAPIError(
    process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
    500,
    process.env.NODE_ENV === 'production' ? undefined : { stack: error.stack }
  )
}

/**
 * Send error response
 */
export function sendErrorResponse(event: any, error: any) {
  const apiError = handleAPIError(error)

  setResponseStatus(event, apiError.statusCode || 500)

  return {
    error: apiError.error,
    ...(apiError.details && { details: apiError.details })
  }
}

/**
 * Validate required fields
 */
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field])

  if (missing.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: `Missing required fields: ${missing.join(', ')}`
    })
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  // More strict email regex that doesn't allow consecutive dots
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

  // Additional check for consecutive dots which are not allowed in email addresses
  if (email.includes('..')) {
    return false
  }

  return emailRegex.test(email)
}

/**
 * Custom error classes for specific scenarios
 */
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}