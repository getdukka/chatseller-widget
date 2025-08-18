// vite.config.ts - CONFIGURATION CORRIGÉE POUR WIDGET
import { defineConfig, type UserConfig, type ConfigEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('cs-')
          }
        }
      }),
      
      // ✅ PLUGIN POUR GÉNÉRER LES BONS FICHIERS
      {
        name: 'chatseller-widget-build',
        generateBundle(options, bundle) {
          if (isProduction) {
            console.log('🚀 Génération des fichiers ChatSeller Widget...')
            
            // Créer les alias pour embed.js
            Object.keys(bundle).forEach(fileName => {
              const file = bundle[fileName]
              if (file && file.type === 'chunk' && fileName.includes('embed')) {
                // Copier le fichier principal avec le nom embed.js
                const embedContent = file.code
                bundle['embed.js'] = {
                  ...file,
                  fileName: 'embed.js',
                  name: 'embed'
                }
                console.log('✅ Fichier embed.js généré')
              }
            })
          }
        }
      }
    ],

    // ✅ BUILD OPTIMISÉ POUR DISTRIBUTION
    build: {
      target: ['es2018', 'chrome67', 'firefox62', 'safari12', 'edge79'],
      
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
          chunkFileNames: '[name]-[hash].js',
          assetFileNames: '[name]-[hash][extname]',
          
          // ✅ VARIABLES GLOBALES POUR IIFE
          globals: {
            vue: 'Vue'
          }
        },
        
        external: [],
        
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: false,
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace'],
          passes: 2
        },
        mangle: {
          reserved: ['ChatSeller', 'init', 'destroy', 'show', 'hide', 'track']
        },
        format: {
          comments: false
        }
      } : undefined,

      sourcemap: !isProduction,
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 8192,
      reportCompressedSize: isProduction
    },

    // ✅ SERVER POUR DÉVELOPPEMENT
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=31536000'
      }
    },

    // ✅ PREVIEW POUR PRODUCTION
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000',
        'X-Content-Type-Options': 'nosniff'
      }
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components')
      }
    },

    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: !isProduction,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.WIDGET_VERSION': JSON.stringify('1.0.0')
    },

    optimizeDeps: {
      include: ['vue', 'uuid'],
      esbuildOptions: {
        target: 'es2018'
      }
    }
  }
})