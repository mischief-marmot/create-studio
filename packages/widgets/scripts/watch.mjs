import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { watch } from 'fs'
import { spawn } from 'child_process'
import { createConsola } from "consola"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const distDir = resolve(root, 'dist')

const logger = createConsola({
  level: 5,
  formatOptions: {
    colors: true,
    compact: false,
    date: false,
  },
}).withTag('CS:WatchWidgets')
logger.level = 999

let uploadTimeout = null
let isUploading = false

function uploadFiles() {
  if (isUploading) {
    logger.info('Upload already in progress, skipping...')
    return
  }

  isUploading = true
  logger.info('🔄 Changes detected, uploading widgets...')

  const upload = spawn('node', [resolve(__dirname, 'upload.mjs')], {
    stdio: 'inherit',
    cwd: root
  })

  upload.on('close', (code) => {
    isUploading = false
    if (code === 0) {
      logger.success('✅ Upload complete!')
    } else {
      logger.error(`❌ Upload failed with code ${code}`)
    }
  })

  upload.on('error', (err) => {
    isUploading = false
    logger.error('❌ Upload error:', err)
  })
}

function debouncedUpload() {
  if (uploadTimeout) {
    clearTimeout(uploadTimeout)
  }
  uploadTimeout = setTimeout(uploadFiles, 500)
}

// Start Vite in watch mode
logger.info('🚀 Starting Vite in watch mode...')
const vite = spawn('npx', ['vite', 'build', '--watch', '--mode', 'development'], {
  stdio: 'inherit',
  cwd: root
})

vite.on('error', (err) => {
  logger.error('Failed to start Vite:', err)
  process.exit(1)
})

// Watch the dist directory for changes
logger.info('👀 Watching dist directory for changes...')
const watcher = watch(distDir, { recursive: true }, (eventType, filename) => {
  if (filename && (filename.endsWith('.js') || filename.endsWith('.css'))) {
    logger.info(`📝 File changed: ${filename}`)
    debouncedUpload()
  }
})

// Handle cleanup
process.on('SIGINT', () => {
  logger.info('🛑 Stopping watch mode...')
  watcher.close()
  vite.kill()
  process.exit(0)
})

process.on('SIGTERM', () => {
  watcher.close()
  vite.kill()
  process.exit(0)
})

logger.success('✅ Watch mode started! Waiting for changes...')
