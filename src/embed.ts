// src/embed.ts - WIDGET OPTIMISÉ POUR PERFORMANCE < 3S
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
  
  // ✅ NOUVELLE PROPRIÉTÉ POUR CACHE PERFORMANCE
  private configPromise: Promise<void> | null = null
  private chatComponent: any = null

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#007AFF',
      position: 'above-cta',
      buttonText: 'Parler à un conseiller',
      language: 'fr',
      autoDetectProduct: true
    }
  }

  // ✅ INIT OPTIMISÉ POUR PERFORMANCE
  async init(config: ChatSellerConfig) {
    if (this.isInitialized) {
      console.warn('🟡 ChatSeller déjà initialisé')
      return
    }

    console.log('🚀 Initialisation ChatSeller widget OPTIMISÉ...', config.shopId)
    const startTime = performance.now()

    this.config = { ...this.config, ...config }

    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId requis')
      return
    }

    try {
      await this.waitForDOM()
      
      // ✅ ÉTAPE 1: Création widget immédiate avec config par défaut
      this.createWidget()
      
      // ✅ ÉTAPE 2: Détection produit synchrone rapide
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      this.isInitialized = true
      
      // ✅ ÉTAPE 3: Chargement config API en arrière-plan (NON BLOQUANT)
      this.loadShopConfigurationAsync()
      
      const initTime = performance.now() - startTime
      console.log(`✅ ChatSeller widget initialisé en ${initTime.toFixed(2)}ms`)
      
      // ✅ ÉTAPE 4: Track rapide
      this.track('widget_initialized', {
        shopId: this.config.shopId,
        initTime,
        productDetected: !!(this.config.productName || this.config.productId)
      })
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      this.createFallbackWidget()
    }
  }

  // ✅ NOUVEAU: Chargement config ASYNCHRONE et NON BLOQUANT
  private async loadShopConfigurationAsync(): Promise<void> {
    if (this.configPromise) {
      return this.configPromise
    }

    this.configPromise = this.performConfigLoad()
    return this.configPromise
  }

  private async performConfigLoad(): Promise<void> {
    try {
      console.log('🔄 Chargement configuration shop (arrière-plan):', this.config.shopId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout
      
      const response = await fetch(`${this.config.apiUrl}/public/shops/${this.config.shopId}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
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
        
        // ✅ FUSIONNER ET METTRE À JOUR LE WIDGET (SI NÉCESSAIRE)
        this.mergeApiConfiguration()
        this.updateWidgetWithConfig()
        
        console.log('✅ Configuration chargée en arrière-plan:', {
          shop: this.shopConfig?.id,
          agent: this.agentConfig?.name,
          primaryColor: this.config.primaryColor
        })
      } else {
        throw new Error(data.error || 'Erreur configuration API')
      }
      
    } catch (error) {
      console.warn('⚠️ Configuration par défaut utilisée (API non disponible):', error)
      // Continuer avec la config par défaut - pas bloquant
    }
  }

  // ✅ MISE À JOUR WIDGET AVEC CONFIG API
  private updateWidgetWithConfig(): void {
    if (!this.widgetElement || !this.shopConfig) return

    // Mettre à jour la couleur et le texte du bouton
    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      const primaryColor = this.config.primaryColor || '#007AFF'
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
      
      if (this.config.buttonText !== triggerBtn.textContent?.trim()) {
        const textNode = triggerBtn.querySelector('span:not(svg)')
        if (textNode) {
          textNode.textContent = this.config.buttonText || 'Parler à un conseiller'
        }
      }
    }
  }

  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.primaryColor || this.config.primaryColor || '#007AFF',
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

  // ✅ DÉTECTION PRODUIT CORRIGÉE POUR RETOURNER BOOLEAN
  private detectProductInfo(): boolean {
    try {
      // Méta tags OpenGraph
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
      const ogPrice = document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
      
      // Schema.org Product
      const productSchema = document.querySelector('script[type="application/ld+json"]')
      let schemaData = null
      if (productSchema) {
        try {
          schemaData = JSON.parse(productSchema.textContent || '')
        } catch (e) {}
      }

      // ✅ SHOPIFY SPÉCIFIQUE - MÉTHODES MULTIPLES
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      const shopifyPageType = (window as any).Shopify?.theme?.name || (window as any).meta?.page?.pageType
      
      // Détection générique par sélecteurs
      const titleSelectors = ['h1.product-title', '.product-name', 'h1', '[data-product-title]', '.product-single__title']
      const priceSelectors = [
        '.price', '.product-price', '[data-price]', '.cost',
        '.money', '.price-item--sale', '.price__current',
        '.product-form__price', '.price-list .price-item'
      ]

      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let hasDetection = false

      // Priorité: Shopify > OG > Schema > Generic
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        hasDetection = true
      } else if (ogTitle) {
        detectedName = ogTitle
        detectedPrice = ogPrice ? parseFloat(ogPrice) : undefined
        hasDetection = true
      } else if (schemaData?.name) {
        detectedName = schemaData.name
        detectedPrice = schemaData.offers?.price ? parseFloat(schemaData.offers.price) : undefined
        hasDetection = true
      } else {
        // Fallback générique
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            hasDetection = true
            break
          }
        }
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:\.\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', ''))
              hasDetection = true
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
      
      // Détection URL et ID
      if (!this.config.productUrl) {
        this.config.productUrl = window.location.href
      }
      if (!this.config.productId) {
        this.config.productId = this.extractProductIdFromUrl()
      }

      if (hasDetection && (detectedName || detectedPrice)) {
        console.log('✅ Produit détecté:', {
          name: detectedName,
          price: detectedPrice,
          id: this.config.productId
        })
      }

      // ✅ RETOURNER UN BOOLEAN POUR LE TEST
      return hasDetection && !!(detectedName || detectedPrice)

    } catch (error) {
      console.warn('⚠️ Erreur détection produit:', error)
      return false
    }
  }

  private extractProductIdFromUrl(): string {
    try {
      const url = window.location.href
      // Shopify: /products/product-handle
      const shopifyMatch = url.match(/\/products\/([^/?#]+)/)
      if (shopifyMatch?.[1]) return shopifyMatch[1]
      
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

  // ✅ CRÉATION WIDGET IMMÉDIATE (SANS ATTENDRE API)
  private createWidget() {
    let container = document.getElementById('chatseller-widget')
    
    if (!container) {
      container = document.getElementById('chatseller-widget-container')
    }
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    const ctaSelectors = [
      '#add-to-cart-btn', '.add-to-cart', '[data-add-to-cart]',
      '#buy-now-btn', '.buy-now', '.purchase-btn',
      '.product-actions', '.product-form__buttons',
      '.single_add_to_cart_button', '.button.add_to_cart_button',
      '.btn-addtocart', '.product-form__cart'
    ]
    
    let targetElement = null
    let insertMethod: 'before' | 'after' | 'append' = 'before'
    
    for (const selector of ctaSelectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }
    
    switch (position) {
      case 'above-cta':
        insertMethod = 'before'
        break
      case 'below-cta':
        insertMethod = 'after'
        break
      case 'beside-cta':
        insertMethod = 'after'
        container.style.display = 'inline-block'
        container.style.marginLeft = '1rem'
        break
      default:
        insertMethod = 'before'
    }
    
    if (targetElement) {
      if (insertMethod === 'before') {
        targetElement.parentNode?.insertBefore(container, targetElement)
      } else if (insertMethod === 'after') {
        targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
      } else {
        targetElement.appendChild(container)
      }
    } else {
      document.body.appendChild(container)
    }
  }

  // ✅ RENDU WIDGET OPTIMISÉ
  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à un conseiller'
    const primaryColor = this.config.primaryColor || '#007AFF'

    // ✅ HTML OPTIMISÉ AVEC LAZY LOADING
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          <span>${buttonText}</span>
        </button>
      </div>
    `

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.openChat())
    }

    console.log('✅ Widget rendu avec succès')
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

  // ✅ OUVERTURE CHAT AVEC LAZY LOADING COMPOSANT VUE
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
        console.error('❌ Erreur chargement composant:', error)
        this.createSimpleChatModal()
        return
      }
    }
    
    this.createChatModal()
    
    console.log('💬 Chat ouvert')
  }

  // ✅ MODAL SIMPLE EN CAS D'ÉCHEC LAZY LOADING
  private createSimpleChatModal() {
    // Modal HTML simple sans Vue.js en fallback
    if (this.modalElement) {
      this.modalElement.remove()
    }

    const agentName = this.config.agentConfig?.name || 'Assistant'
    const primaryColor = this.config.primaryColor || '#007AFF'

    this.modalElement = document.createElement('div')
    this.modalElement.innerHTML = `
      <div id="chatseller-modal-overlay" style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(8px);
        z-index: 2147483647; display: flex; align-items: center;
        justify-content: center; padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 450px; height: 650px; max-height: 90vh;
          background: white; border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          display: flex; flex-direction: column; overflow: hidden;
        ">
          <div style="
            padding: 20px; background: ${primaryColor}; color: white;
            display: flex; align-items: center; justify-content: space-between;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 48px; height: 48px; border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex; align-items: center; justify-content: center;
                font-weight: 600; font-size: 18px;
              ">${agentName.charAt(0).toUpperCase()}</div>
              <div>
                <h3 style="margin: 0; font-size: 18px;">${agentName}</h3>
                <p style="margin: 0; font-size: 13px; opacity: 0.9;">Assistant Commercial</p>
              </div>
            </div>
            <button id="chatseller-close-btn" style="
              background: rgba(255, 255, 255, 0.1); color: white;
              border: none; border-radius: 50%; width: 40px; height: 40px;
              cursor: pointer; display: flex; align-items: center; justify-content: center;
            ">✕</button>
          </div>
          
          <div style="flex: 1; padding: 24px; background: #f8fafc;">
            <div style="
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 16px; border-radius: 16px; margin-bottom: 16px;
              border: 1px solid #e2e8f0;
            ">
              ${this.config.agentConfig?.welcomeMessage || 'Bonjour ! Comment puis-je vous aider ?'}
            </div>
          </div>
          
          <div style="
            padding: 20px; border-top: 1px solid #e2e8f0;
            background: white; display: flex; gap: 12px;
          ">
            <input type="text" placeholder="Tapez votre message..." style="
              flex: 1; padding: 16px; border: 2px solid #e2e8f0;
              border-radius: 12px; outline: none;
            " />
            <button style="
              background: ${primaryColor}; color: white; border: none;
              border-radius: 12px; padding: 16px; cursor: pointer;
            ">Envoyer</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())
  }

  // ✅ RESTE DES MÉTHODES (createChatModal, setupChatEventListeners, etc.)
  private createChatModal() {
    // Utiliser le composant Vue si disponible, sinon fallback
    if (this.chatComponent) {
      // Intégrer le composant Vue
      this.integrateVueComponent()
    } else {
      this.createSimpleChatModal()
    }
  }

  private integrateVueComponent() {
    // Créer un container pour le composant Vue
    const vueContainer = document.createElement('div')
    vueContainer.id = 'chatseller-vue-container'
    document.body.appendChild(vueContainer)
    
    // Monter le composant Vue
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
    console.log('💬 Chat fermé')
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

  private async sendMessageToAPI(message: string): Promise<any> {
    try {
      // S'assurer que la config est chargée avant l'envoi
      if (this.configPromise) {
        await this.configPromise
      }

      const payload = {
        message,
        conversationId: this.conversationId,
        shopId: this.config.shopId,
        agentId: this.config.agentConfig?.id,
        productContext: {
          id: this.config.productId,
          name: this.config.productName,
          price: this.config.productPrice,
          url: this.config.productUrl
        },
        systemPrompt: this.config.agentConfig?.systemPrompt,
        knowledgeBase: this.config.agentConfig?.knowledgeBase || []
      }

      const response = await fetch(`${this.config.apiUrl}/public/chat/message`, {
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

  private createFallbackWidget() {
    if (!this.widgetElement) {
      const container = document.createElement('div')
      container.id = 'chatseller-widget-fallback'
      document.body.appendChild(container)
      this.widgetElement = container
    }

    const primaryColor = this.config.primaryColor || '#007AFF'
    const buttonText = this.config.buttonText || 'Parler à un conseiller'

    this.widgetElement.innerHTML = `
      <div style="margin: 8px 0;">
        <button onclick="alert('Widget ChatSeller temporairement indisponible')" style="
          width: 100%; padding: 16px 24px; background: ${primaryColor};
          color: white; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 600; cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
    console.log('🗑️ ChatSeller widget détruit')
  }

  track(event: string, data?: any) {
    console.log('📊 Track event:', event, data)
    
    if (this.config.shopId) {
      // Track asynchrone pour ne pas bloquer
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
      }).catch(err => console.warn('Analytics error:', err))
    }
  }

  // ✅ MÉTHODES POUR TESTS
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
    return '1.0.0'
  }

  get isConfigLoaded(): boolean {
    return !!this.shopConfig && !!this.agentConfig
  }
}

// ✅ INSTANCE GLOBALE
const chatSeller = new ChatSeller()

// ✅ AUTO-INIT OPTIMISÉ
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 DOM chargé, recherche configuration ChatSeller...')
  
  if ((window as any).ChatSellerConfig) {
    console.log('🌍 Initialisation via window.ChatSellerConfig')
    chatSeller.init((window as any).ChatSellerConfig)
  } else {
    console.log('⚠️ Configuration ChatSeller non trouvée')
  }
})

// ✅ EXPORT
declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
  }
}

window.ChatSeller = chatSeller

export default chatSeller