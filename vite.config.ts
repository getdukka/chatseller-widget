// vite.config.ts 
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  const isProduction = command === 'build'
  
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

    build: isProduction ? {
      target: ['es2020', 'chrome60', 'firefox60', 'safari11'],
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        formats: ['iife'],
        name: 'ChatSellerWidget',
        fileName: 'embed'
      },
      rollupOptions: {
        output: {
          format: 'iife',
          entryFileNames: 'embed.js',
          inlineDynamicImports: true,
          extend: true,
        },
        external: []
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: true
        },
        mangle: {
          reserved: ['ChatSeller', 'Vue', 'createApp']
        }
      },
      sourcemap: false,
      outDir: 'dist',
      emptyOutDir: true,
      // ✅ FORCER L'INLINE CSS - PARAMÈTRES NATIFS VITE
      cssCodeSplit: false,
      assetsInlineLimit: 999999999
    } : {
      outDir: 'dist'
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      cors: true,
      open: '/index.html'
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
      __VUE_PROD_DEVTOOLS__: false,
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
      // ✅ AJOUT CRITIQUE : Définir process pour éviter l'erreur
      'process.env': JSON.stringify({}),
      'global': 'globalThis',
      'process': JSON.stringify({
        env: {
          NODE_ENV: isProduction ? 'production' : 'development'
        }
      })
    },

    optimizeDeps: {
      include: ['vue', 'uuid']
    },

    css: {
      modules: false
    }
  }
})