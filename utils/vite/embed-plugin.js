import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { minify } from 'terser';

export function embedMinifier() {
  let config;
  let publicDir;
  
  const minifyFile = async (inputFile, outputFile, label) => {
    const inputPath = join(publicDir, inputFile);
    const outputPath = join(publicDir, outputFile);
    
    if (!existsSync(inputPath)) {
      console.warn(`⚠️  ${inputFile} not found, skipping minification`);
      return null;
    }
    
    try {
      const source = readFileSync(inputPath, 'utf8');
      
      const minified = await minify(source, {
        compress: {
          dead_code: true,
          drop_debugger: true,
          drop_console: false,
          passes: 2,
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
      
      // Write minified version to public directory
      writeFileSync(outputPath, minified.code);
      
      // Log compression stats
      const originalSize = Buffer.byteLength(source, 'utf8');
      const minifiedSize = Buffer.byteLength(minified.code, 'utf8');
      const compressionRatio = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ ${label} minified: ${originalSize}B → ${minifiedSize}B (${compressionRatio}% smaller)`);
      
      return minified.code;
      
    } catch (error) {
      console.error(`❌ Error minifying ${inputFile}:`, error);
      throw error;
    }
  };

  const minifyEmbed = () => minifyFile('embed.js', 'embed.min.js', 'Embed');
  const minifyInit = () => minifyFile('halogen-init.js', 'halogen-inline.js', 'Halogen Init');
  
  return {
    name: 'embed-minifier',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
      publicDir = config.publicDir || 'public';
    },
    
    async buildStart() {
      // Run minification at build start for both dev and production
      this.addWatchFile(join(publicDir, 'embed.js'));
      this.addWatchFile(join(publicDir, 'halogen-init.js'));
      await minifyEmbed();
      await minifyInit();
    },
    
    
    // Handle file changes in development
    async handleHotUpdate({ file, server }) {
      if (file.endsWith('embed.js')) {
        console.log('🔄 Embed file changed, re-minifying...');
        await minifyEmbed();
      } else if (file.endsWith('halogen-init.js')) {
        console.log('🔄 Halogen init file changed, re-minifying...');
        await minifyInit();
      }
    }
  };
}