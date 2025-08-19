// src/embed.ts
import { createApp, App as VueApp } from 'vue'
import ChatSellerWidget from './ChatSellerWidget.vue'

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
  private vueApp: any = null
  private initAttempts = 0

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#3B82F6',
      position: 'above-cta',
      buttonText: 'Parler à un conseiller',
      borderRadius: 'md', // ✅ AJOUT VALEUR PAR DÉFAUT
      language: 'fr',
      autoDetectProduct: true,
      debug: false,
      disableFallback: false // ✅ CHANGÉ À FALSE POUR SHOPIFY
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
      // ✅ CHARGER CSS ISOLÉ EN PREMIER
      await this.loadIsolatedCSS()
      
      await this.waitForDOM()
      this.cleanupExistingWidgets()
      this.createWidget()
      
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      this.isInitialized = true
      this.loadShopConfigurationAsync()
      
      const initTime = performance.now() - startTime
      console.log(`✅ ChatSeller widget initialisé en ${initTime.toFixed(2)}ms`)
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
    }
  }

  // ✅ NOUVELLE MÉTHODE : Charger CSS isolé
  private async loadIsolatedCSS(): Promise<void> {
    try {
      // Vérifier si CSS déjà chargé
      if (document.getElementById('chatseller-isolated-css')) {
        return
      }

      const link = document.createElement('link')
      link.id = 'chatseller-isolated-css'
      link.rel = 'stylesheet'
      link.href = 'https://widget.chatseller.app/widget-isolated.css'
      link.crossOrigin = 'anonymous'
      
      // Promise pour attendre le chargement
      return new Promise((resolve, reject) => {
        link.onload = () => {
          console.log('✅ CSS isolé ChatSeller chargé')
          resolve()
        }
        link.onerror = () => {
          console.warn('⚠️ Échec chargement CSS isolé, utilisation inline')
          resolve() // Ne pas bloquer
        }
        
        document.head.appendChild(link)
        
        // Timeout de sécurité
        setTimeout(resolve, 1000)
      })
    } catch (error) {
      console.warn('⚠️ Erreur chargement CSS isolé:', error)
    }
  }

  private cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-modal',
      '#chatseller-vue-modal',
      '[data-chatseller]',
      '.chatseller-widget',
      '.cs-chatseller-widget'
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
      
      // ✅ CORRECTION : URL ROUTE PUBLIQUE CORRIGÉE
      const response = await fetch(`${this.config.apiUrl}/api/v1/shops/public/${this.config.shopId}/config`, {
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
          agent: this.agentConfig?.name,
          title: this.agentConfig?.title
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
      const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'md') // ✅ CORRECTION
      
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
      triggerBtn.style.borderRadius = borderRadius // ✅ CORRECTION PRINCIPALE
      
      const textSpan = triggerBtn.querySelector('span')
      if (textSpan && this.config.buttonText) {
        textSpan.textContent = this.config.buttonText
      }
      
      console.log(`🎨 Widget mis à jour: couleur=${primaryColor}, borderRadius=${borderRadius}`)
    }
  }

  // ✅ CORRECTION : Méthode getBorderRadiusValue corrigée
  private getBorderRadiusValue(radius: string): string {
    const radiusMap = {
      'none': '0px',
      'sm': '6px', 
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
      'full': '50px'
    }
    const value = radiusMap[radius as keyof typeof radiusMap] || '12px'
    console.log(`🎨 BorderRadius calculé: ${radius} → ${value}`)
    return value
  }

  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      // ✅ MERGE AVEC PRIORITÉ AUX DONNÉES API
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.primaryColor || this.config.primaryColor,
        buttonText: this.shopConfig.buttonText || this.config.buttonText,
        position: this.shopConfig.position || this.config.position,
        theme: this.shopConfig.theme || this.config.theme,
        language: this.shopConfig.language || this.config.language,
        borderRadius: this.shopConfig.borderRadius || this.config.borderRadius // ✅ AJOUT
      }
    }

    if (this.agentConfig) {
      this.config.agentConfig = {
        id: this.agentConfig.id,
        name: this.agentConfig.name,
        title: this.agentConfig.title || this.getDefaultTitle(this.agentConfig.type),
        avatar: this.agentConfig.avatar,
        welcomeMessage: this.agentConfig.welcomeMessage,
        fallbackMessage: this.agentConfig.fallbackMessage,
        personality: this.agentConfig.personality
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
    return titles[type as keyof typeof titles] || 'Assistant commercial'
  }

  private detectProductInfo(): boolean {
    try {
      console.log('🔍 Détection produit Shopify...')
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId

      // ✅ AMÉLIORATION : Détection Shopify plus robuste
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString()
        console.log('✅ Produit Shopify détecté:', detectedName)
      }
      
      // ✅ AMÉLIORATION : Sélecteurs Shopify plus complets
      if (!detectedName) {
        const titleSelectors = [
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title',
          '.product__heading h1',
          '[class*="product-title"]',
          '[class*="product__title"]'
        ]
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            console.log(`✅ Titre produit détecté via ${selector}:`, detectedName)
            break
          }
        }
      }

      if (!detectedPrice) {
        const priceSelectors = [
          '.price__current',
          '.product-form__price .price',
          '.money',
          '.price-current',
          '[class*="price-current"]',
          '[class*="product-price"]'
        ]
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', '.'))
              console.log(`✅ Prix produit détecté via ${selector}:`, detectedPrice)
              break
            }
          }
        }
      }

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
      // ✅ AJOUT CLASSE CSS ISOLÉE
      container.className = 'cs-chatseller-widget'
      container.style.cssText = 'margin: 8px 0; position: relative; z-index: 999999;'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // ✅ AMÉLIORATION : Sélecteurs Shopify plus complets
    const shopifyCtaSelectors = [
      '.product-form__buttons',
      'form[action*="/cart/add"] button[type="submit"]',
      '.product-form button[name="add"]',
      '.shopify-payment-button',
      '.add-to-cart',
      'button[name="add"]',
      '.product-form__cart',
      '.product__buttons',
      '.product-single__buttons',
      '[class*="add-to-cart"]',
      '[class*="product-form"]'
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
    
    // ✅ FALLBACK : Chercher dans le form produit
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                       document.querySelector('.product-form') ||
                       document.querySelector('.product-single')
    
    if (productForm) {
      try {
        productForm.appendChild(container)
        console.log('✅ Widget inséré dans le formulaire produit')
        return
      } catch (error) {
        console.warn('⚠️ Erreur insertion form:', error)
      }
    }
    
    if (!this.config.disableFallback) {
      console.log('⚠️ Fallback: insertion body')
      container.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        max-width: 280px !important;
      `
      container.className = 'cs-chatseller-widget cs-chatseller-widget-fallback'
      document.body.appendChild(container)
    }
  }

  // ✅ CORRECTION : Renderig avec borderRadius appliqué
  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à un conseiller'
    const primaryColor = this.config.primaryColor || '#3B82F6'
    const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'md') // ✅ CORRECTION

    this.widgetElement.innerHTML = `
      <div style="width: 100%; margin: 8px 0; position: relative;">
        <button 
          id="chatseller-trigger-btn"
          class="cs-chat-trigger-button"
          style="
            width: 100%;
            padding: 16px 24px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%);
            color: white;
            border: none;
            border-radius: ${borderRadius}; /* ✅ CORRECTION PRINCIPALE */
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
            text-transform: none;
            letter-spacing: normal;
            line-height: 1.5;
            position: relative;
            z-index: 1;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(0, 0, 0, 0.25)'"
          onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 8px 25px rgba(0, 0, 0, 0.15)'"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
          <span style="color: inherit; font-size: inherit; font-weight: inherit; margin: 0; padding: 0;">${buttonText}</span>
        </button>
      </div>
    `

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      triggerBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.openChat()
      })
      
      console.log(`🎨 Bouton rendu avec borderRadius: ${borderRadius}`)
    }
  }

  // ✅ AMÉLIORATION : Ouverture chat avec CSS isolé
  private openChat() {
    if (this.isOpen) return

    this.isOpen = true
    console.log('💬 Ouverture chat avec CSS isolé')
    
    try {
      this.createVueChatModal()
    } catch (error) {
      console.error('❌ Erreur ouverture chat Vue:', error)
      this.createSimpleChatModal() // Fallback
    }
  }

  // ✅ AMÉLIORATION : Modal Vue avec CSS isolé
  private createVueChatModal() {
    // ✅ Créer le container modal avec classes CSS isolées
    this.modalElement = document.createElement('div')
    this.modalElement.id = 'chatseller-vue-modal'
    this.modalElement.className = 'cs-chat-modal-overlay'
    
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      this.modalElement.classList.add('cs-mobile')
    }
    
    // ✅ STYLES INLINE RENFORCÉS POUR SHOPIFY
    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(8px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: ${isMobile ? 'stretch' : 'center'} !important;
      justify-content: ${isMobile ? 'stretch' : 'center'} !important;
      padding: ${isMobile ? '0' : '16px'} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `

    document.body.appendChild(this.modalElement)

    // ✅ INITIALISER VUE AVEC CONFIG COMPLÈTE
    this.initVueWidget()

    // ✅ Fermeture sur clic overlay (desktop seulement)
    if (!isMobile) {
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
          this.closeChat()
        }
      })
    }
  }

  // ✅ AMÉLIORATION : Init Vue avec config complète
  private initVueWidget(): void {
    try {
      console.log('🎨 Initialisation composant Vue avec CSS isolé...')
      
      if (!this.modalElement) {
        throw new Error('Modal element non trouvé')
      }
      
      // ✅ CONFIGURATION COMPLÈTE POUR VUE
      const widgetConfig = {
        shopId: this.config.shopId,
        apiUrl: this.config.apiUrl,
        agentConfig: this.config.agentConfig || {
          name: 'Assistant',
          title: 'Conseiller commercial'
        },
        primaryColor: this.config.primaryColor,
        buttonText: this.config.buttonText,
        borderRadius: this.config.borderRadius, // ✅ AJOUT
        language: this.config.language,
        productId: this.config.productId,
        productName: this.config.productName,
        productPrice: this.config.productPrice,
        productUrl: this.config.productUrl
      }

      // ✅ CRÉER APP VUE
      this.vueApp = createApp(ChatSellerWidget, {
        config: widgetConfig
      })

      // ✅ MONTER SUR LE MODAL
      this.vueApp.mount(this.modalElement)

      console.log('✅ Composant Vue initialisé avec CSS isolé')

    } catch (error) {
      console.error('❌ Erreur initialisation Vue:', error)
      throw error
    }
  }

  // ✅ AMÉLIORATION : Fallback simple avec CSS isolé
  private createSimpleChatModal() {
    const agentName = this.config.agentConfig?.name || 'Assistant'
    const agentTitle = this.config.agentConfig?.title || 'Conseiller commercial'
    const primaryColor = this.config.primaryColor || '#3B82F6'

    this.modalElement = document.createElement('div')
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.innerHTML = `
      <div class="cs-chat-container-desktop" style="
        width: 520px; height: 680px; max-height: 90vh;
        background: white; border-radius: 20px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        display: flex; flex-direction: column; overflow: hidden;
        position: relative; opacity: 1; visibility: visible;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div class="cs-desktop-header" style="
          padding: 24px; background: ${primaryColor}; color: white;
          display: flex; align-items: center; justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 48px; height: 48px; border-radius: 50%;
              background: rgba(255, 255, 255, 0.2);
              display: flex; align-items: center; justify-content: center;
              font-weight: 600; font-size: 18px; color: white;
            ">
              ${agentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">${agentName}</h3>
              <p style="margin: 2px 0 0 0; font-size: 14px; opacity: 0.9; color: white;">${agentTitle}</p>
            </div>
          </div>
          <button id="chatseller-close-btn" class="cs-close-button" style="
            background: rgba(255, 255, 255, 0.1); color: white;
            border: none; border-radius: 50%; width: 40px; height: 40px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
          ">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div style="flex: 1; padding: 20px; display: flex; align-items: center; justify-content: center; background: #f8fafc;">
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #374151;">
              🔧 Chargement du chat avec CSS isolé...
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
              Initialisation en cours...
            </p>
          </div>
        </div>
      </div>
    `

    // ✅ STYLES INLINE FORCÉS
    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.6) !important;
      backdrop-filter: blur(8px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 16px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())
  }

  private closeChat() {
    this.isOpen = false
    if (this.modalElement) {
      // ✅ Nettoyer l'app Vue
      if (this.vueApp) {
        this.vueApp.unmount()
        this.vueApp = null
      }
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

      const response = await fetch(`${this.config.apiUrl}/api/v1/public/chat`, {
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
      if (this.vueApp) {
        this.vueApp.unmount()
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    this.isInitialized = false
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get version(): string {
    return '1.2.3' // ✅ VERSION MISE À JOUR
  }
}

// ✅ EXPORT ET AUTO-INIT AMÉLIORÉ
const chatSeller = new ChatSeller()

// ✅ AUTO-INIT SÉCURISÉ POUR SHOPIFY
document.addEventListener('DOMContentLoaded', () => {
  if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
    chatSeller.init((window as any).ChatSellerConfig)
  }
})

// ✅ FALLBACK POUR SHOPIFY (chargement asynchrone)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
      chatSeller.init((window as any).ChatSellerConfig)
    }
  }, 1000)
}

// ✅ SUPPORT SHOPIFY SECTIONS DYNAMIQUES
if (typeof (window as any).Shopify !== 'undefined' || window.location.hostname.includes('myshopify.com')) {
  document.addEventListener('shopify:section:load', () => {
    setTimeout(() => {
      if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
        chatSeller.init((window as any).ChatSellerConfig)
      }
    }, 500)
  })
}

declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
  }
}

window.ChatSeller = chatSeller

export default chatSeller