// vite.config.ts - CONFIGURATION CORRIGÉE POUR PRODUCTION
import { defineConfig, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig((): UserConfig => {
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

    // ✅ BUILD OPTIMISÉ POUR CDN
    build: {
      target: ['es2018', 'chrome67', 'firefox62', 'safari12', 'edge79'],
      
      rollupOptions: {
        input: {
          embed: resolve(__dirname, 'src/embed.ts')
        },
        output: {
          format: 'iife',
          name: 'ChatSeller',
          // ✅ GÉNÈRE EXACTEMENT embed.js
          entryFileNames: (chunkInfo) => {
            return chunkInfo.name === 'embed' ? 'embed.js' : '[name]-[hash].js'
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        },
        
        external: [],
        
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      // ✅ MINIFICATION POUR PRODUCTION
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false, // Garder console.log pour debug
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
      },

      sourcemap: false, // Pas de sourcemap en production
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 8192,
      reportCompressedSize: true
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    },

    // ✅ PREVIEW POUR TEST PRODUCTION
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000'
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
      __VUE_PROD_DEVTOOLS__: false,
      'process.env.NODE_ENV': '"production"',
      'process.env.WIDGET_VERSION': '"1.0.0"'
    },

    optimizeDeps: {
      include: ['vue', 'uuid'],
      esbuildOptions: {
        target: 'es2018'
      }
    }
  }
})