// vite.config.ts - CORRECTION ERREURS TYPESCRIPT
import { defineConfig, type UserConfig, type ConfigEnv, type Plugin } from 'vite'
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
            // ✅ OPTIMISATION VUE POUR PERFORMANCE
            isCustomElement: (tag) => tag.startsWith('cs-')
          }
        }
      }),
      
      // ✅ PLUGIN PERFORMANCE MONITORING
      {
        name: 'performance-monitor',
        buildStart() {
          if (isProduction) {
            console.time('⚡ Build ChatSeller Widget')
          }
        },
        buildEnd() {
          if (isProduction) {
            console.timeEnd('⚡ Build ChatSeller Widget')
          }
        },
        generateBundle(options, bundle) {
          if (isProduction) {
            console.log('\n📊 Widget Bundle Analysis:')
            
            let totalSize = 0
            Object.keys(bundle).forEach(fileName => {
              const file = bundle[fileName]
              if (file && file.type === 'chunk') {
                const chunk = file as any
                const size = chunk.code.length
                totalSize += size
                const sizeKB = (size / 1024).toFixed(2)
                
                console.log(`   📦 ${fileName}: ${sizeKB}KB`)
                
                // ✅ AVERTISSEMENT SI TROP GROS
                if (size > 200 * 1024) { // 200KB
                  console.warn(`⚠️  ${fileName} dépasse 200KB (${sizeKB}KB)`)
                }
              }
            })
            
            const totalKB = (totalSize / 1024).toFixed(2)
            console.log(`\n✅ Total Widget: ${totalKB}KB`)
            
            if (totalSize > 250 * 1024) { // 250KB
              console.error(`❌ Bundle trop volumineux: ${totalKB}KB > 250KB`)
              process.exit(1)
            }
          }
        }
      } as Plugin,
      
      // ✅ PLUGIN GÉNÉRATION HOMEPAGE
      {
        name: 'generate-widget-homepage',
        writeBundle() {
          if (isProduction) {
            const homepageHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatSeller Widget - Agent IA Commercial 450px</title>
  <meta name="description" content="Widget d'Agent IA Commercial pour e-commerce. Interface moderne 450px, optimisé performance < 3s.">
  <link rel="canonical" href="https://widget.chatseller.app">
  
  <!-- Performance Hints -->
  <link rel="preconnect" href="https://chatseller-api-production.up.railway.app">
  <link rel="dns-prefetch" href="https://chatseller-api-production.up.railway.app">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      color: white;
    }
    .container { 
      text-align: center; max-width: 900px; padding: 2rem;
      background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px);
      border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .logo { font-size: 4rem; margin-bottom: 1rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 800; }
    .subtitle { font-size: 1.3rem; opacity: 0.9; margin-bottom: 2rem; }
    
    .metrics {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem; margin: 2rem 0;
    }
    .metric {
      padding: 1.5rem; background: rgba(255, 255, 255, 0.15);
      border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .metric-value { 
      font-size: 2.5rem; font-weight: 800; color: #FFD700;
      display: block; margin-bottom: 0.5rem;
    }
    .metric-label { font-size: 0.9rem; opacity: 0.8; }
    
    .features {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem; margin: 3rem 0;
    }
    .feature {
      padding: 1.5rem; background: rgba(255, 255, 255, 0.1);
      border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.1);
      text-align: left;
    }
    .feature-icon { font-size: 2.5rem; margin-bottom: 1rem; }
    .feature-title { font-weight: 700; margin-bottom: 0.5rem; font-size: 1.1rem; }
    .feature-desc { font-size: 0.95rem; opacity: 0.8; line-height: 1.6; }
    
    .cta-buttons {
      display: flex; gap: 1rem; justify-content: center;
      flex-wrap: wrap; margin-top: 1.5rem;
    }
    .btn {
      padding: 1rem 2rem; border: none; border-radius: 12px;
      font-weight: 600; text-decoration: none; transition: all 0.3s;
      cursor: pointer; font-size: 1rem;
    }
    .btn-primary {
      background: linear-gradient(45deg, #007AFF, #0051D5);
      color: white; box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2); color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
    }
    
    @media (max-width: 768px) {
      .container { margin: 1rem; padding: 1.5rem; }
      h1 { font-size: 2.2rem; }
      .metrics { grid-template-columns: repeat(2, 1fr); }
      .features { grid-template-columns: 1fr; }
      .cta-buttons { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🚀</div>
    <h1>ChatSeller Widget</h1>
    <p class="subtitle">Agent IA Commercial 450px • Performance Optimisée</p>
    
    <div class="metrics">
      <div class="metric">
        <span class="metric-value">450px</span>
        <div class="metric-label">Interface Moderne</div>
      </div>
      <div class="metric">
        <span class="metric-value">&lt;3s</span>
        <div class="metric-label">Temps Chargement</div>
      </div>
      <div class="metric">
        <span class="metric-value">&lt;200kb</span>
        <div class="metric-label">Bundle Optimisé</div>
      </div>
      <div class="metric">
        <span class="metric-value">+30%</span>
        <div class="metric-label">Conversion</div>
      </div>
    </div>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">⚡</div>
        <div class="feature-title">Performance Optimisée</div>
        <div class="feature-desc">Chargement asynchrone, lazy loading, bundle < 200KB.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div class="feature-title">Conversion Expert</div>
        <div class="feature-desc">IA spécialisée vente avec collecte de commandes.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📱</div>
        <div class="feature-title">Responsive Mobile</div>
        <div class="feature-desc">Interface 450px desktop, plein écran mobile.</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🔧</div>
        <div class="feature-title">Intégration Simple</div>
        <div class="feature-desc">Une ligne de code, compatible tous sites.</div>
      </div>
    </div>

    <div class="cta-buttons">
      <a href="https://dashboard.chatseller.app" class="btn btn-primary">
        🤖 Créer mon Agent IA
      </a>
      <a href="https://docs.chatseller.app" class="btn btn-secondary">
        📖 Documentation
      </a>
    </div>
  </div>
</body>
</html>`

            try {
              mkdirSync('dist', { recursive: true })
              writeFileSync('dist/index.html', homepageHtml)
              console.log('✅ Homepage Widget générée avec métriques performance')
            } catch (error) {
              console.error('❌ Erreur génération homepage:', error)
            }
          }
        }
      } as Plugin
    ],

    // ✅ BUILD OPTIMISÉ POUR PERFORMANCE
    build: {
      target: ['es2018', 'chrome67', 'firefox62', 'safari12', 'edge79'],
      
      rollupOptions: {
        input: {
          widget: resolve(__dirname, 'src/embed.ts')
        },
        output: {
          format: 'iife',
          name: 'ChatSeller',
          entryFileNames: 'chatseller-widget.js',
          
          // ✅ POUR IIFE, ON DOIT DÉSACTIVER LE CODE SPLITTING
          inlineDynamicImports: true, // ✅ CHANGÉ À true
          // ✅ SUPPRIMÉ manualChunks (incompatible avec IIFE)
          
          banner: `/*! ChatSeller Widget v1.0.0 - Performance Optimized < 3s */`
        },
        
        external: [],
        
        // ✅ TREE SHAKING OPTIMISÉ
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false,
          tryCatchDeoptimization: false
        }
      },

      // ✅ MINIFICATION OPTIMISÉE
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: false, // Garder console.log pour debug
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace'],
          passes: 2,
          unsafe_arrows: true,
          unsafe_methods: true,
          hoist_funs: true,
          hoist_vars: true
        },
        mangle: {
          reserved: ['ChatSeller', 'init', 'destroy', 'show', 'hide', 'track'],
          properties: false
        },
        format: {
          comments: false
        }
      } : undefined,

      // ✅ OPTIMISATIONS GÉNÉRALES
      cssCodeSplit: false, // ✅ DÉSACTIVÉ pour IIFE (CSS inline)
      sourcemap: !isProduction ? 'inline' : false,
      chunkSizeWarningLimit: 300, // 300KB max (bundle unique)
      reportCompressedSize: isProduction,
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 8192,
      
      copyPublicDir: false,
      write: true
    },

    // ✅ CSS OPTIMISÉ
    css: {
      devSourcemap: !isProduction,
      postcss: {
        plugins: [
          require('autoprefixer')({
            overrideBrowserslist: [
              '> 1%',
              'last 2 versions',
              'not dead',
              'not IE 11'
            ]
          }),
          ...(isProduction ? [
            require('cssnano')({
              preset: ['default', {  // ✅ CHANGÉ DE 'advanced' → 'default'
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                minifySelectors: true,
                // ✅ SUPPRIMÉ LES OPTIONS AVANCÉES QUI CAUSENT L'ERREUR
                colormin: true,
                convertValues: true
              }]
            })
          ] : [])
        ]
      }
    },

    // ✅ SERVEUR DÉVELOPPEMENT OPTIMISÉ - CORRECTION ERREUR 1
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      open: false, // Pas d'ouverture auto pour performance
      
      hmr: {
        overlay: true,
        clientPort: 3000
      },
      
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
      },
      
      proxy: {
        '/api': {
          target: 'https://chatseller-api-production.up.railway.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          timeout: 10000 // 10s timeout
        }
      },
      
      // ✅ CACHE OPTIMISÉ
      fs: {
        strict: false,
        allow: ['..']
      }
    },

    // ✅ PREVIEW OPTIMISÉ
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        'Cache-Control': 'public, max-age=31536000', // 1 an cache
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    },

    // ✅ RÉSOLUTION OPTIMISÉE
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@styles': resolve(__dirname, 'src/styles')
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      
      // ✅ OPTIMISATIONS RÉSOLUTION
      dedupe: ['vue'],
      preserveSymlinks: false
    },

    // ✅ VARIABLES D'ENVIRONNEMENT
    define: {
      __VUE_OPTIONS_API__: false, // Désactiver Options API pour performance
      __VUE_PROD_DEVTOOLS__: !isProduction,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.WIDGET_VERSION': JSON.stringify('1.0.0'),
      'process.env.API_URL': JSON.stringify(
        process.env.VITE_API_URL || 'https://chatseller-api-production.up.railway.app'
      )
    },

    // ✅ OPTIMISATION DEPS
    optimizeDeps: {
      include: ['vue', 'uuid'],
      exclude: [],
      
      esbuildOptions: {
        target: 'es2018',
        supported: { 
          'dynamic-import': true,
          'import-meta': true
        },
        drop: isProduction ? ['console', 'debugger'] : [],
        
        // ✅ OPTIMISATIONS ESBUILD
        treeShaking: true,
        minifyIdentifiers: isProduction,
        minifySyntax: isProduction,
        minifyWhitespace: isProduction
      }
    },

    // ✅ CONFIGURATION WORKER - CORRECTION ERREUR 2
    worker: {
      format: 'es'
      // ✅ SUPPRESSION DE LA LIGNE plugins: [] QUI CAUSAIT L'ERREUR
    }
  }
})