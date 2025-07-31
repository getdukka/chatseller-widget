// vite.config.ts - CONFIGURATION BUILD OPTIMISÉE POUR WIDGET 450PX MODERNE - CORRIGÉ
import { defineConfig, type UserConfig, type ConfigEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// ✅ Interface pour les stats de build
interface BuildStats {
  timestamp: string
  files: Record<string, { size: number; sizeFormatted: string }>
  totalSize: number
  totalSizeFormatted: string
}

// ✅ Interface pour les chunks
interface BuildChunk {
  type: 'chunk'
  code: string
}

// ✅ Interface pour les assets
interface BuildAsset {
  type: 'asset'
  source: string | Uint8Array
}

type BundleItem = BuildChunk | BuildAsset

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      // Plugin personnalisé pour optimisation widget
      {
        name: 'chatseller-widget-optimizer',
        generateBundle(options, bundle) {
          if (isProduction) {
            console.log('📦 ChatSeller Widget 450px généré avec succès!')
            console.log('📊 Statistiques:')
            
            Object.keys(bundle).forEach(fileName => {
              const file = bundle[fileName]
              if (file && file.type === 'chunk') {
                const chunk = file as BuildChunk
                console.log(`   ${fileName}: ${(chunk.code.length / 1024).toFixed(2)}KB`)
              }
            })
          }
        }
      } as Plugin,
      // Plugin pour injection automatique de styles
      {
        name: 'inject-widget-styles',
        generateBundle(options, bundle) {
          // Injecter les styles CSS directement dans le JS pour éviter FOUC
          const cssFile = Object.keys(bundle).find(name => name.endsWith('.css'))
          const jsFile = Object.keys(bundle).find(name => name.endsWith('.js'))
          
          if (cssFile && jsFile && bundle[cssFile] && bundle[jsFile]) {
            const cssBundle = bundle[cssFile] as BuildAsset
            const jsBundle = bundle[jsFile] as BuildChunk
            
            const cssContent = typeof cssBundle.source === 'string' ? cssBundle.source : ''
            const jsContent = jsBundle.code
            
            // Injecter CSS dans JS
            const modifiedJs = jsContent.replace(
              '// CSS_INJECTION_POINT',
              `
                // Auto-inject CSS
                if (typeof document !== 'undefined') {
                  const style = document.createElement('style');
                  style.textContent = \`${cssContent}\`;
                  document.head.appendChild(style);
                }
              `
            )
            
            jsBundle.code = modifiedJs
            
            // Supprimer le fichier CSS séparé
            delete bundle[cssFile]
          }
        }
      } as Plugin,
      // ✅ Plugin pour stats build corrigé
      createBuildStatsPlugin()
    ],

    // ✅ CONFIGURATION BUILD POUR WIDGET EMBEDDABLE OPTIMISÉ
    build: {
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        name: 'ChatSeller',
        formats: ['iife'], // Format IIFE pour embeddage direct
        fileName: () => 'chatseller-widget.js'
      },

      rollupOptions: {
        external: [], // Pas de dépendances externes pour autonomie complète
        output: {
          format: 'iife',
          name: 'ChatSeller',
          inlineDynamicImports: true,
          
          // Bannière d'identification avec version
          banner: `/*! 
 * ChatSeller Widget v1.0.0 - Modern 450px Interface
 * Agent IA Commercial pour E-commerce 
 * Shopify, WooCommerce, Sites Custom Ready
 * © ${new Date().getFullYear()} ChatSeller - https://chatseller.app
 */`,
          
          // CSS inline pour performance
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith('.css')) {
              return 'chatseller-widget.css'
            }
            return '[name].[ext]'
          },
          
          // Optimisations pour sites e-commerce
          globals: {
            // Pas de globals - widget 100% autonome
          }
        },
        
        // ✅ Tree-shaking optimisé
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      // Support navigateurs e-commerce (incluant anciens)
      target: ['es2017', 'chrome64', 'firefox62', 'safari12', 'edge79'],
      
      // Minification agressive en production
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: false, // Garder console.log pour debug
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace'],
          reduce_vars: true,
          unused: true,
          collapse_vars: true,
          inline: 2
        },
        mangle: {
          reserved: [
            'ChatSeller', 'init', 'destroy', 'show', 'hide', 'track',
            'sendMessage', 'openChat', 'closeChat', 'getDebugInfo'
          ],
          properties: {
            regex: /^_/
          }
        },
        format: {
          comments: false
        }
      } : undefined,

      // CSS inline pour éviter FOUC et conflits
      cssCodeSplit: false,
      sourcemap: !isProduction ? 'inline' : false,
      
      // Optimisation taille pour performance
      chunkSizeWarningLimit: 150, // 150KB max recommandé
      
      // Répertoire de sortie
      outDir: 'dist',
      emptyOutDir: true,
      
      // Assets
      assetsInlineLimit: 4096 // Inline assets < 4KB
    },

    // ✅ CSS AVEC ISOLATION ET OPTIMISATIONS
    css: {
      postcss: {
        plugins: [
          // Autoprefixer pour compatibilité maximale
          require('autoprefixer')({
            overrideBrowserslist: [
              '> 0.5%',
              'last 3 versions',
              'not dead',
              'not IE 11'
            ]
          }),
          // CSS Nano pour minification
          ...(isProduction ? [
            require('cssnano')({
              preset: ['default', {
                discardComments: {
                  removeAll: true
                },
                normalizeWhitespace: true,
                minifySelectors: true
              }]
            })
          ] : [])
        ]
      },
      
      // Préprocesseur pour variables
      preprocessorOptions: {
        scss: {
          additionalData: `
            $primary-color: var(--cs-primary-color, #007AFF);
            $widget-width: 450px;
            $widget-height: 650px;
            $border-radius: 12px;
            $shadow-level-1: 0 2px 8px rgba(0, 0, 0, 0.1);
            $shadow-level-2: 0 8px 25px rgba(0, 0, 0, 0.15);
            $shadow-level-3: 0 25px 50px rgba(0, 0, 0, 0.25);
          `
        }
      }
    },

    // ✅ SERVEUR DÉVELOPPEMENT OPTIMISÉ
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      },
      
      // Proxy pour l'API avec retry
      proxy: {
        '/api': {
          target: 'https://chatseller-api-production.up.railway.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          timeout: 30000
        }
      },
      
      // Headers de sécurité pour développement
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    },

    // ✅ PREVIEW SERVER POUR TESTS
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true
    },

    // ✅ RÉSOLUTION MODULES
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@styles': resolve(__dirname, 'src/styles')
      },
      
      // Extensions supportées
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },

    // ✅ VARIABLES D'ENVIRONNEMENT
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: !isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.WIDGET_VERSION': JSON.stringify('1.0.0'),
      'process.env.WIDGET_WIDTH': JSON.stringify('450px'),
      'process.env.API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://chatseller-api-production.up.railway.app'
      ),
      'process.env.CDN_URL': JSON.stringify(
        process.env.VITE_CDN_URL || 'https://cdn.chatseller.app'
      )
    },

    // ✅ OPTIMISATION DEPS
    optimizeDeps: {
      include: ['vue', 'uuid'],
      exclude: [],
      esbuildOptions: {
        target: 'es2017',
        supported: {
          'dynamic-import': true
        }
      }
    },

    // ✅ CONFIGURATION SPÉCIALE POUR PRODUCTION
    ...(isProduction && {
      esbuild: {
        drop: ['debugger'],
        legalComments: 'none'
      }
    }),

    // ✅ WORKER ET WEB WORKERS (pour futures fonctionnalités IA)
    worker: {
      format: 'iife',
      plugins: () => []
    }
  }
})

