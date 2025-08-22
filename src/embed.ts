// src/embed.ts - ChatSeller Widget for Shopify
import { createApp, App as VueApp } from 'vue'
import ChatSellerWidget from './ChatSellerWidget.vue'

export interface ChatSellerConfig {
  shopId: string
  agentId?: string
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
  private cssLoaded = false

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#EC4899', // ✅ Rose par défaut comme dans les captures
      position: 'above-cta',
      buttonText: 'Parler à la vendeuse',
      borderRadius: 'full',
      language: 'fr',
      autoDetectProduct: true,
      debug: false,
      disableFallback: false 
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
      // ✅ FORCER LE CHARGEMENT CSS EN PREMIER - CRITIQUE
      await this.forceLoadCSS()
      
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

  // ✅ INJECTION CSS CRITIQUE MODERNE - CONFORME CAPTURES 5 & 6
  private async forceLoadCSS(): Promise<void> {
    if (this.cssLoaded) return
    
    console.log('🎨 [CSS CRITIQUE] Injection CSS moderne Shopify...')
    
    // ✅ INJECTION CSS INLINE IMMÉDIATE (moderne et optimisé)
    const style = document.createElement('style')
    style.id = 'chatseller-critical-css'
    style.textContent = `
/* 🔥 CHATSELLER WIDGET - CSS CRITIQUE MODERNE - CONFORME CAPTURES 5 & 6 */
.cs-chatseller-widget, .cs-chatseller-widget * {
  all: unset !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif !important;
  line-height: normal !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
}

.cs-chatseller-widget {
  position: relative !important;
  z-index: 999999 !important;
  display: block !important;
  margin: 8px 0 !important;
  width: 100% !important;
  contain: layout style !important;
  isolation: isolate !important;
}

/* BOUTON TRIGGER MODERNE */
.cs-chat-trigger-button {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  padding: 16px 24px !important;
  background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%) !important;
  color: white !important;
  border: none !important;
  border-radius: 50px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3) !important;
  min-height: 56px !important;
  font-family: inherit !important;
  text-decoration: none !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  user-select: none !important;
}

.cs-chat-trigger-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4) !important;
  background: linear-gradient(135deg, #F472B6 0%, #EC4899 100%) !important;
}

.cs-chat-trigger-button svg {
  width: 20px !important;
  height: 20px !important;
  margin-right: 8px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2 !important;
  flex-shrink: 0 !important;
}

.cs-chat-trigger-button span {
  color: inherit !important;
  font-size: inherit !important;
  font-weight: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
}

/* MODAL OVERLAY - PRIORITÉ MAXIMALE */
.cs-chat-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 20px !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif !important;
  margin: 0 !important;
  border: none !important;
  outline: none !important;
  contain: layout style !important;
}

.cs-chat-modal-overlay.cs-mobile {
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}

/* CONTAINER CHAT DESKTOP MODERNE */
.cs-chat-container-desktop {
  width: 450px !important;
  height: 650px !important;
  max-height: 85vh !important;
  max-width: 95vw !important;
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative !important;
  transform: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  font-family: inherit !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
}

/* CONTAINER MOBILE */
.cs-chat-container-mobile {
  width: 100% !important;
  height: 100% !important;
  background: white !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative !important;
  z-index: 1 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

/* HEADER MODERNE */
.cs-desktop-header, .cs-mobile-header {
  padding: 20px !important;
  color: white !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-shrink: 0 !important;
  min-height: 85px !important;
  margin: 0 !important;
  border: none !important;
  position: relative !important;
  z-index: 1 !important;
}

.cs-mobile-header {
  padding: 16px 20px !important;
  min-height: 75px !important;
}

/* RESPONSIVE */
@media (max-width: 767px) {
  .cs-chat-container-desktop {
    width: 100% !important;
    height: 100% !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
    border: none !important;
  }
  
  .cs-chat-modal-overlay {
    padding: 0 !important;
  }
}

/* ANIMATIONS */
@keyframes cs-fadeIn {
  0% { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

.cs-modal-enter-active {
  animation: cs-fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cs-chat-container-desktop {
  animation: cs-fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* PRINT MEDIA */
@media print {
  .cs-chatseller-widget, .cs-chat-modal-overlay {
    display: none !important;
  }
}

/* ISOLATION FINALE */
.cs-chatseller-widget {
  contain: layout style !important;
  isolation: isolate !important;
}
    `
    
    document.head.appendChild(style)
    this.cssLoaded = true
    
    console.log('✅ [CSS CRITIQUE] CSS moderne injecté directement')
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
      
      // ✅ URL ROUTE PUBLIQUE SANS AUTH
      const url = `${this.config.apiUrl}/api/v1/public/shops/public/${this.config.shopId}/config`
      console.log('🔗 URL API appelée:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 Réponse API status:', response.status)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
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
      } else {
        throw new Error('Configuration API non valide')
      }
      
    } catch (error) {
      console.warn('⚠️ Erreur configuration API:', error)
      console.log('🔧 Utilisation configuration par défaut')
    }
  }

  private updateWidgetWithConfig(): void {
    if (!this.widgetElement || !this.shopConfig) return

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      const primaryColor = this.shopConfig.widget_config?.primaryColor || this.config.primaryColor || '#EC4899'
      
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
    }
  }

  private getBorderRadiusValue(radius: string): string {
    const radiusMap = {
      'none': '0px',
      'sm': '6px', 
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
      'full': '50px'
    }
    const value = radiusMap[radius as keyof typeof radiusMap] || '50px'
    return value
  }

  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.primaryColor || this.config.primaryColor,
        buttonText: this.shopConfig.buttonText || this.config.buttonText,
        position: this.shopConfig.position || this.config.position,
        theme: this.shopConfig.theme || this.config.theme,
        language: this.shopConfig.language || this.config.language,
        borderRadius: this.shopConfig.borderRadius || this.config.borderRadius
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
    return titles[type as keyof typeof titles] || 'Vendeuse IA'
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
      container.className = 'cs-chatseller-widget'
      container.style.cssText = 'margin: 8px 0; position: relative; z-index: 999999;'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
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

  // ✅ RENDU WIDGET MODERNE
  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à la vendeuse'
    const primaryColor = this.config.primaryColor || '#EC4899'
    const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'full')

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
            border-radius: ${borderRadius};
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
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
            min-height: 56px;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(236, 72, 153, 0.4)'"
          onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 8px 25px rgba(236, 72, 153, 0.3)'"
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

  private openChat() {
    if (this.isOpen) return

    this.isOpen = true
    console.log('💬 Ouverture chat moderne avec CSS forcé')
    
    try {
      this.createVueChatModal()
    } catch (error) {
      console.error('❌ Erreur ouverture chat Vue:', error)
      this.createSimpleChatModal()
    }
  }

  private createVueChatModal() {
    this.modalElement = document.createElement('div')
    this.modalElement.id = 'chatseller-vue-modal'
    this.modalElement.className = 'cs-chat-modal-overlay'
    
    const isMobile = window.innerWidth < 768
    if (isMobile) {
      this.modalElement.classList.add('cs-mobile')
    }
    
    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(12px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: ${isMobile ? 'stretch' : 'center'} !important;
      justify-content: ${isMobile ? 'stretch' : 'center'} !important;
      padding: ${isMobile ? '0' : '20px'} !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `

    document.body.appendChild(this.modalElement)

    this.initVueWidget()

    if (!isMobile) {
      this.modalElement.addEventListener('click', (e) => {
        if (e.target === this.modalElement) {
          this.closeChat()
        }
      })
    }
  }

  private initVueWidget(): void {
    try {
      console.log('🎨 Initialisation composant Vue moderne...')
      
      if (!this.modalElement) {
        throw new Error('Modal element non trouvé')
      }
      
      // ✅ CONFIGURATION COMPLÈTE POUR VUE MODERNE
      const widgetConfig = {
        shopId: this.config.shopId,
        apiUrl: this.config.apiUrl,
        agentConfig: this.config.agentConfig || {
          name: 'Anna',
          title: 'Vendeuse IA'
        },
        primaryColor: this.config.primaryColor,
        buttonText: this.config.buttonText,
        borderRadius: this.config.borderRadius,
        language: this.config.language,
        productId: this.config.productId,
        productName: this.config.productName,
        productPrice: this.config.productPrice,
        productUrl: this.config.productUrl
      }

      this.vueApp = createApp(ChatSellerWidget, {
        config: widgetConfig
      })

      this.vueApp.mount(this.modalElement)

      console.log('✅ Composant Vue moderne initialisé')

    } catch (error) {
      console.error('❌ Erreur initialisation Vue:', error)
      throw error
    }
  }

  private createSimpleChatModal() {
    const agentName = this.config.agentConfig?.name || 'Anna'
    const agentTitle = this.config.agentConfig?.title || 'Vendeuse IA'
    const primaryColor = this.config.primaryColor || '#EC4899'

    this.modalElement = document.createElement('div')
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.innerHTML = `
      <div class="cs-chat-container-desktop" style="
        width: 450px; height: 650px; max-height: 85vh;
        background: white; border-radius: 24px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
        display: flex; flex-direction: column; overflow: hidden;
        position: relative; opacity: 1; visibility: visible;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
      ">
        <div class="cs-desktop-header" style="
          padding: 20px; background: ${primaryColor}; color: white;
          display: flex; align-items: center; justify-content: space-between; min-height: 85px;
        ">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="
              width: 48px; height: 48px; border-radius: 50%;
              background: rgba(255, 255, 255, 0.2);
              display: flex; align-items: center; justify-content: center;
              font-weight: 700; font-size: 18px; color: white;
            ">
              ${agentName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 700; color: white;">${agentName} - ${agentTitle}</h3>
              <p style="margin: 0; font-size: 14px; opacity: 0.95; color: white; font-weight: 500;">En ligne maintenant</p>
            </div>
          </div>
          <button id="chatseller-close-btn" class="cs-close-button" style="
            background: rgba(255, 255, 255, 0.15); color: white;
            border: none; border-radius: 50%; width: 40px; height: 40px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
          ">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div style="flex: 1; padding: 24px; display: flex; align-items: center; justify-content: center; background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);">
          <div style="text-align: center;">
            <p style="margin: 0; font-size: 16px; color: #374151; font-weight: 500;">
              🔧 Chargement du chat moderne...
            </p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6b7280;">
              Interface conforme aux captures 5 & 6
            </p>
          </div>
        </div>
      </div>
    `

    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(12px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif !important;
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

  // ✅ API OPTIMISÉE
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

      const url = `${this.config.apiUrl}/api/v1/public/chat`
      console.log('📤 Envoi message API:', url, payload)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('📥 Réponse API status:', response.status)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📥 Réponse API data:', result)

      return result

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
    return '1.4.0'
  }
}

// ✅ EXPORT ET AUTO-INIT OPTIMISÉ POUR SHOPIFY
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