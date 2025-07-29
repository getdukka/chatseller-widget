// src/embed.ts - WIDGET OPTIMISÉ POUR SHOPIFY + E-COMMERCE
import { createApp } from 'vue'
import ChatSellerWidget from './ChatSellerWidget.vue'
import './style.css'

export interface AgentConfig {
  id?: string
  name?: string
  type?: string
  personality?: string
  description?: string
  avatar?: string
  welcomeMessage?: string
  fallbackMessage?: string
  config?: any
}

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
  agentConfig?: AgentConfig
  widgetConfig?: any
}

interface ShopConfigResponse {
  success: boolean
  data: {
    shop: {
      id: string
      name: string
      widgetConfig: any
      agentConfig: any
    }
    agent: AgentConfig | null
    knowledgeBase: {
      content: string
      documentsCount: number
      documents: any[]
    }
  }
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private app: any = null
  private isInitialized = false
  private shopConfigLoaded = false
  private initializationRetries = 0
  private maxRetries = 3
  private ctaButton: HTMLElement | null = null

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#ec4899',
      position: 'auto', // Détection automatique par défaut
      buttonText: 'Parler à un conseiller',
      language: 'fr',
      autoDetectProduct: true
    }
  }

  async init(config: ChatSellerConfig) {
    if (this.isInitialized) {
      console.warn('🟡 ChatSeller is already initialized')
      return
    }

    console.log('🚀 Initializing ChatSeller widget for Shopify...', config.shopId)

    // Merge config with defaults
    this.config = { ...this.config, ...config }

    // Validate required config
    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId is required')
      return
    }

    try {
      // Attendre que le DOM soit prêt
      await this.waitForDOM()

      // Auto-detect product information if enabled
      if (this.config.autoDetectProduct) {
        this.detectShopifyProductInfo()
      }

      // Charger la configuration depuis l'API avec retry
      await this.loadShopConfigurationWithRetry()

      // Détecter et positionner le widget
      await this.detectAndPositionWidget()

      // Mount Vue app
      this.mountWidget()

      this.isInitialized = true
      console.log('✅ ChatSeller widget initialized successfully')
      
      // Track initialization
      this.track('widget_initialized', {
        shopId: this.config.shopId,
        productDetected: !!(this.config.productId || this.config.productName),
        configLoaded: this.shopConfigLoaded,
        platform: this.detectPlatform()
      })

    } catch (error) {
      console.error('❌ Failed to initialize ChatSeller:', error)
      this.handleInitializationError(error)
    }
  }

  // ✅ NOUVELLE MÉTHODE : Attendre que le DOM soit prêt
  private async waitForDOM(): Promise<void> {
    return new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => resolve())
      } else {
        resolve()
      }
    })
  }

  // ✅ MÉTHODE OPTIMISÉE : Détection produit Shopify spécialisée
  private detectShopifyProductInfo() {
    const url = window.location.href
    
    if (!this.config.productUrl) {
      this.config.productUrl = url
    }

    // ✅ DÉTECTION SHOPIFY AVANCÉE
    const isShopify = this.detectPlatform() === 'shopify'
    
    if (isShopify) {
      // Détection ID produit Shopify
      if (!this.config.productId) {
        // Méthode 1: window.meta si disponible
        if ((window as any).meta?.product?.id) {
          this.config.productId = (window as any).meta.product.id.toString()
        }
        // Méthode 2: URL pattern Shopify
        else {
          const shopifyMatch = url.match(/\/products\/([^\/\?]+)/)
          if (shopifyMatch && shopifyMatch[1]) {
            this.config.productId = shopifyMatch[1]
          }
        }
      }

      // Détection nom produit Shopify
      if (!this.config.productName) {
        // Méthode 1: window.meta
        if ((window as any).meta?.product?.title) {
          this.config.productName = (window as any).meta.product.title
        }
        // Méthode 2: Sélecteurs Shopify courants
        else {
          const titleSelectors = [
            '.product__title',
            '.product-single__title', 
            '.product_title',
            '.product-title h1',
            '[data-product-title]',
            'h1.product-form__cart-submit'
          ]
          
          for (const selector of titleSelectors) {
            const element = document.querySelector(selector) as HTMLElement
            if (element?.textContent?.trim()) {
              this.config.productName = element.textContent.trim()
              break
            }
          }
        }
      }

      // Détection prix Shopify
      if (!this.config.productPrice) {
        // Méthode 1: window.meta
        if ((window as any).meta?.product?.price) {
          this.config.productPrice = (window as any).meta.product.price / 100 // Shopify prix en centimes
        }
        // Méthode 2: Sélecteurs prix Shopify
        else {
          const priceSelectors = [
            '.price .money',
            '.product-form__cart-submit .money',
            '.price-item--regular',
            '[data-price]',
            '.product__price .money'
          ]

          for (const selector of priceSelectors) {
            const priceElement = document.querySelector(selector) as HTMLElement
            if (priceElement) {
              const priceText = priceElement.textContent || priceElement.getAttribute('data-price') || ''
              
              // Extract numeric price
              const priceMatch = priceText.match(/[\d,\s]+\.?\d*/g)
              if (priceMatch && priceMatch[0]) {
                const price = parseFloat(priceMatch[0].replace(/[,\s]/g, ''))
                if (!isNaN(price) && price > 0) {
                  this.config.productPrice = price
                  break
                }
              }
            }
          }
        }
      }
    } else {
      // Détection générique pour autres plateformes (WooCommerce, sites custom)
      this.detectGenericProductInfo()
    }

    console.log('🔍 Product detection completed:', {
      platform: this.detectPlatform(),
      productId: this.config.productId,
      productName: this.config.productName,
      productPrice: this.config.productPrice,
      productUrl: this.config.productUrl
    })
  }

  // ✅ MÉTHODE : Détection générique produit
  private detectGenericProductInfo() {
    const url = window.location.href
    
    // ID produit générique
    if (!this.config.productId) {
      const productIdPatterns = [
        /\/product\/([^\/\?]+)/, // WooCommerce
        /product[_-]id[=:]([^&\?]+)/, // Query param
        /p\/([^\/\?]+)/, // Custom patterns
        /item\/([^\/\?]+)/,
        /\/([0-9]+)$/ // Numeric ID at end
      ]
      
      for (const pattern of productIdPatterns) {
        const match = url.match(pattern)
        if (match && match[1]) {
          this.config.productId = match[1]
          break
        }
      }
    }

    // Nom produit générique
    if (!this.config.productName) {
      const titleSelectors = [
        'h1[class*="product"]',
        'h1[class*="title"]',
        '.product-title h1',
        '.product-name h1',
        '[data-product-title]',
        '.entry-title', // WooCommerce
        '.product__title'
      ]
      
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector) as HTMLElement
        if (element?.textContent?.trim()) {
          this.config.productName = element.textContent.trim()
          break
        }
      }
      
      // Fallback vers meta tags
      if (!this.config.productName) {
        const metaTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement
        if (metaTitle?.content) {
          this.config.productName = metaTitle.content
        } else {
          this.config.productName = document.title
        }
      }
    }

    // Prix générique
    if (!this.config.productPrice) {
      const priceSelectors = [
        '.price:not(.was-price):not(.compare-price)',
        '.current-price',
        '.product-price .amount',
        '[data-price]',
        '.price .money',
        '.product-price-value',
        '.woocommerce-price-amount',
        '.price-current',
        '.sale-price'
      ]

      for (const selector of priceSelectors) {
        const priceElement = document.querySelector(selector) as HTMLElement
        if (priceElement) {
          const priceText = priceElement.textContent || priceElement.getAttribute('data-price') || ''
          
          const priceMatch = priceText.match(/[\d,\s]+\.?\d*/g)
          if (priceMatch && priceMatch[0]) {
            const price = parseFloat(priceMatch[0].replace(/[,\s]/g, ''))
            if (!isNaN(price) && price > 0) {
              this.config.productPrice = price
              break
            }
          }
        }
      }
    }
  }

  // ✅ NOUVELLE MÉTHODE : Détecter la plateforme e-commerce
  private detectPlatform(): string {
    // Shopify
    if ((window as any).Shopify || document.querySelector('meta[name="shopify-checkout-api-token"]')) {
      return 'shopify'
    }
    
    // WooCommerce
    if (document.body.classList.contains('woocommerce') || 
        document.querySelector('.woocommerce')) {
      return 'woocommerce'
    }
    
    // PrestaShop
    if (document.querySelector('meta[name="prestashop-version"]')) {
      return 'prestashop'
    }
    
    // Magento
    if (document.body.classList.contains('catalog-product-view')) {
      return 'magento'
    }
    
    return 'custom'
  }

  // ✅ NOUVELLE MÉTHODE : Détecter et positionner le widget intelligemment
  private async detectAndPositionWidget() {
  const platform = this.detectPlatform()
  let position = this.config.position
  
  // Si position auto, détecter automatiquement
  if (position === 'auto') {
    position = await this.detectOptimalPosition(platform)
  }
  
  // ✅ AJOUT : Gérer le cas où position est undefined
  const finalPosition = position || 'below-cta'
  this.createWidgetAtPosition(finalPosition)
}

  // ✅ MÉTHODE : Détecter la position optimale selon la plateforme
  private async detectOptimalPosition(platform: string): Promise<'above-cta' | 'below-cta' | 'beside-cta'> {
  let ctaSelectors: string[] = []
  
  switch (platform) {
    case 'shopify':
      ctaSelectors = [
        '.product-form__cart-submit',
        '[data-testid="add-to-cart"]',
        '.btn--add-to-cart',
        '.product-form button[type="submit"]',
        '.product__form button[type="submit"]',
        '.add-to-cart-btn',
        'button[name="add"]'
      ]
      break
    
    case 'woocommerce':
      ctaSelectors = [
        '.single_add_to_cart_button',
        '.add_to_cart_button',
        'button[name="add-to-cart"]'
      ]
      break
    
    default:
      ctaSelectors = [
        'button[class*="add-to-cart"]',
        'button[class*="add-cart"]',
        'button[id*="add-to-cart"]',
        '.buy-now',
        '.purchase-btn',
        '[data-add-to-cart]'
      ]
  }
  
  // Chercher le bouton CTA
  for (const selector of ctaSelectors) {
    const button = document.querySelector(selector) as HTMLElement
    if (button && this.isVisible(button)) {
      this.ctaButton = button
      break
    }
  }
  
  // Retourner la position par défaut basée sur la plateforme
  if (platform === 'shopify') {
    return 'above-cta' // Shopify fonctionne mieux au-dessus
  } else {
    return 'below-cta' // Autres plateformes en dessous
  }
}

  // ✅ MÉTHODE : Vérifier si un élément est visible
  private isVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && 
           window.getComputedStyle(element).visibility !== 'hidden'
  }

  // ✅ MÉTHODE : Créer le widget à la position spécifiée
  private createWidgetAtPosition(position: 'auto' | 'above-cta' | 'below-cta' | 'beside-cta') {
  const existingWidget = document.getElementById('chatseller-widget')
  if (existingWidget) {
    existingWidget.remove()
  }

  this.widgetElement = document.createElement('div')
  this.widgetElement.id = 'chatseller-widget'
  this.widgetElement.setAttribute('data-chatseller-widget', 'true')
  
  // Style par défaut
  Object.assign(this.widgetElement.style, {
    position: 'relative',
    zIndex: '2147483647',
    pointerEvents: 'none'
  })

  // Positionnement selon la configuration
  this.positionWidget(position)
}

  // ✅ MÉTHODE : Positionner le widget selon la stratégie
  private positionWidget(position: 'auto' | 'above-cta' | 'below-cta' | 'beside-cta') {
  if (!this.widgetElement) return

  const container = this.findWidgetContainer()
  
  switch (position) {
    case 'auto':
    case 'above-cta':
      if (this.ctaButton && this.ctaButton.parentNode) {
        this.ctaButton.parentNode.insertBefore(this.widgetElement, this.ctaButton)
        this.widgetElement.style.marginBottom = '12px'
      } else {
        container.appendChild(this.widgetElement)
      }
      break
      
    case 'below-cta':
      if (this.ctaButton && this.ctaButton.parentNode) {
        this.ctaButton.parentNode.insertBefore(this.widgetElement, this.ctaButton.nextSibling)
        this.widgetElement.style.marginTop = '12px'
      } else {
        container.appendChild(this.widgetElement)
      }
      break
      
    case 'beside-cta':
      if (this.ctaButton && this.ctaButton.parentNode) {
        // Créer un container flex si nécessaire
        const flexContainer = document.createElement('div')
        flexContainer.style.display = 'flex'
        flexContainer.style.gap = '12px'
        flexContainer.style.alignItems = 'center'
        
        this.ctaButton.parentNode.insertBefore(flexContainer, this.ctaButton)
        flexContainer.appendChild(this.ctaButton)
        flexContainer.appendChild(this.widgetElement)
      } else {
        container.appendChild(this.widgetElement)
      }
      break
      
    default:
      container.appendChild(this.widgetElement)
  }
}

  // ✅ MÉTHODE : Trouver le container optimal pour le widget
  private findWidgetContainer(): HTMLElement {
    const platform = this.detectPlatform()
    let containerSelectors: string[] = []
    
    switch (platform) {
      case 'shopify':
        containerSelectors = [
          '.product-form',
          '.product__form',
          '.product-single__form',
          '.product-form__buttons'
        ]
        break
      
      case 'woocommerce':
        containerSelectors = [
          '.single-product-summary',
          '.summary.entry-summary',
          '.cart'
        ]
        break
      
      default:
        containerSelectors = [
          '.product-info',
          '.product-details',
          '.product-actions',
          '.product-form'
        ]
    }
    
    // Chercher le container approprié
    for (const selector of containerSelectors) {
      const container = document.querySelector(selector) as HTMLElement
      if (container) {
        return container
      }
    }
    
    // Fallback vers le body
    return document.body
  }

  // ✅ MÉTHODE EXISTANTE AMÉLIORÉE : Charger configuration shop
  private async loadShopConfigurationWithRetry() {
    while (this.initializationRetries < this.maxRetries) {
      try {
        await this.loadShopConfiguration()
        return
      } catch (error) {
        this.initializationRetries++
        console.warn(`⚠️ Retry ${this.initializationRetries}/${this.maxRetries} for shop config`)
        
        if (this.initializationRetries >= this.maxRetries) {
          throw error
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * this.initializationRetries))
      }
    }
  }

  private async loadShopConfiguration() {
    try {
      console.log(`🔄 Loading configuration for shop: ${this.config.shopId}`)
      
      const response = await fetch(`${this.config.apiUrl}/api/v1/public/shops/${this.config.shopId}/agent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const shopConfig: ShopConfigResponse = await response.json()

      if (shopConfig.success && shopConfig.data) {
        // Fusionner la configuration du widget avec celle du shop
        if (shopConfig.data.shop.widgetConfig) {
          this.config = {
            ...this.config,
            ...shopConfig.data.shop.widgetConfig,
            shopId: this.config.shopId,
            apiUrl: this.config.apiUrl
          }
        }

        // Configurer l'agent
        if (shopConfig.data.agent) {
          this.config.agentConfig = shopConfig.data.agent
        } else if (shopConfig.data.shop.agentConfig) {
          this.config.agentConfig = shopConfig.data.shop.agentConfig
        }

        this.shopConfigLoaded = true
        console.log('✅ Shop configuration loaded successfully')
        console.log(`📚 Knowledge base: ${shopConfig.data.knowledgeBase.documentsCount} documents`)
      } else {
        throw new Error('Invalid shop configuration response')
      }

    } catch (error) {
      console.warn('⚠️ Failed to load shop configuration, using defaults:', error)
      
      this.config.agentConfig = {
        name: 'Assistant',
        welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
        fallbackMessage: 'Je transmets votre question à notre équipe.',
        avatar: `https://ui-avatars.com/api/?name=Assistant&background=${this.config.primaryColor?.replace('#', '') || 'ec4899'}&color=fff`
      }
      
      this.shopConfigLoaded = false
      throw error
    }
  }

  private mountWidget() {
    if (!this.widgetElement) return

    this.app = createApp(ChatSellerWidget, {
      config: this.config
    })

    this.app.mount(this.widgetElement)
  }

  private handleInitializationError(error: any) {
    console.error('❌ ChatSeller initialization failed:', error)
    
    this.createFallbackWidget()
    
    this.track('widget_initialization_failed', {
      error: error.message,
      shopId: this.config.shopId,
      retries: this.initializationRetries
    })
  }

  private createFallbackWidget() {
    const fallbackButton = document.createElement('button')
    fallbackButton.innerHTML = '💬 ' + (this.config.buttonText || 'Aide')
    fallbackButton.style.cssText = `
      width: 100%;
      padding: 12px 20px;
      background: ${this.config.primaryColor || '#ec4899'};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      margin: 8px 0;
    `
    
    fallbackButton.onmouseover = () => fallbackButton.style.opacity = '0.9'
    fallbackButton.onmouseout = () => fallbackButton.style.opacity = '1'
    fallbackButton.onclick = () => {
      alert('Assistant temporairement indisponible. Veuillez nous contacter directement.')
    }
    
    if (this.widgetElement) {
      this.widgetElement.appendChild(fallbackButton)
    }
  }

  // ✅ MÉTHODES PUBLIQUES EXISTANTES (inchangées)
  show() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'block'
      this.widgetElement.style.pointerEvents = 'auto'
    }
  }

  hide() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'none'
      this.widgetElement.style.pointerEvents = 'none'
    }
  }

  destroy() {
    if (this.app) {
      this.app.unmount()
      this.app = null
    }

    if (this.widgetElement) {
      this.widgetElement.remove()
      this.widgetElement = null
    }

    this.isInitialized = false
    this.shopConfigLoaded = false
    console.log('🗑️ ChatSeller widget destroyed')
  }

  updateConfig(newConfig: Partial<ChatSellerConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    if (this.isInitialized) {
      console.log('🔄 Reinitializing widget with new config')
      this.destroy()
      this.init(this.config)
    }
  }

  // API METHODS (existantes, inchangées)
  async sendMessage(message: string, conversationId?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`${this.config.apiUrl}/api/v1/public/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shopId: this.config.shopId,
          message: message,
          conversationId: conversationId,
          productInfo: {
            id: this.config.productId,
            name: this.config.productName,
            price: this.config.productPrice,
            url: this.config.productUrl
          },
          visitorId: this.getVisitorId()
        }),
        signal: AbortSignal.timeout(30000)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('❌ Failed to send message:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur de communication'
      }
    }
  }

  // ANALYTICS (existantes)
  private analyticsQueue: any[] = []
  private analyticsTimer: NodeJS.Timeout | null = null

  track(event: string, data?: any) {
    if (!this.config.shopId) return

    const eventData = {
      shopId: this.config.shopId,
      eventType: event,
      eventData: {
        ...data,
        shopConfigLoaded: this.shopConfigLoaded,
        agentConfigured: !!this.config.agentConfig,
        productDetected: !!(this.config.productId || this.config.productName),
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: this.detectPlatform(),
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      },
      pageUrl: window.location.href,
      referrer: document.referrer
    }

    this.analyticsQueue.push(eventData)

    if (this.analyticsTimer) {
      clearTimeout(this.analyticsTimer)
    }

    this.analyticsTimer = setTimeout(() => {
      this.flushAnalytics()
    }, 2000)
  }

  private async flushAnalytics() {
    if (this.analyticsQueue.length === 0) return

    const events = [...this.analyticsQueue]
    this.analyticsQueue = []

    try {
      await fetch(`${this.config.apiUrl}/api/v1/public/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ events }),
        signal: AbortSignal.timeout(10000)
      })
    } catch (error) {
      console.warn('📊 Failed to send analytics:', error)
      this.analyticsQueue.unshift(...events)
    }
  }

  // HELPER METHODS (existantes)
  private getVisitorId(): string {
    const storageKey = 'chatseller_visitor_id'
    
    try {
      let visitorId = localStorage.getItem(storageKey)
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(storageKey, visitorId)
      }
      return visitorId
    } catch (error) {
      return `session_visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // DEBUG METHODS (existantes)
  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      shopConfigLoaded: this.shopConfigLoaded,
      config: { ...this.config },
      visitorId: this.getVisitorId(),
      userAgent: navigator.userAgent,
      currentUrl: window.location.href,
      platform: this.detectPlatform(),
      ctaButton: this.ctaButton ? this.ctaButton.outerHTML : null,
      timestamp: new Date().toISOString(),
      retries: this.initializationRetries
    }
  }

  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now()
    
    try {
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      })
      
      const latency = Date.now() - startTime
      
      if (!response.ok) {
        throw new Error(`API Health Check failed: ${response.status}`)
      }
      
      return {
        success: true,
        latency
      }
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  get isConfigLoaded(): boolean {
    return this.shopConfigLoaded
  }

  get currentConfig(): ChatSellerConfig {
    return { ...this.config }
  }

  get isReady(): boolean {
    return this.isInitialized && this.app !== null
  }
}

// Global instance
const chatSeller = new ChatSeller()

// ✅ AUTO-INIT OPTIMISÉ POUR SHOPIFY
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 DOM loaded, checking for ChatSeller configuration...')
  
  // Method 1: Via script tag data attributes (recommandé pour Shopify)
  const scriptTag = document.querySelector('script[data-shop-id]')
  if (scriptTag) {
    const shopId = scriptTag.getAttribute('data-shop-id')
    if (shopId) {
      const config: ChatSellerConfig = { shopId }
      
      // Extract all data attributes
      const apiUrl = scriptTag.getAttribute('data-api-url')
      if (apiUrl) config.apiUrl = apiUrl
      
      const theme = scriptTag.getAttribute('data-theme') as 'modern' | 'minimal' | 'brand_adaptive'
      if (theme) config.theme = theme
      
      const primaryColor = scriptTag.getAttribute('data-primary-color')
      if (primaryColor) config.primaryColor = primaryColor
      
      const position = scriptTag.getAttribute('data-position') as any
      if (position) config.position = position
      
      const buttonText = scriptTag.getAttribute('data-button-text')
      if (buttonText) config.buttonText = buttonText
      
      const language = scriptTag.getAttribute('data-language') as 'fr' | 'en' | 'wo'
      if (language) config.language = language
      
      console.log('📝 Initializing via script tag for Shopify:', config)
      chatSeller.init(config)
      return
    }
  }
  
  // Method 2: Via global window config
  if ((window as any).ChatSellerConfig) {
    console.log('🌍 Initializing via window.ChatSellerConfig')
    chatSeller.init((window as any).ChatSellerConfig)
    return
  }
  
  // Method 3: Meta tag fallback
  const metaTag = document.querySelector('meta[name="chatseller-shop-id"]') as HTMLMetaElement
  if (metaTag?.content) {
    console.log('🏷️ Initializing via meta tag')
    chatSeller.init({ shopId: metaTag.content })
    return
  }
  
  console.log('⚠️ No ChatSeller configuration found')
})

// ✅ SHOPIFY INTEGRATION SPÉCIALISÉE
if (typeof window !== 'undefined' && (window as any).Shopify) {
  console.log('🛍️ Shopify detected, enabling enhanced integration')
  
  // Listen for Shopify theme events
  document.addEventListener('shopify:section:load', () => {
    console.log('🔄 Shopify section loaded, re-detecting product info')
    if (chatSeller.isReady) {
      chatSeller.updateConfig({ autoDetectProduct: true })
    }
  })

  // Listen for variant changes (important pour Shopify)
  document.addEventListener('variant:change', (event: any) => {
  console.log('🔄 Shopify variant changed, updating product info')
  const variant = event.detail?.variant
  if (variant && chatSeller.isReady) {
    // ✅ CORRECTION : Créer un objet config propre sans undefined
    const updateConfig: Partial<ChatSellerConfig> = {
      productId: variant.id?.toString()
    }
    
    // ✅ AJOUT : Ajouter productPrice seulement si elle existe
    if (variant.price && typeof variant.price === 'number') {
      updateConfig.productPrice = variant.price / 100
    }
    
    chatSeller.updateConfig(updateConfig)
  }
})
}

// ✅ EXPOSE TO WINDOW
declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
    Shopify?: any
  }
}

window.ChatSeller = chatSeller

export default chatSeller