// ✅ PLUGIN PERSONNALISÉ POUR STATS BUILD - CORRIGÉ
function createBuildStatsPlugin(): Plugin {
  return {
    name: 'build-stats',
    writeBundle(options, bundle) {
      const stats: BuildStats = {
        timestamp: new Date().toISOString(),
        files: {},
        totalSize: 0,
        totalSizeFormatted: ''
      }

      Object.entries(bundle).forEach(([fileName, bundleItem]) => {
        if (bundleItem) {
          let size = 0
          
          if (bundleItem.type === 'chunk') {
            const chunk = bundleItem as BuildChunk
            size = chunk.code.length
          } else if (bundleItem.type === 'asset') {
            const asset = bundleItem as BuildAsset
            size = typeof asset.source === 'string' ? asset.source.length : asset.source.byteLength
          }
          
          if (size > 0) {
            stats.files[fileName] = {
              size: size,
              sizeFormatted: `${(size / 1024).toFixed(2)}KB`
            }
            stats.totalSize += size
          }
        }
      })

      stats.totalSizeFormatted = `${(stats.totalSize / 1024).toFixed(2)}KB`

      console.log('\n📊 Build Statistics:')
      console.log(`📦 Total Size: ${stats.totalSizeFormatted}`)
      console.log('📄 Files:')
      Object.entries(stats.files).forEach(([name, fileInfo]) => {
        console.log(`   ${name}: ${fileInfo.sizeFormatted}`)
      })

      // Vérifier la taille limite
      if (stats.totalSize > 200 * 1024) { // 200KB limite
        console.warn('⚠️  Warning: Widget size exceeds 200KB recommendation')
      } else {
        console.log('✅ Widget size within recommended limits')
      }
    }
  }
}