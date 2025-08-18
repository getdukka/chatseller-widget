// src/embed.ts - WIDGET OPTIMISÉ POUR SHOPIFY ET PERFORMANCE - CORRIGÉ
export interface ChatSellerConfig {
  shopId: string
  apiUrl?: string
  productId?: string
  productName?: string
  productPrice?: number
  productUrl?: string
  theme?: 'modern' | 'minimal' | 'brand_adaptive'
  primaryColor?: string
  position?: 'auto' | 'above-cta' | 'below-cta' | 'beside-cta'
  buttonText?: string
  language?: 'fr' | 'en' | 'wo'
  autoDetectProduct?: boolean
  agentConfig?: any
  forceContainer?: string
  debug?: boolean
  disableFallback?: boolean // ✅ NOUVEAU: Empêcher fallback
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AgentConfig {
  id: string
  name: string
  title: string
  avatar?: string
  welcomeMessage: string
  fallbackMessage: string
  systemPrompt: string
  personality: string
  tone: string
  knowledgeBase: any[]
  isActive: boolean
}

interface ShopConfig {
  id: string
  shopId: string
  primaryColor: string
  buttonText: string
  position: string
  theme: string
  language: string
  agent?: AgentConfig
}

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private isInitialized = false
  private isOpen = false
  private messages: Message[] = []
  private modalElement: HTMLElement | null = null
  private shopConfig: ShopConfig | null = null
  private agentConfig: AgentConfig | null = null
  private conversationId: string | null = null
  
