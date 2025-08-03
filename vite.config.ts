// vite.config.ts - CONFIGURATION CORRIGÉE POUR WIDGET + PAGE D'ACCUEIL
import { defineConfig, type UserConfig, type ConfigEnv, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { writeFileSync, mkdirSync } from 'fs'

export default defineConfig(({ mode }: ConfigEnv): UserConfig => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      vue(),
      // ✅ PLUGIN POUR GÉNÉRER INDEX.HTML AUTOMATIQUEMENT
      {
        name: 'generate-widget-homepage',
        writeBundle() {
          if (isProduction) {
            // Créer la page d'accueil du widget
            const homepageHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ChatSeller Widget - Agent IA Commercial</title>
  <meta name="description" content="Widget d'Agent IA Commercial pour e-commerce. Intégrez un vendeur IA sur votre boutique Shopify, WooCommerce ou site personnalisé.">
  <link rel="canonical" href="https://widget.chatseller.app">
  
  <!-- Open Graph -->
  <meta property="og:title" content="ChatSeller Widget - Agent IA Commercial">
  <meta property="og:description" content="Transformez votre page produit en vendeur IA">
  <meta property="og:url" content="https://widget.chatseller.app">
  <meta property="og:type" content="website">
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .container { 
      text-align: center; 
      max-width: 800px; 
      padding: 2rem;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .logo { 
      font-size: 3rem; 
      margin-bottom: 1rem;
      background: linear-gradient(45deg, #FFD700, #FFA500);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    h1 { 
      font-size: 2.5rem; 
      margin-bottom: 1rem; 
      font-weight: 800;
    }
    .subtitle { 
      font-size: 1.2rem; 
      opacity: 0.9; 
      margin-bottom: 2rem; 
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .feature {
      padding: 1rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .feature-icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .feature-title { font-weight: 600; margin-bottom: 0.5rem; }
    .feature-desc { font-size: 0.9rem; opacity: 0.8; }
    .stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin: 2rem 0;
      flex-wrap: wrap;
    }
    .stat { text-align: center; }
    .stat-number { 
      font-size: 2rem; 
      font-weight: 800; 
      color: #FFD700;
    }
    .stat-label { font-size: 0.9rem; opacity: 0.8; }
    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 2rem;
    }
    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(45deg, #007AFF, #0051D5);
      color: white;
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }
    .integration-code {
      background: rgba(0, 0, 0, 0.3);
      border-radius: 8px;
      padding: 1rem;
      margin: 2rem 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.8rem;
      text-align: left;
      overflow-x: auto;
    }
    .footer {
      margin-top: 3rem;
      opacity: 0.7;
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      .container { margin: 1rem; padding: 1.5rem; }
      h1 { font-size: 2rem; }
      .features { grid-template-columns: 1fr; }
      .stats { flex-direction: column; gap: 1rem; }
      .cta-buttons { flex-direction: column; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🤖</div>
    <h1>ChatSeller Widget</h1>
    <p class="subtitle">Agent IA Commercial pour E-commerce</p>
    
    <div class="features">
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div class="feature-title">Conversion Expert</div>
        <div class="feature-desc">Transforme les visiteurs en clients</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🛍️</div>
        <div class="feature-title">Conseiller Produit</div>
        <div class="feature-desc">Répond aux questions et guide l'achat</div>
      </div>
      <div class="feature">
        <div class="feature-icon">💬</div>
        <div class="feature-title">Chat Intelligent</div>
        <div class="feature-desc">Collecte les commandes dans la conversation</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📱</div>
        <div class="feature-title">100% Responsive</div>
        <div class="feature-desc">Optimisé mobile et desktop</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-number">450px</div>
        <div class="stat-label">Interface Moderne</div>
      </div>
      <div class="stat">
        <div class="stat-number">&lt;50kb</div>
        <div class="stat-label">Ultra Léger</div>
      </div>
      <div class="stat">
        <div class="stat-number">+30%</div>
        <div class="stat-label">Taux Conversion</div>
      </div>
    </div>

    <div class="cta-buttons">
      <a href="https://dashboard.chatseller.app" class="btn btn-primary">
        🚀 Créer mon Agent IA
      </a>
      <a href="https://docs.chatseller.app" class="btn btn-secondary">
        📖 Documentation
      </a>
    </div>

    <div class="integration-code">
&lt;script&gt;
(function() {
  var script = document.createElement('script');
  script.src = 'https://widget.chatseller.app/widget.js';
  script.setAttribute('data-shop-id', 'YOUR_SHOP_ID');
  document.head.appendChild(script);
})();
&lt;/script&gt;
    </div>

    <div class="footer">
      <p>
        <strong>ChatSeller Widget v1.0.0</strong><br>
        Compatible: Shopify • WooCommerce • WordPress • Sites Personnalisés<br>
        <a href="https://chatseller.app" style="color: #FFD700;">chatseller.app</a>
      </p>
    </div>
  </div>

  <!-- Analytics -->
  <script>
    console.log('🤖 ChatSeller Widget Homepage loaded');
    console.log('📊 Endpoint: https://widget.chatseller.app/widget.js');
    console.log('📖 Docs: https://docs.chatseller.app');
    
    // Track homepage visit
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_view', {
        page_title: 'Widget Homepage',
        page_location: window.location.href
      });
    }
  </script>
</body>
</html>`

            // Écrire le fichier dans dist/
            try {
              mkdirSync('dist', { recursive: true })
              writeFileSync('dist/index.html', homepageHtml)
              console.log('✅ Page d\'accueil Widget générée: dist/index.html')
            } catch (error) {
              console.error('❌ Erreur génération homepage:', error)
            }
          }
        }
      } as Plugin,
      
      // Plugin pour optimisation widget
      {
        name: 'chatseller-widget-optimizer',
        generateBundle(options, bundle) {
          if (isProduction) {
            console.log('📦 ChatSeller Widget 450px généré avec succès!')
            console.log('📊 Statistiques:')
            
            Object.keys(bundle).forEach(fileName => {
              const file = bundle[fileName]
              if (file && file.type === 'chunk') {
                const chunk = file as any
                console.log(`   ${fileName}: ${(chunk.code.length / 1024).toFixed(2)}KB`)
              }
            })
          }
        }
      } as Plugin
    ],

    // ✅ BUILD CONFIGURATION - DUAL MODE
    build: {
      // Construire à la fois le widget ET la homepage
      rollupOptions: {
        input: {
          // Widget principal
          widget: resolve(__dirname, 'src/embed.ts'),
          // Page d'accueil (optionnel si on utilise le plugin)
        },
        output: [
          // Build principal du widget
          {
            format: 'iife',
            name: 'ChatSeller',
            entryFileNames: 'chatseller-widget.js',
            inlineDynamicImports: true,
            banner: `/*! ChatSeller Widget v1.0.0 - Modern 450px Interface */`
          }
        ],
        external: [],
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      target: ['es2017', 'chrome64', 'firefox62', 'safari12', 'edge79'],
      minify: isProduction ? 'terser' : false,
      terserOptions: isProduction ? {
        compress: {
          drop_console: false, // Garder pour debug
          drop_debugger: true,
          pure_funcs: ['console.debug', 'console.trace']
        },
        mangle: {
          reserved: ['ChatSeller', 'init', 'destroy', 'show', 'hide', 'track']
        }
      } : undefined,

      cssCodeSplit: false,
      sourcemap: !isProduction ? 'inline' : false,
      chunkSizeWarningLimit: 150,
      outDir: 'dist',
      emptyOutDir: true,
      assetsInlineLimit: 4096
    },

    // ✅ CSS CONFIGURATION
    css: {
      postcss: {
        plugins: [
          require('autoprefixer')({
            overrideBrowserslist: [
              '> 0.5%',
              'last 3 versions',
              'not dead',
              'not IE 11'
            ]
          }),
          ...(isProduction ? [
            require('cssnano')({
              preset: ['default', {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                minifySelectors: true
              }]
            })
          ] : [])
        ]
      }
    },

    // ✅ SERVEUR DÉVELOPPEMENT
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
      proxy: {
        '/api': {
          target: 'https://chatseller-api-production.up.railway.app',
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          timeout: 30000
        }
      }
    },

    // ✅ PREVIEW SERVER
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
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
    },

    // ✅ VARIABLES D'ENVIRONNEMENT
    define: {
      __VUE_OPTIONS_API__: false,
      __VUE_PROD_DEVTOOLS__: !isProduction,
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
        target: 'es2017',
        supported: { 'dynamic-import': true }
      }
    }
  }
})