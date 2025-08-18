// vite.config.ts - VERSION SIMPLIFIÉE ET ROBUSTE
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('cs-')
          }
        }
      })
    ],

    build: {
      target: ['es2018', 'chrome67', 'firefox62', 'safari12'],
      
      rollupOptions: {
        input: {
          embed: resolve(__dirname, 'src/embed.ts')
        },
        output: {
          format: 'iife',
          name: 'ChatSeller',
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'embed' ? 'embed.js' : '[name].js'
          },
          inlineDynamicImports: true
        },
        external: []
      },

      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        mangle: {
          reserved: ['ChatSeller', 'init', 'destroy']
        }
      } : undefined,

      sourcemap: !isProduction,
      outDir: 'dist',
      emptyOutDir: true,
      reportCompressedSize: isProduction
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      cors: true
    },

    preview: {
      host: '0.0.0.0',
      port: 3000,
      cors: true
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: !isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode)
    }
  }
})