  private configPromise: Promise<void> | null = null
  private chatComponent: any = null
  private initAttempts = 0 // ✅ NOUVEAU: Compteur tentatives

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#25D366', // ✅ CHANGÉ: Couleur WhatsApp par défaut
      position: 'above-cta',
      buttonText: 'Parler à un conseiller',
      language: 'fr',
      autoDetectProduct: true,
      debug: false,
      disableFallback: false
    }
  }

  // ✅ INIT AMÉLIORÉ AVEC PROTECTION ANTI-DOUBLE
  async init(config: ChatSellerConfig) {
    this.initAttempts++
    
    if (this.isInitialized) {
      console.warn(`🟡 ChatSeller déjà initialisé (tentative ${this.initAttempts})`)
      return
    }

    console.log(`🚀 Initialisation ChatSeller widget (tentative ${this.initAttempts})...`, config.shopId)
    const startTime = performance.now()

    this.config = { ...this.config, ...config }

    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId requis')
      return
    }

    try {
      await this.waitForDOM()
      
      // ✅ NETTOYAGE PRÉVENTIF
      this.cleanupExistingWidgets()
      
      // ✅ ÉTAPE 1: Création widget immédiate avec config par défaut
      this.createWidget()
      
      // ✅ ÉTAPE 2: Détection produit améliorée pour Shopify
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      this.isInitialized = true
      
      // ✅ ÉTAPE 3: Chargement config API en arrière-plan
      this.loadShopConfigurationAsync()
      
      const initTime = performance.now() - startTime
      console.log(`✅ ChatSeller widget initialisé en ${initTime.toFixed(2)}ms`)
      
      this.track('widget_initialized', {
        shopId: this.config.shopId,
        initTime,
        productDetected: !!(this.config.productName || this.config.productId),
        platform: this.detectPlatform(),
        attempt: this.initAttempts
      })
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      
      // ✅ FALLBACK SEULEMENT SI AUTORISÉ
      if (!this.config.disableFallback) {
        this.createFallbackWidget()
      }
    }
  }

  // ✅ NOUVEAU: Nettoyage des widgets existants
  private cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-fallback',
      '[data-chatseller]',
      '.chatseller-widget',
      '.chatseller-button',
      '[id*="chatseller"]'
    ]
    
    let cleanedCount = 0
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        if (this.config.debug) {
          console.log('🗑️ Suppression widget existant:', selector)
        }
        el.remove()
        cleanedCount++
      })
    })
    
    if (cleanedCount > 0) {
      console.log(`🧹 ${cleanedCount} widget(s) existant(s) supprimé(s)`)
    }
  }

  // ✅ DÉTECTION DE PLATEFORME AMÉLIORÉE
  private detectPlatform(): string {
    // Shopify
    if ((window as any).Shopify || (window as any).ShopifyAnalytics || document.querySelector('script[src*="shopify"]')) {
      return 'shopify'
    }
    
    // WooCommerce
    if ((window as any).wc || document.querySelector('body.woocommerce') || document.querySelector('.woocommerce')) {
      return 'woocommerce'
    }
    
    // Wix
    if ((window as any).wixDeveloperAnalytics || document.querySelector('[data-wix-component]')) {
      return 'wix'
    }
    
    // Autres plateformes
    if (document.querySelector('[data-platform]')) {
      return document.querySelector('[data-platform]')?.getAttribute('data-platform') || 'unknown'
    }
    
    return 'custom'
  }

  // ✅ CHARGEMENT CONFIG ASYNCHRONE AMÉLIORÉ
  private async loadShopConfigurationAsync(): Promise<void> {
    if (this.configPromise) {
      return this.configPromise
    }

    this.configPromise = this.performConfigLoad()
    return this.configPromise
  }

  private async performConfigLoad(): Promise<void> {
    try {
      if (this.config.debug) {
        console.log('🔄 Chargement configuration shop (arrière-plan):', this.config.shopId)
      }
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // ✅ AUGMENTÉ À 8s
      
      const response = await fetch(`${this.config.apiUrl}/public/shops/${this.config.shopId}/agent`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        this.shopConfig = data.data.shop
        this.agentConfig = data.data.agent
        
        this.mergeApiConfiguration()
        this.updateWidgetWithConfig()
        
        if (this.config.debug) {
          console.log('✅ Configuration chargée en arrière-plan:', {
            shop: this.shopConfig?.id,
            agent: this.agentConfig?.name,
            primaryColor: this.config.primaryColor
          })
        }
      } else {
        throw new Error(data.error || 'Erreur configuration API')
      }
      
    } catch (error) {
      if (this.config.debug) {
        console.warn('⚠️ Configuration par défaut utilisée (API non disponible):', error)
      }
    }
  }

  private updateWidgetWithConfig(): void {
    if (!this.widgetElement || !this.shopConfig) return

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      const primaryColor = this.config.primaryColor || '#25D366'
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
      
      if (this.config.buttonText !== triggerBtn.textContent?.trim()) {
        const textSpan = triggerBtn.querySelector('span')
        if (textSpan) {
          textSpan.textContent = this.config.buttonText || 'Parler à un conseiller'
        }
      }
    }
  }

  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.primaryColor || this.config.primaryColor || '#25D366',
        buttonText: this.shopConfig.buttonText || this.config.buttonText || 'Parler à un conseiller',
        position: (this.shopConfig.position as ChatSellerConfig['position']) || this.config.position || 'above-cta',
        theme: (this.shopConfig.theme as ChatSellerConfig['theme']) || this.config.theme || 'modern',
        language: (this.shopConfig.language as ChatSellerConfig['language']) || this.config.language || 'fr'
      }
    }

    if (this.agentConfig) {
      this.config.agentConfig = {
        id: this.agentConfig.id,
        name: this.agentConfig.name,
        title: this.agentConfig.title,
        avatar: this.agentConfig.avatar,
        welcomeMessage: this.agentConfig.welcomeMessage,
        fallbackMessage: this.agentConfig.fallbackMessage,
        systemPrompt: this.agentConfig.systemPrompt,
        personality: this.agentConfig.personality,
        tone: this.agentConfig.tone,
        knowledgeBase: this.agentConfig.knowledgeBase || []
      }
    }
  }

  // ✅ DÉTECTION PRODUIT ULTRA-AMÉLIORÉE POUR SHOPIFY
  private detectProductInfo(): boolean {
    try {
      if (this.config.debug) {
        console.log('🔍 Détection produit Shopify améliorée...')
      }
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId
      let hasDetection = false

      // ✅ PRIORITÉ 1: Shopify Analytics (le plus fiable)
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString() || shopifyProduct.variant_id?.toString()
        hasDetection = true
        if (this.config.debug) {
          console.log('✅ Produit Shopify détecté via Analytics:', detectedName)
        }
      }
      
      // ✅ PRIORITÉ 2: Variables globales Shopify multiples
      else {
        const shopifyGlobals = [
          (window as any).meta?.product,
          (window as any).product,
          (window as any).theme?.settings?.product,
          (window as any).Shopify?.shop?.product
        ]
        
        for (const shopifyData of shopifyGlobals) {
          if (shopifyData && shopifyData.title) {
            detectedName = shopifyData.title
            detectedPrice = shopifyData.price ? (shopifyData.price / 100) : undefined
            detectedId = shopifyData.id?.toString()
            hasDetection = true
            if (this.config.debug) {
              console.log('✅ Produit Shopify détecté via variable globale')
            }
            break
          }
        }
      }
      
      // ✅ PRIORITÉ 3: Scripts JSON-LD Shopify
      if (!hasDetection) {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent || '')
            if (data['@type'] === 'Product' && data.name) {
              detectedName = data.name
              detectedPrice = data.offers?.price ? parseFloat(data.offers.price) : undefined
              detectedId = data.sku || data.productID
              hasDetection = true
              if (this.config.debug) {
                console.log('✅ Produit détecté via JSON-LD Shopify')
              }
              break
            }
          } catch (e) {
            continue
          }
        }
      }
      
      // ✅ PRIORITÉ 4: Sélecteurs CSS SHOPIFY-SPÉCIFIQUES étendus
      if (!hasDetection) {
        const shopifySelectors = {
          title: [
            // Shopify Dawn et variantes récentes
            '.product__title',
            '.product-form__title',
            '.product-meta__title',
            'h1.product-title',
            '[data-product-title]',
            '.h1.product__title',
            '.product-single-header h1',
            '.product__info h1',
            
            // Thèmes Shopify populaires
            '.product-single__title',        // Debut
            '.product-form__title',          // Dawn
            '.product__content h1',          // Venture
            '.product-details__title',       // Brooklyn
            '.product-form__info h1',        // Minimal
            '.product-detail__title',        // Boundless
            '.product-info h1',              // Simple
            '.product-title',                // Narrative
            '.rte h1',                       // Supply
            
            // Fallbacks génériques
            'h1[class*="product"]',
            '[class*="product-title"]',
            '[class*="product-name"]'
          ],
          price: [
            // Shopify spécifiques avancés
            '.price-item--sale .price',
            '.price__current',
            '.product-form__price .price',
            '.price-list .price-item:not(.price-item--compare)',
            '.money',
            '[data-price]',
            '.product-price .price__current',
            '.product__price .price',
            
            // Thèmes spécifiques
            '.product-form__price',          // Dawn
            '.product-price__price',         // Debut
            '.price-sale',                   // Venture
            '.product-single__price',        // Brooklyn
            '.price-current',                // Minimal
            '.product-price',                // Boundless
            '.price--on-sale',               // Simple
            '.product__price',               // Narrative
            
            // Fallbacks
            '[class*="price"]:not([class*="compare"])',
            '.cost',
            '[data-product-price]'
          ]
        }

        // Détection titre avec priorité Shopify
        for (const selector of shopifySelectors.title) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            hasDetection = true
            if (this.config.debug) {
              console.log('✅ Produit détecté via sélecteur Shopify CSS:', selector)
            }
            break
          }
        }
        
        // Détection prix avec priorité Shopify
        for (const selector of shopifySelectors.price) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            // Formats monétaires multiples: $19.99, 19,99 €, 1999, 19.99, etc.
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', '.'))
              if (this.config.debug) {
                console.log('✅ Prix détecté via sélecteur Shopify CSS:', selector, detectedPrice)
              }
              break
            }
          }
        }
      }

      // ✅ MISE À JOUR CONFIG AVEC FALLBACKS SÛRS
      if (detectedName && !this.config.productName) {
        this.config.productName = detectedName
      }
      if (detectedPrice && !this.config.productPrice) {
        this.config.productPrice = detectedPrice
      }
      if (detectedId && !this.config.productId) {
        this.config.productId = detectedId
      }
      
      // Détection URL et ID
      if (!this.config.productUrl) {
        this.config.productUrl = window.location.href
      }
      if (!this.config.productId && !detectedId) {
        this.config.productId = this.extractProductIdFromUrl()
      }

      if (hasDetection && (detectedName || detectedPrice)) {
        if (this.config.debug) {
          console.log('✅ Produit détecté avec succès:', {
            name: detectedName,
            price: detectedPrice,
            id: this.config.productId,
            url: this.config.productUrl,
            platform: this.detectPlatform()
          })
        }
      }

      return hasDetection && !!(detectedName || detectedPrice)

    } catch (error) {
      console.warn('⚠️ Erreur détection produit:', error)
      return false
    }
  }

  private extractProductIdFromUrl(): string {
    try {
      const url = window.location.href
      
      // ✅ SHOPIFY AMÉLIORÉ: /products/product-handle ou /products/product-handle?variant=123
      const shopifyMatch = url.match(/\/products\/([^/?#]+)/)
      if (shopifyMatch?.[1]) {
        const productHandle = shopifyMatch[1]
        // Vérifier s'il y a un variant ID
        const variantMatch = url.match(/variant=(\d+)/)
        return variantMatch?.[1] || productHandle
      }
      
      // WooCommerce: /?product_id=123 ou /product/product-name/
      const wooMatch = url.match(/product_id=(\d+)/) || url.match(/\/product\/([^/?#]+)/)
      if (wooMatch?.[1]) return wooMatch[1]
      
      // Generic: dernière partie du path
      try {
        const pathParts = new URL(url).pathname.split('/').filter(Boolean)
        return pathParts[pathParts.length - 1] || 'unknown'
      } catch {
        return 'unknown'
      }
    } catch (error) {
      console.warn('⚠️ Erreur extraction product ID:', error)
      return 'unknown'
    }
  }

  private async waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve())
      } else {
        resolve()
      }
    })
  }

  // ✅ CRÉATION WIDGET OPTIMISÉE POUR SHOPIFY
  private createWidget() {
    let container = document.getElementById('chatseller-widget')
    
    if (!container) {
      container = document.getElementById('chatseller-widget-container')
    }
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      container.style.cssText = 'margin: 8px 0; position: relative; z-index: 999999;'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  // ✅ INSERTION ULTRA-AMÉLIORÉE POUR SHOPIFY
  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // ✅ FONCTION DE RETRY AVEC TIMEOUT
    const tryInsertWidget = (attempt: number = 1, maxAttempts: number = 8): void => { // ✅ AUGMENTÉ À 8 TENTATIVES
      if (this.config.debug) {
        console.log(`🔍 ChatSeller: Tentative ${attempt}/${maxAttempts} - Recherche éléments Shopify...`)
      }

      // ✅ SÉLECTEURS SHOPIFY 2024 ULTRA-PRIORITAIRES
      const shopifyCtaSelectors = [
        // Dawn (thème par défaut Shopify 2024)
        '.product-form__buttons',
        '.product-form__cart',
        'form[action*="/cart/add"] .product-form__buttons',
        'form[action*="/cart/add"] button[type="submit"]',
        '.product-form button[name="add"]',
        '.product-form__add-button',
        '.product-form__cart-submit',
        
        // Debut et autres thèmes populaires
        '.btn.product-form__cart-submit',
        '.product-form__submit',
        '.product-single__cart-submit',
        '.product-single__cart',
        
        // Sélecteurs génériques Shopify
        '.shopify-payment-button',
        '.single_add_to_cart_button',
        '.btn-addtocart',
        '.add-to-cart',
        '[data-add-to-cart]',
        'button[name="add"]',
        '.btn[name="add"]',
        '.product-submit',
        '.add-to-cart-form button',
        
        // Fallbacks universels
        '#add-to-cart-btn',
        '#buy-now-btn',
        '.buy-now',
        '.purchase-btn'
      ]
      
      let targetElement = null
      let insertMethod: 'before' | 'after' | 'append' = 'before'
      
      // ✅ RECHERCHE PRIORITAIRE
      for (const selector of shopifyCtaSelectors) {
        targetElement = document.querySelector(selector)
        if (targetElement) {
          if (this.config.debug) {
            console.log(`✅ Élément CTA Shopify trouvé: ${selector}`)
          }
          break
        }
      }
      
      // ✅ FALLBACK 1: Recherche dans les formulaires Shopify
      if (!targetElement) {
        const productForm = document.querySelector('form[action*="/cart/add"]')
        if (productForm) {
          // Chercher le bouton submit dans ce formulaire
          const submitBtn = productForm.querySelector('button[type="submit"], input[type="submit"], .btn')
          targetElement = submitBtn || productForm
          insertMethod = submitBtn ? 'before' : 'append'
          if (this.config.debug) {
            console.log('✅ Formulaire Shopify trouvé')
          }
        }
      }
      
      // ✅ FALLBACK 2: Recherche par sections Shopify
      if (!targetElement) {
        const shopifySections = [
          '.product',
          '.product-single', 
          '.product-details',
          '.product__info',
          '.product-form',
          '.product-wrapper',
          '.product-content',
          'main[role="main"]',
          'main',
          '#main',
          '.main-content'
        ]
        
        for (const sectionSelector of shopifySections) {
          const section = document.querySelector(sectionSelector)
          if (section) {
            // Chercher un bouton dans cette section
            const button = section.querySelector('button[type="submit"], .btn, [class*="add"], [class*="cart"]')
            if (button) {
              targetElement = button
              insertMethod = 'before'
              if (this.config.debug) {
                console.log(`✅ Bouton trouvé dans section: ${sectionSelector}`)
              }
              break
            } else {
              targetElement = section
              insertMethod = 'append'
              if (this.config.debug) {
                console.log(`✅ Section trouvée: ${sectionSelector}`)
              }
              break
            }
          }
        }
      }
      
      // ✅ FALLBACK 3: Container forcé
      if (this.config.forceContainer && !targetElement) {
        const forcedContainer = document.querySelector(this.config.forceContainer)
        if (forcedContainer) {
          targetElement = forcedContainer
          insertMethod = 'append'
          if (this.config.debug) {
            console.log(`✅ Container forcé: ${this.config.forceContainer}`)
          }
        }
      }
      
      // ✅ LOGIQUE D'INSERTION
      if (targetElement) {
        try {
          switch (position) {
            case 'above-cta':
              insertMethod = 'before'
              break
            case 'below-cta':
              insertMethod = 'after'
              break
            case 'beside-cta':
              insertMethod = 'after'
              container.style.cssText += 'display: inline-block; margin-left: 1rem;'
              break
          }
          
          if (insertMethod === 'before') {
            targetElement.parentNode?.insertBefore(container, targetElement)
          } else if (insertMethod === 'after') {
            targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
          } else {
            targetElement.appendChild(container)
          }
          
          if (this.config.debug) {
            console.log(`✅ Widget ChatSeller inséré ${insertMethod} l'élément CTA`)
          }
          
          // Vérifier que le widget est visible
          setTimeout(() => {
            const widgetBtn = container.querySelector('#chatseller-trigger-btn')
            if (widgetBtn && (widgetBtn as HTMLElement).offsetParent === null) {
              console.warn('⚠️ Widget inséré mais non visible, tentative de correction...')
              container.style.cssText += 'display: block !important; visibility: visible !important; position: relative !important;'
            }
          }, 200)
          
          return // Succès, arrêter les tentatives
          
        } catch (error) {
          console.warn(`⚠️ Erreur insertion tentative ${attempt}:`, error)
        }
      }
      
      // ✅ RETRY LOGIC
      if (attempt < maxAttempts) {
        setTimeout(() => {
          tryInsertWidget(attempt + 1, maxAttempts)
        }, 1500 * attempt) // Délai progressif plus long
      } else {
        // ✅ DERNIER FALLBACK: Seulement si pas disableFallback
        if (!this.config.disableFallback) {
          if (this.config.debug) {
            console.log('⚠️ Aucun élément CTA trouvé, insertion body avec position adaptée')
          }
          
          // Créer un container avec position fixe pour Shopify
          container.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            right: 20px !important;
            z-index: 999999 !important;
            max-width: 280px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
          `
          
          document.body.appendChild(container)
        }
        
        if (this.config.debug) {
          this.logShopifyDiagnostic()
        }
      }
    }
    
    // Commencer les tentatives d'insertion
    tryInsertWidget()
  }

  // ✅ DIAGNOSTIC SHOPIFY DÉTAILLÉ
  private logShopifyDiagnostic(): void {
    console.log('🔍 ChatSeller DIAGNOSTIC SHOPIFY:')
    console.log('  - URL:', window.location.href)
    console.log('  - Shopify détecté:', !!(window as any).Shopify)
    console.log('  - ShopifyAnalytics:', !!(window as any).ShopifyAnalytics)
    console.log('  - Formulaires cart:', document.querySelectorAll('form[action*="/cart/add"]').length)
    console.log('  - Boutons submit:', document.querySelectorAll('button[type="submit"]').length)
    console.log('  - Elements product:', document.querySelectorAll('[class*="product"]').length)
    console.log('  - Theme liquid détecté:', !!document.querySelector('script[src*="shopify"]'))
    
    // Lister les 10 premiers boutons trouvés
    const buttons = Array.from(document.querySelectorAll('button, .btn, [class*="add"], [class*="cart"]')).slice(0, 10)
    console.log('  - Boutons trouvés:', buttons.map(btn => ({
      tag: btn.tagName,
      class: btn.className,
      text: btn.textContent?.trim().substring(0, 50)
    })))
  }

  // ✅ RENDU WIDGET OPTIMISÉ SHOPIFY
  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à un conseiller'
    const primaryColor = this.config.primaryColor || '#25D366'

    this.widgetElement.innerHTML = `
      <div style="width: 100%; margin: 8px 0; position: relative; z-index: 999999;">
        <button 
          id="chatseller-trigger-btn"
          style="
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            outline: none;
            text-decoration: none;
            box-sizing: border-box;
            transform: translateY(0);
          "
          onmouseover="this.style.opacity='0.95'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0, 0, 0, 0.25)'"
          onmouseout="this.style.opacity='1'; this.style.transform='translateY(0px)'; this.style.boxShadow='0 8px 25px rgba(0, 0, 0, 0.15)'"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
          <span>${buttonText}</span>
        </button>
      </div>
    `

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      // ✅ ÉVÉNEMENT CLICK SÉCURISÉ
      triggerBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.openChat()
      })

      // ✅ ÉVÉNEMENT TOUCH POUR MOBILE
      triggerBtn.addEventListener('touchend', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.openChat()
      })
    }

    if (this.config.debug) {
      console.log('✅ Widget ChatSeller rendu avec succès sur Shopify')
    }
  }

  private adjustColor(color: string, percent: number): string {
    try {
      const hex = color.replace('#', '')
      if (hex.length !== 6) return color
      
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      const adjust = (channel: number) => {
        const adjusted = channel + (channel * percent / 100)
        return Math.max(0, Math.min(255, Math.round(adjusted)))
      }
      
      const newR = adjust(r)
      const newG = adjust(g)
      const newB = adjust(b)
      
      return `rgb(${newR}, ${newG}, ${newB})`
    } catch (error) {
      console.warn('⚠️ Erreur ajustement couleur:', error)
      return color
    }
  }

  // ✅ OUVERTURE CHAT AVEC LAZY LOADING ET MESSAGE D'ACCUEIL
  private async openChat() {
    if (this.isOpen) return

    this.isOpen = true
    
    // ✅ CHARGER LE COMPOSANT VUE DE FAÇON LAZY
    if (!this.chatComponent) {
      try {
        const { createApp } = await import('vue')
        const ChatSellerWidget = (await import('./ChatSellerWidget.vue')).default
        
        this.chatComponent = createApp(ChatSellerWidget, {
          config: this.config
        })
      } catch (error) {
        console.error('❌ Erreur chargement composant Vue:', error)
        this.createSimpleChatModal()
        return
      }
    }
    
    this.createChatModal()
    
    if (this.config.debug) {
      console.log('💬 Chat ouvert avec composant Vue WhatsApp')
    }
  }

  // ✅ MODAL SIMPLE EN CAS D'ÉCHEC LAZY LOADING - AMÉLIORÉE
  private createSimpleChatModal() {
    if (this.modalElement) {
      this.modalElement.remove()
    }

    const agentName = this.config.agentConfig?.name || 'Assistant'
    const primaryColor = this.config.primaryColor || '#25D366'

    this.modalElement = document.createElement('div')
    this.modalElement.innerHTML = `
      <div id="chatseller-modal-overlay" style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
        z-index: 2147483647; display: flex; align-items: center;
        justify-content: center; padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 480px; height: 700px; max-height: 90vh;
          background: #f0f0f0; border-radius: 16px;
          box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
          display: flex; flex-direction: column; overflow: hidden;
        ">
          <div style="
            padding: 16px 20px; background: #075e54; color: white;
            display: flex; align-items: center; justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 44px; height: 44px; border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex; align-items: center; justify-content: center;
                font-weight: 600; font-size: 18px; position: relative;
              ">
                ${agentName.charAt(0).toUpperCase()}
                <div style="position: absolute; bottom: 0; right: 0; width: 14px; height: 14px; background: #25d366; border: 2px solid white; border-radius: 50%;"></div>
              </div>
              <div>
                <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${agentName}</h3>
                <p style="margin: 2px 0 0 0; font-size: 13px; opacity: 0.9;">En ligne • Assistant Commercial</p>
              </div>
            </div>
            <button id="chatseller-close-btn" style="
              background: rgba(255, 255, 255, 0.1); color: white;
              border: none; border-radius: 50%; width: 36px; height: 36px;
              cursor: pointer; display: flex; align-items: center; justify-content: center;
            ">✕</button>
          </div>
          
          <div style="flex: 1; padding: 20px; background: #e5ddd5; display: flex; align-items: center; justify-content: center;">
            <div style="
              background: white; padding: 20px; border-radius: 8px;
              box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1); max-width: 300px; text-align: center;
            ">
              <p style="margin: 0; font-size: 14px; color: #303030; line-height: 1.4;">
                ${this.generateWelcomeMessageForModal()}
              </p>
            </div>
          </div>
          
          <div style="
            padding: 12px 16px; background: #f0f0f0; border-top: 1px solid #e0e0e0;
            display: flex; gap: 8px; align-items: center;
          ">
            <input type="text" placeholder="Tapez votre message..." style="
              flex: 1; background: white; border: 1px solid #e0e0e0;
              border-radius: 20px; padding: 10px 16px; font-size: 14px; outline: none;
            " />
            <button style="
              background: ${primaryColor}; color: white; border: none;
              border-radius: 50%; padding: 10px; cursor: pointer; display: flex;
              align-items: center; justify-content: center; width: 40px; height: 40px;
            ">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())
  }

  // ✅ GÉNÉRER MESSAGE D'ACCUEIL AVEC CONTEXTE PRODUIT POUR MODAL SIMPLE
  private generateWelcomeMessageForModal(): string {
    const agentName = this.config.agentConfig?.name || 'Assistant'
    const productName = this.config.productName
    
    if (productName) {
      return `Bonjour ! Je suis ${agentName}. 👋<br><br>Je vois que vous vous intéressez à <strong>"${productName}"</strong>. C'est un excellent choix !<br><br>Comment puis-je vous aider ? 😊`
    }
    
    return `${this.config.agentConfig?.welcomeMessage || `Bonjour ! Je suis ${agentName}, votre assistant d'achat. Comment puis-je vous aider ?`}`
  }

  private createChatModal() {
    if (this.chatComponent) {
      this.integrateVueComponent()
    } else {
      this.createSimpleChatModal()
    }
  }

  private integrateVueComponent() {
    const vueContainer = document.createElement('div')
    vueContainer.id = 'chatseller-vue-container'
    document.body.appendChild(vueContainer)
    
    this.chatComponent.mount(vueContainer)
    this.modalElement = vueContainer
  }

  private closeChat() {
    this.isOpen = false
    if (this.modalElement) {
      if (this.chatComponent) {
        this.chatComponent.unmount()
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    if (this.config.debug) {
      console.log('💬 Chat fermé')
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string) {
    const message: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    }
    this.messages.push(message)
  }

  // ✅ MÉTHODE AMÉLIORÉE POUR ENVOYER MESSAGES
  async sendMessage(message: string, conversationId?: string | null, options?: any): Promise<any> {
    try {
      if (this.configPromise) {
        await this.configPromise
      }

      const payload = {
        shopId: this.config.shopId,
        message,
        conversationId: conversationId || this.conversationId,
        productInfo: {
          id: this.config.productId,
          name: this.config.productName,
          price: this.config.productPrice,
          url: this.config.productUrl
        },
        visitorId: `visitor_${Date.now()}`,
        isFirstMessage: options?.isFirstMessage || false
      }

      const response = await fetch(`${this.config.apiUrl}/public/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      return await response.json()

    } catch (error) {
      console.error('❌ Erreur API:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
  }

  // ✅ WIDGET FALLBACK AMÉLIORÉ
  private createFallbackWidget() {
    if (!this.widgetElement) {
      const container = document.createElement('div')
      container.id = 'chatseller-widget-fallback'
      container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 999999;'
      document.body.appendChild(container)
      this.widgetElement = container
    }

    const primaryColor = this.config.primaryColor || '#25D366'
    const buttonText = this.config.buttonText || 'Parler à un conseiller'

    this.widgetElement.innerHTML = `
      <div style="margin: 8px 0;">
        <button onclick="alert('Widget ChatSeller temporairement indisponible - Rechargez la page')" style="
          padding: 16px 24px; background: ${primaryColor};
          color: white; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex; align-items: center; gap: 8px;
        ">
          💬 ${buttonText} (Chargement...)
        </button>
      </div>
    `
  }

  // ✅ MÉTHODES PUBLIQUES
  show() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'block'
    }
  }

  hide() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'none'
    }
  }

  destroy() {
    this.cleanupExistingWidgets()
    if (this.modalElement) {
      if (this.chatComponent) {
        this.chatComponent.unmount()
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    if (this.widgetElement) {
      this.widgetElement.remove()
      this.widgetElement = null
    }
    this.isInitialized = false
    this.configPromise = null
    this.chatComponent = null
    if (this.config.debug) {
      console.log('🗑️ ChatSeller widget détruit')
    }
  }

  track(event: string, data?: any) {
    if (this.config.debug) {
      console.log('📊 Track event:', event, data)
    }
    
    if (this.config.shopId) {
      fetch(`${this.config.apiUrl}/public/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: this.config.shopId,
          event,
          data,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }).catch(err => {
        if (this.config.debug) {
          console.warn('Analytics error:', err)
        }
      })
    }
  }

  // ✅ MÉTHODES POUR TESTS ET DEBUG
  getProductDetection(): boolean {
    return this.detectProductInfo()
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isOpen: this.isOpen,
      messagesCount: this.messages.length,
      config: { ...this.config },
      shopConfig: this.shopConfig,
      agentConfig: this.agentConfig ? {
        id: this.agentConfig.id,
        name: this.agentConfig.name,
        hasKnowledgeBase: (this.agentConfig.knowledgeBase || []).length > 0
      } : null,
      conversationId: this.conversationId,
      platform: this.detectPlatform(),
      initAttempts: this.initAttempts,
      timestamp: new Date().toISOString()
    }
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get currentConfig(): ChatSellerConfig {
    return { ...this.config }
  }

  get version(): string {
    return '1.1.0' // ✅ VERSION MISE À JOUR
  }

  get isConfigLoaded(): boolean {
    return !!this.shopConfig && !!this.agentConfig
  }
}

// ✅ INSTANCE GLOBALE
const chatSeller = new ChatSeller()

// ✅ AUTO-INIT OPTIMISÉ POUR SHOPIFY
document.addEventListener('DOMContentLoaded', () => {
  if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
    console.log('🌍 Initialisation via window.ChatSellerConfig')
    chatSeller.init((window as any).ChatSellerConfig)
  }
})

// ✅ FALLBACK POUR SHOPIFY (parfois le DOM est déjà chargé)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
      console.log('🔄 Fallback Shopify: Initialisation différée')
      chatSeller.init((window as any).ChatSellerConfig)
    }
  }, 1500) // ✅ DÉLAI AUGMENTÉ
}

// ✅ ÉCOUTER LES CHANGEMENTS DE SECTION SHOPIFY (AJAX)
if ((window as any).Shopify) {
  document.addEventListener('shopify:section:load', () => {
    console.log('🔄 Shopify: Section rechargée, re-initialisation widget')
    if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
      setTimeout(() => chatSeller.init((window as any).ChatSellerConfig), 800)
    }
  })
}

// ✅ EXPORT
declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
  }
}

window.ChatSeller = chatSeller

export default chatSeller