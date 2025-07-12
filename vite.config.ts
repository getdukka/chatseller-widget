import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const isLibrary = mode === 'library'
  
  return {
    plugins: [vue()],
    
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    
    build: isLibrary ? {
      // Build as embeddable library
      lib: {
        entry: resolve(__dirname, 'src/embed.ts'),
        name: 'ChatSeller',
        fileName: (format) => `chatseller.${format}.js`,
        formats: ['umd', 'es']
      },
      rollupOptions: {
        // Externalize deps that shouldn't be bundled
        external: [],
        output: {
          globals: {}
        }
      },
      // Configuration minification pour Vercel
      cssCodeSplit: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        },
        mangle: true
      },
      // Optimisation bundle
      target: 'es2015',
      sourcemap: false
    } : {
      // Development build
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    },
    
    server: {
      port: 5173,
      host: true
    },
    
    css: {
      postcss: {
        plugins: [
          require('tailwindcss'),
          require('autoprefixer'),
        ],
      },
    }
  }
})