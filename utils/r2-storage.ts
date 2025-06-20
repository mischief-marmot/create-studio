/**
 * NuxtHub Blob Storage Utilities
 * Handles file uploads, deletions, and URL generation using NuxtHub
 */

export interface UploadOptions {
  maxSizeMB?: number
  allowedTypes?: string[]
  onProgress?: (progress: number) => void
}

export interface UploadResult {
  key: string
  publicUrl: string
  size: number
}

export interface SignedUploadResponse {
  uploadUrl: string
  publicUrl: string
}

const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif'
]

const DEFAULT_MAX_SIZE_MB = 10

/**
 * Generate a unique file key for R2 storage
 */
export function generateFileKey(file: File, prefix: string = 'uploads'): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  
  // Clean and normalize filename
  const originalName = file.name
  const parts = originalName.split('.')
  const extension = parts.length > 1 && parts[parts.length - 1] 
    ? parts[parts.length - 1].toLowerCase() 
    : getExtensionFromMimeType(file.type)
  const baseName = parts.length > 1 ? parts.slice(0, -1).join('.') : originalName
  const cleanName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  
  // Generate unique identifier
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const uniqueName = `${cleanName}-${timestamp}-${random}`
  
  return `${prefix}/images/${year}/${month}/${uniqueName}.${extension}`
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpeg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/svg+xml': 'svg'
  }
  return extensions[mimeType] || 'bin'
}

/**
 * Validate file type against allowed types
 */
export function validateFileType(file: File, allowedTypes: string[] = DEFAULT_ALLOWED_TYPES): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = DEFAULT_MAX_SIZE_MB): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Get signed upload URL from API
 */
export async function getSignedUploadUrl(key: string, contentType: string): Promise<SignedUploadResponse> {
  const response = await fetch('/api/upload/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      key,
      contentType
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to get signed upload URL: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Upload file to R2 using signed URL
 */
export async function uploadToR2(
  file: File, 
  prefix: string = 'uploads',
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    maxSizeMB = DEFAULT_MAX_SIZE_MB,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    onProgress
  } = options

  // Validate file type
  if (!validateFileType(file, allowedTypes)) {
    throw new Error(`Invalid file type: ${file.type}`)
  }

  // Validate file size
  if (!validateFileSize(file, maxSizeMB)) {
    throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`)
  }

  // Generate unique key
  const key = generateFileKey(file, prefix)

  // Get signed upload URL
  const { uploadUrl, publicUrl } = await getSignedUploadUrl(key, file.type)

  // Upload file using XMLHttpRequest for progress tracking
  if (onProgress) {
    return uploadWithProgress(file, uploadUrl, publicUrl, key, onProgress)
  }

  // Simple upload using fetch
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  })

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`)
  }

  return {
    key,
    publicUrl,
    size: file.size
  }
}

/**
 * Upload file with progress tracking using XMLHttpRequest
 */
function uploadWithProgress(
  file: File, 
  uploadUrl: string, 
  publicUrl: string, 
  key: string,
  onProgress: (progress: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          key,
          publicUrl,
          size: file.size
        })
      } else {
        reject(new Error(`Failed to upload file: ${xhr.status} ${xhr.statusText}`))
      }
    })

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    xhr.open('PUT', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const response = await fetch('/api/upload/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ key })
    })

    if (!response.ok) {
      console.warn(`Failed to delete file from R2: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.warn('Error deleting file from R2:', error)
  }
}

/**
 * Get public URL for a file key
 */
export function getPublicUrl(key: string): string {
  const baseUrl = process.env.NUXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.example.com'
  return `${baseUrl}/${key}`
}

/**
 * Extract key from public URL
 */
export function getKeyFromUrl(url: string): string | null {
  const baseUrl = process.env.NUXT_PUBLIC_R2_PUBLIC_URL || 'https://cdn.example.com'
  if (url.startsWith(baseUrl)) {
    return url.replace(`${baseUrl}/`, '')
  }
  return null
}

/**
 * Batch upload multiple files
 */
export async function uploadMultipleToR2(
  files: File[],
  prefix: string = 'uploads',
  options: UploadOptions = {}
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const fileOptions = {
      ...options,
      onProgress: options.onProgress 
        ? (progress: number) => {
            // Calculate overall progress across all files
            const overallProgress = ((i / files.length) * 100) + (progress / files.length)
            options.onProgress!(Math.round(overallProgress))
          }
        : undefined
    }
    
    try {
      const result = await uploadToR2(file, prefix, fileOptions)
      results.push(result)
    } catch (error) {
      // Continue with other files even if one fails
      console.error(`Failed to upload ${file.name}:`, error)
      throw error // Re-throw to stop batch upload on error
    }
  }
  
  return results
}

/**
 * Generate optimized image variants (if needed in the future)
 */
export interface ImageVariant {
  width: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
}

export function generateImageVariants(originalKey: string, variants: ImageVariant[]): string[] {
  // This would integrate with Cloudflare Images or similar service
  // For now, return the original key
  return variants.map(variant => {
    const extension = variant.format || 'jpeg'
    const quality = variant.quality || 80
    return `${originalKey}?width=${variant.width}&quality=${quality}&format=${extension}`
  })
}