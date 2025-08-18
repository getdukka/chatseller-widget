// vite.config.ts 
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

  // ✅ BUILD SINGLE ENTRY (EMBED ONLY)
  build: {
    target: 'es2018',
    
    rollupOptions: {
      // ✅ UN SEUL ENTRY POINT
      input: resolve(__dirname, 'src/embed.ts'),
      output: {
        format: 'iife',
        name: 'ChatSeller',
        entryFileNames: 'embed.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'style.css'
          }
          return '[name].[ext]'
        }
      },
      external: []
    },

    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    
    // ✅ CSS INTÉGRÉ (pas de code-splitting)
    cssCodeSplit: false
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
    __VUE_PROD_DEVTOOLS__: false
  }
})