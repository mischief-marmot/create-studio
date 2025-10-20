import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { readFileSync, existsSync, readdirSync } from 'fs'
import { config as loadEnv } from 'dotenv'
import { createConsola } from "consola";

// Load environment variables from root .env file
loadEnv({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../app/.env') })

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const logger = createConsola({
  level: 5,
  formatOptions: {
    colors: true,
    compact: false,
    date: false,
  },
}).withTag('CS:UploadWidgets')
logger.level = 999

async function uploadChunkedFilesToBlob() {
  try {
    const distDir = resolve(root, 'dist')
    if (!existsSync(distDir)) {
      logger.warn('Dist directory not found, skipping chunk upload')
      return
    }

    // Get all JS and CSS files
    const files = readdirSync(distDir).filter(file =>
      file.endsWith('.js') || file.endsWith('.css')
    )

    if (files.length === 0) {
      logger.warn('No files found to upload')
      return
    }

    // Upload each file individually to blob storage
    const baseUrl = process.env.NUXT_PUBLIC_ROOT_URL || 'https://create.studio'
    const uploadFailures = []

    logger.info(`Found ${files.length} files to upload to ${baseUrl}:`, files)

    for (const filename of files) {
      const filePath = resolve(distDir, filename)
      const content = readFileSync(filePath, 'utf-8')

      try {
        const response = await fetch(`${baseUrl}/api/v2/upload-widget`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename,
            content,
            metadata: {
              buildTime: new Date().toISOString(),
              size: Buffer.byteLength(content, 'utf8')
            }
          })
        })

        if (response.ok) {
          const result = await response.json()
          logger.success(`${filename} uploaded (${Math.floor(result.size / 1024)}KB)`)
        } else {
          const responseText = await response.text()
          const failureReason = `HTTP ${response.status}: ${responseText}`
          uploadFailures.push({ filename, reason: failureReason })
          logger.error(`Failed to upload ${filename}:`, failureReason)
        }
      } catch (error) {
        const failureReason = `Network error: ${error.message}`
        uploadFailures.push({ filename, reason: failureReason })
        logger.error(`Upload error to ${baseUrl} for ${filename}:`, failureReason)
      }
    }

    // Check for upload failures and throw error if any occurred
    if (uploadFailures.length > 0) {
      const failureMessages = uploadFailures.map(f => `${f.filename} (${f.reason})`).join(', ')
      throw new Error(`Upload failed for ${uploadFailures.length} file(s): ${failureMessages}`)
    }

    logger.success('All widget files uploaded successfully!')

  } catch (error) {
    logger.error('Failed to upload widgets:', error)
    throw error
  }
}

// Run the upload
uploadChunkedFilesToBlob().catch(err => {
  process.exit(1)
})
