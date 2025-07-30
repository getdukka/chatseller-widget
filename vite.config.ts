// vite.config.ts - CONFIGURATION BUILD OPTIMISÉE POUR WIDGET (CORRIGÉE)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      // Plugin personnalisé pour le widget
      {
        name: 'chatseller-widget-optimizer',
        generateBundle(options, bundle) {
          if (isProduction) {
            console.log('📦 ChatSeller Widget généré avec succès!')
          }
        }
      }
    ],

    // ✅ CONFIGURATION BUILD POUR WIDGET EMBEDDABLE
    build: {
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        name: 'ChatSeller',
        formats: ['iife'], // Format IIFE pour embeddage
        fileName: () => 'chatseller-widget.js'
      },

      rollupOptions: {
        external: [],
        output: {
          format: 'iife',
          name: 'ChatSeller',
          inlineDynamicImports: true,
          
          // Bannière d'identification
          banner: `/*! ChatSeller Widget v1.0.0 | Shopify Optimized */`,
          
          // CSS séparé
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'chatseller-widget.css'
            }
            return '[name].[ext]'
          }
        }
      },

      // Support navigateurs e-commerce
      target: ['es2017', 'chrome64', 'firefox62', 'safari12'],
      
      // Minification en production
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: {
          reserved: ['ChatSeller', 'init', 'destroy', 'show', 'hide']
        }
      } : undefined,

      // CSS inline pour éviter FOUC
      cssCodeSplit: false,
      sourcemap: !isProduction,
      
      // Limite taille pour performance
      chunkSizeWarningLimit: 100,
      
      outDir: 'dist',
      emptyOutDir: true
    },

    // ✅ CSS AVEC ISOLATION
    css: {
      postcss: {
        plugins: [
          // Autoprefixer pour compatibilité
          require('autoprefixer')({
            overrideBrowserslist: [
              '> 1%',
              'last 2 versions',
              'not dead'
            ]
          })
        ]
      }
    },

    // ✅ SERVEUR DÉVELOPPEMENT
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      // Proxy pour l'API
      proxy: {
        '/api': {
          target: 'https://chatseller-api-production.up.railway.app',
          changeOrigin: true,
          secure: true
        }
      }
    },

    // ✅ RÉSOLUTION MODULES
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    // ✅ VARIABLES D'ENVIRONNEMENT
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.WIDGET_VERSION': JSON.stringify('1.0.0'),
      'process.env.API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://chatseller-api-production.up.railway.app'
      )
    },

    // ✅ OPTIMISATION DEPS
    optimizeDeps: {
      include: ['vue', 'uuid']
    }
  }
})