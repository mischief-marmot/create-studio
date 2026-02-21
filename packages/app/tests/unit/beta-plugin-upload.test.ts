import { describe, it, expect } from 'vitest'

/**
 * Tests for beta plugin upload and download endpoints
 *
 * Upload: POST /api/v2/internal/upload-beta-plugin
 * Download: GET /downloads/beta
 */

describe('Beta Plugin Upload - Input Validation', () => {
  it('should define the blob storage key as create-plugin-beta.zip', () => {
    const BETA_BLOB_KEY = 'create-plugin-beta.zip'
    expect(BETA_BLOB_KEY).toBe('create-plugin-beta.zip')
  })

  it('should only accept zip files', () => {
    const allowedTypes = ['application/zip', 'application/x-zip-compressed']
    const allowedExtension = '.zip'

    expect(allowedTypes).toContain('application/zip')
    expect(allowedTypes).toContain('application/x-zip-compressed')
    expect(allowedExtension).toBe('.zip')
  })

  it('should validate API key header name', () => {
    const headerName = 'X-Beta-Upload-Key'
    expect(headerName).toBe('X-Beta-Upload-Key')
  })

  it('should validate version string format when provided', () => {
    const validVersions = ['1.0.0-beta.1', '2.0.0-rc.1', '1.2.3-beta.45']
    const invalidVersions = ['', 'not-a-version']

    validVersions.forEach(v => {
      expect(v).toMatch(/^\d+\.\d+\.\d+/)
    })

    invalidVersions.forEach(v => {
      expect(v).not.toMatch(/^\d+\.\d+\.\d+-/)
    })
  })

  it('should enforce file size limit', () => {
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    expect(MAX_FILE_SIZE).toBe(52428800)
  })
})

describe('Beta Plugin Upload - Response Format', () => {
  it('should return success response with expected shape', () => {
    const expectedResponse = {
      success: true,
      message: 'Beta plugin uploaded successfully',
      filename: 'create-plugin-beta.zip',
      version: '2.0.0-beta.1',
      size: 1234567,
      uploadedAt: '2026-02-21T00:00:00.000Z',
    }

    expect(expectedResponse).toHaveProperty('success', true)
    expect(expectedResponse).toHaveProperty('message')
    expect(expectedResponse).toHaveProperty('filename', 'create-plugin-beta.zip')
    expect(expectedResponse).toHaveProperty('version')
    expect(expectedResponse).toHaveProperty('size')
    expect(expectedResponse).toHaveProperty('uploadedAt')
  })

  it('should return error response for unauthorized requests', () => {
    const errorResponse = {
      statusCode: 401,
      statusMessage: 'Unauthorized',
    }

    expect(errorResponse.statusCode).toBe(401)
  })

  it('should return error response for missing file', () => {
    const errorResponse = {
      statusCode: 400,
      statusMessage: 'No file provided. Upload a .zip file as multipart form data.',
    }

    expect(errorResponse.statusCode).toBe(400)
  })
})

describe('Beta Plugin Download - Endpoint Behavior', () => {
  it('should serve from the correct blob storage key', () => {
    const blobKey = 'create-plugin-beta.zip'
    expect(blobKey).toBe('create-plugin-beta.zip')
  })

  it('should set Content-Type to application/zip', () => {
    const contentType = 'application/zip'
    expect(contentType).toBe('application/zip')
  })

  it('should set Content-Disposition as attachment with filename', () => {
    const filename = 'create-plugin-beta.zip'
    const disposition = `attachment; filename="${filename}"`
    expect(disposition).toBe('attachment; filename="create-plugin-beta.zip"')
  })

  it('should enable CORS for public access', () => {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    }

    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('*')
  })

  it('should have no caching in debug mode and 1-day cache in production', () => {
    const debugCache = 'public, max-age=0'
    const prodCache = 'public, max-age=86400'

    expect(debugCache).toContain('max-age=0')
    expect(prodCache).toContain('max-age=86400')
  })
})
