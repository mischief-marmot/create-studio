import { readFileSync } from 'fs'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  try {
    console.log('Starting widget upload to blob storage...')
    
    // Upload IIFE JavaScript file
    const jsPath = resolve(process.cwd(), 'dist/embed/create-studio.iife.js')
    console.log('Reading JS file from:', jsPath)
    const jsContent = readFileSync(jsPath, 'utf-8')  // Read as text
    console.log('JS file size:', jsContent.length, 'characters')
    
    await hubBlob().put('create-studio.iife.js', jsContent, {
      addRandomSuffix: false,
      contentType: 'application/javascript'
    })
    console.log('✅ JS file uploaded to blob')
    
    // Upload CSS file (optional - might be inlined in JS)
    const cssPath = resolve(process.cwd(), 'dist/embed/create-studio.css')
    console.log('Checking CSS file at:', cssPath)
    
    try {
      const cssContent = readFileSync(cssPath, 'utf-8')  // Read as text
      console.log('CSS file size:', cssContent.length, 'characters')
      
      await hubBlob().put('create-studio.css', cssContent, {
        addRandomSuffix: false,
        contentType: 'text/css'
      })
      console.log('✅ CSS file uploaded to blob')
    } catch (cssError) {
      console.log('⚠️  CSS file not found (might be inlined in JS):', cssError.message)
      // This is okay if CSS is inlined in the JavaScript bundle
    }
    
    return { success: true, message: 'Widget files uploaded to blob storage' }
  } catch (error) {
    console.error('❌ Blob upload failed:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to upload widget files: ${error.message}`
    })
  }
})