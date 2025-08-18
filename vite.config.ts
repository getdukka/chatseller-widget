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

  // ✅ BUILD CONFIGURATION POUR WIDGET EMBEDDABLE
  build: {
    target: 'es2018',
    
    rollupOptions: {
      // ✅ POINT D'ENTRÉE UNIQUE AVEC VUE INTÉGRÉ
      input: resolve(__dirname, 'src/embed.ts'),
      output: {
        // ✅ FORMAT IIFE POUR COMPATIBILITÉ MAXIMALE
        format: 'iife',
        name: 'ChatSellerWidget',
        entryFileNames: 'embed.js',
        chunkFileNames: 'chunk-[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'widget.css'
          }
          return '[name].[ext]'
        },
        // ✅ GLOBALS POUR ÉVITER L'EXTERNAL DES DÉPENDANCES
        globals: {}
      },
      // ✅ AUCUNE DÉPENDANCE EXTERNE - TOUT BUNDLÉ
      external: []
    },

    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    
    // ✅ CSS INTÉGRÉ DANS LE JS
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