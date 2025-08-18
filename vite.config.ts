// vite.config.ts - CONFIGURATION AVEC ESBUILD (PLUS RAPIDE)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('cs-')
        }
      }
    })
  ],

  // ✅ BUILD AVEC ESBUILD (PLUS RAPIDE QUE TERSER)
  build: {
    target: 'es2018',
    
    rollupOptions: {
      input: {
        embed: resolve(__dirname, 'src/embed.ts')
      },
      output: {
        format: 'iife',
        name: 'ChatSeller',
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'embed' ? 'embed.js' : '[name].js'
        }
      },
      external: []
    },

    // ✅ ESBUILD AU LIEU DE TERSER
    minify: 'esbuild',

    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true
  },

  // ✅ SERVER DÉVELOPPEMENT
  server: {
    host: '0.0.0.0',
    port: 3000,
    cors: true
  },

  // ✅ PREVIEW
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
    __VUE_PROD_DEVTOOLS__: false
  }
})