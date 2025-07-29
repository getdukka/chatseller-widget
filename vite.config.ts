// vite.config.ts - CONFIGURATION BUILD OPTIMISÉE POUR WIDGET SHOPIFY (CORRIGÉE)
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      // Plugin personnalisé pour optimiser le widget
      {
        name: 'chatseller-widget-optimizer',
        generateBundle(options, bundle) {
          if (isProduction) {
            const sizes = Object.entries(bundle).map(([name, chunk]) => {
              if (chunk.type === 'chunk') {
                return `${name}: ${(chunk.code.length / 1024).toFixed(2)}KB`
              }
              return `${name}: ${chunk.source ? (chunk.source.toString().length / 1024).toFixed(2) : 0}KB`
            }).join('\n')
            console.log('📦 ChatSeller Widget Bundle Sizes:\n' + sizes)
          }
        }
      }
    ],

    // ✅ CONFIGURATION BUILD POUR WIDGET EMBEDDABLE
    build: {
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        name: 'ChatSeller',
        formats: ['iife'], // IIFE seulement pour l'embeddage
        fileName: () => 'chatseller-widget.js'
      },

      // ✅ OPTIMISATIONS SHOPIFY/E-COMMERCE SPÉCIFIQUES
      rollupOptions: {
        external: [],
        output: {
          // Variables globales
          globals: {},
          
          // Format IIFE optimisé pour l'embeddage
          format: 'iife',
          name: 'ChatSeller',
          
          // ✅ OPTIMISATIONS CRITIQUES
          inlineDynamicImports: true, // Éviter les imports dynamiques
          manualChunks: undefined, // Pas de chunking pour l'embeddage
          
          // ✅ MINIFICATION AGRESSIVE
          compact: isProduction,
          
          // Bannière avec informations
          banner: `/*! ChatSeller Widget v${process.env.npm_package_version || '1.0.0'} | Shopify Optimized | (c) 2024 ChatSeller */`,
          
          // ✅ ISOLER LES STYLES
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'chatseller-widget.css'
            }
            return assetInfo.name || 'asset.[ext]'
          }
        }
      },

      // ✅ TARGET E-COMMERCE (Support large navigateurs)
      target: ['es2017', 'chrome64', 'firefox62', 'safari12'],
      
      // ✅ MINIFICATION MAXIMALE POUR PERFORMANCE
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          // Optimisations agressives
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info', 'console.debug'],
          reduce_vars: true,
          reduce_funcs: true,
          dead_code: true,
          unused: true,
          // Optimisations spécifiques widget
          booleans_as_integers: true,
          conditionals: true,
          evaluate: true,
          loops: true,
          unsafe: false, // Garder safe pour e-commerce
          unsafe_comps: false,
          unsafe_math: false
        },
        mangle: {
          toplevel: true,
          safari10: true,
          // Préserver les noms d'API publiques
          reserved: ['ChatSeller', 'init', 'destroy', 'show', 'hide']
        },
        format: {
          comments: false,
          // Optimiser pour la taille
          ascii_only: true,
          beautify: false,
          braces: false,
          semicolons: false
        }
      } : undefined,

      // ✅ CSS INLINE POUR ÉVITER FOUC (Flash of Unstyled Content)
      cssCodeSplit: false,
      
      // Source maps conditionnels
      sourcemap: isProduction ? false : true,
      
      // ✅ OPTIMISATION TAILLE CRITIQUE
      chunkSizeWarningLimit: 50, // Widget doit être < 50kb pour performance
      
      // Output directory
      outDir: 'dist',
      emptyOutDir: true,
      
      // ✅ OPTIMISATIONS ASSETS
      assetsDir: '',
      assetsInlineLimit: 2048 // 2KB - Inline small assets
    },

    // ✅ CONFIGURATION CSS POUR ISOLATION PARFAITE
    css: {
      postcss: {
        plugins: [
          // Plugin personnalisé pour préfixer automatiquement
          {
            postcssPlugin: 'chatseller-widget-isolation',
            Once(root) {
              // Ajouter automatiquement les préfixes d'isolation
              root.walkRules(rule => {
                if (!rule.selector.includes('#chatseller-widget') && 
                    !rule.selector.includes('.cs-') && 
                    !rule.selector.includes('@')) {
                  rule.selector = `#chatseller-widget ${rule.selector}`
                }
              })
            }
          },
          // Autoprefixer pour compatibilité navigateurs
          require('autoprefixer')
        ]
      },
      // Préprocesseur pour variables CSS
      preprocessorOptions: {
        scss: {
          additionalData: `
            $primary-color: #ec4899;
            $border-radius: 12px;
            $shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            $font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          `
        }
      }
    },

    // ✅ OPTIMISATIONS DÉVELOPPEMENT
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      },
      // Proxy pour tests avec sites e-commerce locaux
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false
        }
      }
    },

    // ✅ OPTIMISATIONS PREVIEW
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true
    },

    // ✅ ALIAS ET RÉSOLUTION
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        // Optimiser Vue pour production
        'vue': isProduction 
          ? 'vue/dist/vue.runtime.esm-bundler.js'
          : 'vue/dist/vue.esm-bundler.js'
      },
      // Extensions de fichiers
      extensions: ['.js', '.ts', '.vue', '.json']
    },

    // ✅ VARIABLES D'ENVIRONNEMENT
    define: {
      // Optimisations Vue
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      
      // Variables du widget
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.WIDGET_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0'),
      'process.env.BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString()),
      
      // API URL par défaut
      'process.env.VITE_API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://chatseller-api-production.up.railway.app'
      )
    },

    // ✅ OPTIMISATION DEPS POUR TAILLE MINIMALE
    optimizeDeps: {
      include: [
        'vue',
        'uuid'
      ],
      exclude: [
        // Exclure les dépendances lourdes non nécessaires
      ]
    },

    // ✅ CORRECTION : Suppression de la propriété experimental non valide
    // L'option buildAdvancedBaseOptions n'existe pas dans les versions actuelles de Vite

    // ✅ WORKER INLINE POUR ÉVITER LES CONFLITS
    worker: {
      format: 'iife'
    },

    // ✅ CONFIGURATION CACHE
    cacheDir: 'node_modules/.vite-chatseller',

    // ✅ BASE PATH DYNAMIQUE
    base: './',

    // ✅ PUBLICDIR POUR ASSETS STATIQUES
    publicDir: 'public',

    // ✅ OPTIMISATIONS JSON
    json: {
      namedExports: false,
      stringify: true
    }
  }
})