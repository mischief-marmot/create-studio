#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { minify } from 'terser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function buildEmbed() {
  try {
    console.log('🔧 Building embed script...');
    
    // Read the source file
    const embedPath = join(projectRoot, 'public/embed.js');
    const embedSource = readFileSync(embedPath, 'utf8');
    
    // Minify the code
    const minified = await minify(embedSource, {
      compress: {
        dead_code: true,
        drop_debugger: true,
        drop_console: false, // Keep console for debugging if needed
        passes: 2,
        unsafe: true,
        unsafe_comps: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    });
    
    if (minified.error) {
      throw minified.error;
    }
    
    // Write minified version
    const minPath = join(projectRoot, 'public/embed.min.js');
    writeFileSync(minPath, minified.code);
    
    // Show file sizes
    const originalSize = Buffer.byteLength(embedSource, 'utf8');
    const minifiedSize = Buffer.byteLength(minified.code, 'utf8');
    const compressionRatio = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
    
    console.log(`✅ Embed script built successfully!`);
    console.log(`📦 Original: ${originalSize} bytes`);
    console.log(`🗜️  Minified: ${minifiedSize} bytes`);
    console.log(`📉 Compression: ${compressionRatio}% smaller`);
    
    // Show the minified code for easy copying
    console.log(`\n📋 Minified code (${minifiedSize} bytes):`);
    console.log(`<script>${minified.code}</script>`);
    
  } catch (error) {
    console.error('❌ Error building embed:', error);
    process.exit(1);
  }
}

buildEmbed();