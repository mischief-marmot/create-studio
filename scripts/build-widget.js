import { build } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function buildWidget() {
  console.log('Building widget SDK...');
  
  try {
    await build({
      build: {
        target: 'es2015',
        lib: {
          entry: resolve(__dirname, '../widget-entry.ts'),
          name: 'CreateStudio',
          fileName: (format) => `create-studio.${format}.js`,
          formats: ['iife', 'es']
        },
        outDir: resolve(__dirname, '../dist/embed'),
        emptyOutDir: true,
        rollupOptions: {
          external: [],
          output: {
            format: 'iife',
            name: 'CreateStudio',
            globals: {},
            assetFileNames: 'create-studio.[ext]'
          }
        },
        minify: 'terser',
        sourcemap: true,
        terserOptions: {
          compress: {
            drop_console: false
          }
        }
      },
      plugins: [vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.includes('-')
          }
        }
      })],
      define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        __VUE_OPTIONS_API__: 'true',
        __VUE_PROD_DEVTOOLS__: 'false'
      },
      resolve: {
        alias: {
          'vue': 'vue/dist/vue.esm-bundler.js',
          '@': resolve(__dirname, '..')
        }
      }
    });
    
    console.log('✅ Widget SDK built successfully');
  } catch (error) {
    console.error('❌ Failed to build widget SDK:', error);
    process.exit(1);
  }
}

buildWidget();