import { describe, it, expect, vi, beforeEach } from 'vitest'
import { 
  uploadToR2, 
  deleteFromR2, 
  getSignedUploadUrl, 
  generateFileKey, 
  validateFileType,
  getPublicUrl
} from '~/utils/r2-storage'

// Mock fetch
global.fetch = vi.fn()

describe('R2 Storage Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateFileKey', () => {
    it('should generate unique file key with proper structure', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const key = generateFileKey(file, 'recipe-123')
      
      expect(key).toMatch(/^recipe-123\/images\/\d{4}\/\d{2}\/[\w-]+\.jpg$/)
    })

    it('should handle files without extensions', () => {
      const file = new File(['test'], 'test', { type: 'image/jpeg' })
      const key = generateFileKey(file, 'recipe-123')
      
      expect(key).toMatch(/^recipe-123\/images\/\d{4}\/\d{2}\/[\w-]+\.jpeg$/)
    })

    it('should normalize file names', () => {
      const file = new File(['test'], 'My File Name!@#$.jpg', { type: 'image/jpeg' })
      const key = generateFileKey(file, 'recipe-123')
      
      expect(key).toMatch(/^recipe-123\/images\/\d{4}\/\d{2}\/[\w-]+\.jpg$/)
      expect(key).not.toContain(' ')
      expect(key).not.toContain('!')
      expect(key).not.toContain('@')
    })
  })

  describe('validateFileType', () => {
    it('should accept valid image types', () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' })
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' })
      
      expect(validateFileType(jpegFile)).toBe(true)
      expect(validateFileType(pngFile)).toBe(true)
      expect(validateFileType(webpFile)).toBe(true)
    })

    it('should reject invalid file types', () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' })
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' })
      
      expect(validateFileType(textFile)).toBe(false)
      expect(validateFileType(pdfFile)).toBe(false)
    })

    it('should handle custom allowed types', () => {
      const svgFile = new File(['test'], 'test.svg', { type: 'image/svg+xml' })
      
      expect(validateFileType(svgFile, ['image/svg+xml'])).toBe(true)
      expect(validateFileType(svgFile)).toBe(false)
    })
  })

  describe('getSignedUploadUrl', () => {
    it('should fetch signed upload URL from API', async () => {
      const mockResponse = {
        uploadUrl: 'https://r2.example.com/signed-url',
        publicUrl: 'https://cdn.example.com/file.jpg'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as Response)

      const result = await getSignedUploadUrl('test-key.jpg', 'image/jpeg')

      expect(fetch).toHaveBeenCalledWith('/api/upload/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'test-key.jpg',
          contentType: 'image/jpeg'
        })
      })

      expect(result).toEqual(mockResponse)
    })

    it('should throw error on API failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      } as Response)

      await expect(getSignedUploadUrl('test-key.jpg', 'image/jpeg'))
        .rejects.toThrow('Failed to get signed upload URL: 400 Bad Request')
    })
  })

  describe('uploadToR2', () => {
    it('should upload file using signed URL', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock signed URL response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://r2.example.com/signed-url',
            publicUrl: 'https://cdn.example.com/file.jpg'
          })
        } as Response)
        // Mock upload response
        .mockResolvedValueOnce({
          ok: true
        } as Response)

      const result = await uploadToR2(file, 'recipe-123')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(result.publicUrl).toBe('https://cdn.example.com/file.jpg')
    })

    it('should handle upload failure', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      
      // Mock signed URL response
      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            uploadUrl: 'https://r2.example.com/signed-url',
            publicUrl: 'https://cdn.example.com/file.jpg'
          })
        } as Response)
        // Mock upload failure
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error'
        } as Response)

      await expect(uploadToR2(file, 'recipe-123'))
        .rejects.toThrow('Failed to upload file: 500 Internal Server Error')
    })

    it('should validate file type before upload', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      await expect(uploadToR2(file, 'recipe-123'))
        .rejects.toThrow('Invalid file type: text/plain')
    })

    it('should validate file size', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024 + 1) // > 10MB
      const file = new File([largeContent], 'test.jpg', { type: 'image/jpeg' })
      
      await expect(uploadToR2(file, 'recipe-123', { maxSizeMB: 10 }))
        .rejects.toThrow('File size exceeds maximum allowed size')
    })
  })

  describe('deleteFromR2', () => {
    it('should delete file from R2', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true
      } as Response)

      await deleteFromR2('test-key.jpg')

      expect(fetch).toHaveBeenCalledWith('/api/upload/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'test-key.jpg' })
      })
    })

    it('should handle delete failure gracefully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      } as Response)

      // Should not throw, just log the error
      await expect(deleteFromR2('test-key.jpg')).resolves.toBeUndefined()
    })
  })

  describe('getPublicUrl', () => {
    it('should construct public URL from key', () => {
      process.env.NUXT_PUBLIC_R2_PUBLIC_URL = 'https://cdn.example.com'
      
      const key = 'recipe-123/images/2025/06/test-file.jpg'
      const url = getPublicUrl(key)
      
      expect(url).toBe(`https://cdn.example.com/${key}`)
    })

    it('should handle environment variable fallback', () => {
      const originalEnv = process.env.NUXT_PUBLIC_R2_PUBLIC_URL
      delete process.env.NUXT_PUBLIC_R2_PUBLIC_URL
      
      const key = 'recipe-123/images/2025/06/test-file.jpg'
      const url = getPublicUrl(key)
      
      expect(url).toBe(`https://cdn.example.com/${key}`)
      
      // Restore
      process.env.NUXT_PUBLIC_R2_PUBLIC_URL = originalEnv
    })
  })

  describe('Progress tracking', () => {
    it('should use XMLHttpRequest when onProgress is provided', async () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const onProgress = vi.fn()
      
      // Mock XMLHttpRequest for progress tracking
      const mockXHR = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        status: 200,
        statusText: 'OK',
        upload: {
          addEventListener: vi.fn()
        },
        addEventListener: vi.fn((event, callback) => {
          if (event === 'load') {
            callback()
          }
        })
      }
      
      global.XMLHttpRequest = vi.fn(() => mockXHR) as any

      // Mock signed URL response
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          uploadUrl: 'https://r2.example.com/signed-url',
          publicUrl: 'https://cdn.example.com/file.jpg'
        })
      } as Response)

      await uploadToR2(file, 'recipe-123', { onProgress })

      expect(XMLHttpRequest).toHaveBeenCalled()
      expect(mockXHR.open).toHaveBeenCalledWith('PUT', 'https://r2.example.com/signed-url')
      expect(mockXHR.upload.addEventListener).toHaveBeenCalledWith('progress', expect.any(Function))
    })
  })
})