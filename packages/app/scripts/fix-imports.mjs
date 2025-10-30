import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

function updateImports(filePath) {
  let content = readFileSync(filePath, 'utf-8')
  let changed = false

  // Replace #shared imports with @create-studio/shared
  if (content.includes('#shared/')) {
    content = content.replace(/#shared\//g, '@create-studio/shared/')
    changed = true
  }

  if (changed) {
    writeFileSync(filePath, content, 'utf-8')
    console.log(`Updated: ${filePath}`)
  }
}

function processDirectory(dir) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = join(dir, file)
    const stat = statSync(filePath)

    if (stat.isDirectory() && file !== 'node_modules' && file !== '.nuxt' && file !== 'dist') {
      processDirectory(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.vue')) {
      updateImports(filePath)
    }
  }
}

processDirectory('./server')
console.log('✓ Import paths updated in server')
