// src/embed.ts 
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
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  language?: 'fr' | 'en' | 'wo'
  autoDetectProduct?: boolean
  agentConfig?: any
  forceContainer?: string
  debug?: boolean
  disableFallback?: boolean
}

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private isInitialized = false
  private isOpen = false
  private modalElement: HTMLElement | null = null
  private shopConfig: any = null
  private agentConfig: any = null
  private conversationId: string | null = null
  private configPromise: Promise<void> | null = null
  private chatComponent: any = null
  private initAttempts = 0

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#3B82F6',
      position: 'above-cta',
      buttonText: 'Parler à un conseiller',
      language: 'fr',
      autoDetectProduct: true,
      debug: false,
      disableFallback: true // ✅ NOUVEAU: Désactiver fallback par défaut
    }
  }

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
      
      // ✅ ÉTAPE 1: Création widget immédiate
      this.createWidget()
      
      // ✅ ÉTAPE 2: Détection produit pour Shopify
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      this.isInitialized = true
      
      // ✅ ÉTAPE 3: Chargement config API en arrière-plan
      this.loadShopConfigurationAsync()
      
      const initTime = performance.now() - startTime
      console.log(`✅ ChatSeller widget initialisé en ${initTime.toFixed(2)}ms`)
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      // ✅ PAS DE FALLBACK AUTOMATIQUE - Evite le double bouton
    }
  }

  private cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-fallback',
      '[data-chatseller]',
      '.chatseller-widget',
      '.chatseller-button'
    ]
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
  }

  private async loadShopConfigurationAsync(): Promise<void> {
    try {
      console.log('🔄 Chargement configuration shop:', this.config.shopId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
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
        
        console.log('✅ Configuration chargée:', {
          shop: this.shopConfig?.id,
          agent: this.agentConfig?.name
        })
      }
      
    } catch (error) {
      console.warn('⚠️ Configuration par défaut utilisée:', error)
    }
  }

  private updateWidgetWithConfig(): void {
    if (!this.widgetElement || !this.shopConfig) return

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      const primaryColor = this.config.primaryColor || '#3B82F6'
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
      
      // ✅ Appliquer les bordures arrondies correctement
      const borderRadius = this.config.borderRadius || 'md'
      triggerBtn.style.borderRadius = this.getBorderRadiusValue(borderRadius)
      
      const textSpan = triggerBtn.querySelector('span')
      if (textSpan && this.config.buttonText) {
        textSpan.textContent = this.config.buttonText
      }
    }
  }

  private getBorderRadiusValue(radius: string): string {
    const radiusMap = {
      'none': '0px',
      'sm': '4px', 
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
      'full': '50px'
    }
    return radiusMap[radius as keyof typeof radiusMap] || '8px'
  }

  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.primaryColor || this.config.primaryColor,
        buttonText: this.shopConfig.buttonText || this.config.buttonText,
        position: this.shopConfig.position || this.config.position,
        theme: this.shopConfig.theme || this.config.theme,
        language: this.shopConfig.language || this.config.language
      }
    }

    if (this.agentConfig) {
      this.config.agentConfig = {
        id: this.agentConfig.id,
        name: this.agentConfig.name,
        title: this.agentConfig.title || this.getDefaultTitle(this.agentConfig.type),
        avatar: this.agentConfig.avatar,
        welcomeMessage: this.agentConfig.welcomeMessage,
        fallbackMessage: this.agentConfig.fallbackMessage
      }
    }
  }

  private getDefaultTitle(type: string): string {
    const titles = {
      'general': 'Conseiller commercial',
      'product_specialist': 'Spécialiste produit',
      'support': 'Conseiller support',
      'upsell': 'Conseiller premium'
    }
    return titles[type as keyof typeof titles] || 'Conseiller commercial'
  }

  private detectProductInfo(): boolean {
    try {
      console.log('🔍 Détection produit Shopify...')
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId

      // ✅ Shopify Analytics (le plus fiable)
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString()
        console.log('✅ Produit Shopify détecté:', detectedName)
      }
      
      // ✅ Sélecteurs CSS Shopify spécifiques
      if (!detectedName) {
        const titleSelectors = [
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title'
        ]
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            break
          }
        }
      }

      if (!detectedPrice) {
        const priceSelectors = [
          '.price__current',
          '.product-form__price .price',
          '.money'
        ]
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', '.'))
              break
            }
          }
        }
      }

      // ✅ Mettre à jour la config
      if (detectedName) this.config.productName = detectedName
      if (detectedPrice) this.config.productPrice = detectedPrice
      if (detectedId) this.config.productId = detectedId
      if (!this.config.productUrl) this.config.productUrl = window.location.href

      return !!(detectedName || detectedPrice)

    } catch (error) {
      console.warn('⚠️ Erreur détection produit:', error)
      return false
    }
  }

  private createWidget() {
    let container = document.getElementById('chatseller-widget')
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      container.style.cssText = 'margin: 8px 0; position: relative; z-index: 999999;'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // ✅ Sélecteurs Shopify prioritaires
    const shopifyCtaSelectors = [
      '.product-form__buttons',
      'form[action*="/cart/add"] button[type="submit"]',
      '.product-form button[name="add"]',
      '.shopify-payment-button',
      '.add-to-cart',
      'button[name="add"]'
    ]
    
    let targetElement = null
    
    for (const selector of shopifyCtaSelectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) {
        console.log(`✅ Élément CTA trouvé: ${selector}`)
        break
      }
    }
    
    if (targetElement) {
      try {
        if (position === 'above-cta') {
          targetElement.parentNode?.insertBefore(container, targetElement)
        } else if (position === 'below-cta') {
          targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
        } else {
          targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
        }
        
        console.log('✅ Widget inséré avec succès')
        return
      } catch (error) {
        console.warn('⚠️ Erreur insertion:', error)
      }
    }
    
    // ✅ Fallback : ajouter au body seulement si pas disableFallback
    if (!this.config.disableFallback) {
      console.log('⚠️ Fallback: insertion body')
      container.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        max-width: 280px !important;
      `
      document.body.appendChild(container)
    }
  }

  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à un conseiller'
    const primaryColor = this.config.primaryColor || '#3B82F6'

    this.widgetElement.innerHTML = `
      <div style="width: 100%; margin: 8px 0; position: relative;">
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
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            outline: none;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0, 0, 0, 0.25)'"
          onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 8px 25px rgba(0, 0, 0, 0.15)'"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
          <span>${buttonText}</span>
        </button>
      </div>
    `

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      // ✅ CORRECTION MAJEURE: Ouvrir directement le chat, pas de fallback
      triggerBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.openChat() // ✅ Ouvrir directement
      })
    }
  }

  // ✅ OUVERTURE CHAT DIRECTE
  private async openChat() {
    if (this.isOpen) return

    this.isOpen = true
    console.log('💬 Ouverture chat direct')
    
    // ✅ Charger et ouvrir le composant Vue
    this.createChatModal()
  }

  private createChatModal() {
    if (this.modalElement) {
      this.modalElement.remove()
    }

    // ✅ Pour l'instant, modal simple en attendant la refonte
    this.createSimpleChatModal()
  }

  private createSimpleChatModal() {
    const agentName = this.config.agentConfig?.name || 'Assistant'
    const agentTitle = this.config.agentConfig?.title || 'Conseiller commercial'
    const primaryColor = this.config.primaryColor || '#3B82F6'

    this.modalElement = document.createElement('div')
    this.modalElement.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(4px);
        z-index: 2147483647; display: flex; align-items: center;
        justify-content: center; padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          width: 480px; height: 700px; max-height: 90vh;
          background: white; border-radius: 16px;
          box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
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
              ">
                ${agentName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${agentName}</h3>
                <p style="margin: 2px 0 0 0; font-size: 14px; opacity: 0.9;">${agentTitle}</p>
              </div>
            </div>
            <button id="chatseller-close-btn" style="
              background: rgba(255, 255, 255, 0.1); color: white;
              border: none; border-radius: 50%; width: 40px; height: 40px;
              cursor: pointer; display: flex; align-items: center; justify-content: center;
            ">✕</button>
          </div>
          
          ${this.config.productName ? `
          <div style="
            padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;
            display: flex; align-items: center; justify-content: space-between;
          ">
            <div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">${this.config.productName}</h4>
              ${this.config.productPrice ? `<p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: ${primaryColor};">${this.config.productPrice} FCFA</p>` : ''}
            </div>
          </div>
          ` : ''}
          
          <div style="flex: 1; padding: 20px; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
            <div style="text-align: center;">
              <p style="margin: 0; font-size: 16px; color: #374151;">
                Interface de chat en cours de chargement...
              </p>
              <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
                La nouvelle interface sera prête sous peu
              </p>
            </div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())
  }

  private closeChat() {
    this.isOpen = false
    if (this.modalElement) {
      this.modalElement.remove()
      this.modalElement = null
    }
  }

  private adjustColor(color: string, percent: number): string {
    try {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      const adjust = (channel: number) => {
        const adjusted = channel + (channel * percent / 100)
        return Math.max(0, Math.min(255, Math.round(adjusted)))
      }
      
      return `rgb(${adjust(r)}, ${adjust(g)}, ${adjust(b)})`
    } catch (error) {
      return color
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

  // ✅ MÉTHODES PUBLIQUES
  async sendMessage(message: string, conversationId?: string | null, options?: any): Promise<any> {
    try {
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
      this.modalElement.remove()
      this.modalElement = null
    }
    this.isInitialized = false
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get version(): string {
    return '1.2.0'
  }
}

// ✅ EXPORT
const chatSeller = new ChatSeller()

// ✅ AUTO-INIT SÉCURISÉ
document.addEventListener('DOMContentLoaded', () => {
  if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
    chatSeller.init((window as any).ChatSellerConfig)
  }
})

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
      chatSeller.init((window as any).ChatSellerConfig)
    }
  }, 1000)
}

declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
  }
}

window.ChatSeller = chatSeller

export default chatSeller