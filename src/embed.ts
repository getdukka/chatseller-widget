// src/embed.ts - ChatSeller Widget for Shopify - VERSION CORRIGÉE COMPLÈTE
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

    console.log(`🚀 Initialisation ChatSeller widget moderne (tentative ${this.initAttempts})...`, config.shopId)
    const startTime = performance.now()

    this.config = { ...this.config, ...config }

    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId requis')
      return
    }

    try {
      // ✅ ÉTAPE 1: INJECTION CSS CRITIQUE IMMÉDIATE - PRIORITÉ ABSOLUE
      await this.injectCriticalCSS()
      
      // ✅ ÉTAPE 2: ATTENDRE DOM ET NETTOYER
      await this.waitForDOM()
      this.cleanupExistingWidgets()
      
      // ✅ ÉTAPE 3: DÉTECTION PRODUIT AMÉLIORÉE
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      // ✅ ÉTAPE 4: CHARGEMENT CONFIG SHOP + CRÉATION WIDGET EN PARALLÈLE
      const configPromise = this.loadShopConfigurationAsync()
      this.createWidget()
      
      // Attendre la config (non bloquant)
      await configPromise
      
      this.isInitialized = true
      
      const initTime = performance.now() - startTime
      console.log(`✅ ChatSeller widget moderne initialisé en ${initTime.toFixed(2)}ms`)
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller moderne:', error)
    }
  }

  // ✅ INJECTION CSS CRITIQUE ULTRA-RENFORCÉE ANTI-SHOPIFY
  private async injectCriticalCSS(): Promise<void> {
    if (this.cssLoaded) return
    
    console.log('🎨 [CSS CRITIQUE] Injection CSS moderne ultra-renforcé anti-Shopify...')
    
    // ✅ SUPPRESSION PRÉVENTIVE DES ANCIENS STYLES
    const oldStyles = document.querySelectorAll('#chatseller-critical-css, [data-chatseller-css]')
    oldStyles.forEach(style => style.remove())
    
    // ✅ INJECTION CSS INLINE IMMÉDIATE ULTRA-ISOLÉE
    const style = document.createElement('style')
    style.id = 'chatseller-critical-css'
    style.setAttribute('data-chatseller-css', 'critical')
    
    // ✅ CSS ULTRA-RENFORCÉ ANTI-SHOPIFY AVEC SPECIFICITÉ MAXIMALE
    style.textContent = `
/* 🔥 CHATSELLER WIDGET - CSS ULTRA-RENFORCÉ ANTI-SHOPIFY - v1.4.0 */

/* ✅ RESET GLOBAL ABSOLU AVEC SPECIFICITÉ MAXIMALE */
.cs-chatseller-widget, 
.cs-chatseller-widget *, 
.cs-chatseller-widget *::before, 
.cs-chatseller-widget *::after,
[data-chatseller] *,
[data-chatseller] *::before,
[data-chatseller] *::after {
  all: unset !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', 'Helvetica Neue', Arial, sans-serif !important;
  line-height: normal !important;
  -webkit-font-smoothing: antialiased !important;
  -moz-osx-font-smoothing: grayscale !important;
  text-rendering: optimizeLegibility !important;
  color: inherit !important;
  background: transparent !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
  text-decoration: none !important;
  list-style: none !important;
  vertical-align: baseline !important;
  text-align: left !important;
  direction: ltr !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  word-spacing: normal !important;
  text-shadow: none !important;
  filter: none !important;
  clip: unset !important;
  clip-path: none !important;
  mask: none !important;
  mix-blend-mode: normal !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

/* ✅ WIDGET PRINCIPAL AVEC ISOLATION MAXIMALE */
.cs-chatseller-widget {
  position: relative !important;
  z-index: 999999 !important;
  display: block !important;
  margin: 8px 0 !important;
  width: 100% !important;
  contain: layout style !important;
  isolation: isolate !important;
  font-size: 14px !important;
  font-weight: normal !important;
  color: #374151 !important;
  background: transparent !important;
}

/* ✅ BOUTON TRIGGER MODERNE AVEC GRADIENT */
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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3) !important;
  min-height: 56px !important;
  font-family: inherit !important;
  text-decoration: none !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  user-select: none !important;
  position: relative !important;
  overflow: hidden !important;
  z-index: 1 !important;
}

.cs-chat-trigger-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4) !important;
  background: linear-gradient(135deg, #F472B6 0%, #EC4899 100%) !important;
}

.cs-chat-trigger-button:active {
  transform: translateY(0px) !important;
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
  line-height: 1.4 !important;
}

/* ✅ MODAL OVERLAY AVEC PRIORITÉ Z-INDEX MAXIMALE */
.cs-chat-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
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
  font-family: inherit !important;
  margin: 0 !important;
  border: none !important;
  outline: none !important;
  contain: layout style !important;
  overflow: hidden !important;
}

.cs-chat-modal-overlay.cs-mobile {
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}

/* ✅ CONTAINER DESKTOP MODERNE CONFORME AUX CAPTURES */
.cs-chat-container-desktop {
  width: 450px !important;
  height: 650px !important;
  max-height: 85vh !important;
  max-width: 95vw !important;
  background: #ffffff !important;
  border-radius: 24px !important;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.2),
    0 10px 10px -5px rgba(0, 0, 0, 0.1) !important;
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
  color: #374151 !important;
  line-height: 1.5 !important;
  font-size: 14px !important;
  font-weight: normal !important;
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
  animation: cs-fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* ✅ CONTAINER MOBILE PLEIN ÉCRAN */
.cs-chat-container-mobile {
  width: 100% !important;
  height: 100% !important;
  background: #ffffff !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  transform: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  font-family: inherit !important;
  color: #374151 !important;
  line-height: 1.5 !important;
  font-size: 14px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  position: relative !important;
  z-index: 1 !important;
}

/* ✅ RESPONSIVE ULTRA-RENFORCÉ */
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

/* ✅ ANIMATIONS FLUIDES */
@keyframes cs-fadeIn {
  0% { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

.cs-modal-enter-active {
  animation: cs-fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ✅ PROTECTION PRINT MEDIA */
@media print {
  .cs-chatseller-widget, 
  .cs-chat-modal-overlay,
  [data-chatseller] {
    display: none !important;
  }
}

/* ✅ ISOLATION FINALE ABSOLUE */
.cs-chatseller-widget {
  contain: layout style !important;
  isolation: isolate !important;
}

/* ✅ PROTECTION ANTI-INHERITANCE SHOPIFY MAXIMALE */
.cs-chatseller-widget,
.cs-chatseller-widget *,
[data-chatseller],
[data-chatseller] * {
  text-transform: none !important;
  letter-spacing: normal !important;
  word-spacing: normal !important;
  text-shadow: none !important;
  box-shadow: none !important;
  filter: none !important;
  clip: unset !important;
  clip-path: none !important;
  mask: none !important;
  mix-blend-mode: normal !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
  transform: none !important;
  animation: none !important;
  transition: none !important;
}

.cs-chat-trigger-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* ✅ RESET SHOPIFY INPUTS SPÉCIFIQUE */
.cs-chatseller-widget input,
.cs-chatseller-widget textarea,
.cs-chatseller-widget button,
[data-chatseller] input,
[data-chatseller] textarea,
[data-chatseller] button {
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  background-image: none !important;
  background-clip: padding-box !important;
  border-radius: inherit !important;
}

/* ✅ FORCE DISPLAY ABSOLUS */
.cs-chat-modal-overlay {
  display: flex !important;
}

.cs-chat-container-desktop,
.cs-chat-container-mobile {
  display: flex !important;
}

.cs-chat-trigger-button {
  display: flex !important;
}
    `
    
    // ✅ INJECTION PRIORITAIRE DANS LE HEAD
    if (document.head.firstChild) {
      document.head.insertBefore(style, document.head.firstChild)
    } else {
      document.head.appendChild(style)
    }
    
    this.cssLoaded = true
    
    console.log('✅ [CSS CRITIQUE] CSS moderne ultra-renforcé injecté avec succès')
  }

  private cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-modal', 
      '#chatseller-vue-modal',
      '#chatseller-modern-fallback',
      '[data-chatseller]',
      '.chatseller-widget',
      '.cs-chatseller-widget'
    ]
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        console.log(`🧹 Nettoyage widget existant: ${selector}`)
        el.remove()
      })
    })
  }

  // ✅ CHARGEMENT CONFIGURATION SHOP AMÉLIORÉ AVEC TITRE
  private async loadShopConfigurationAsync(): Promise<void> {
    try {
      console.log('🔄 [CONFIG] Chargement configuration shop moderne:', this.config.shopId)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout
      
      // ✅ URL API PUBLIQUE CORRIGÉE
      const url = `${this.config.apiUrl}/api/v1/public/shops/public/${this.config.shopId}/config`
      console.log('🔗 [CONFIG] URL API:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ChatSeller-Widget/1.4.0'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      console.log('📡 [CONFIG] Status API:', response.status)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        this.shopConfig = data.data.shop
        this.agentConfig = data.data.agent
        
        // ✅ FUSION CONFIGURATION AVEC TITRE OBLIGATOIRE
        this.mergeApiConfiguration()
        this.updateWidgetWithConfig()
        
        console.log('✅ [CONFIG] Configuration moderne chargée:', {
          shop: this.shopConfig?.id,
          agent: this.agentConfig?.name,
          title: this.agentConfig?.title, // ✅ NOUVEAU : Log du titre
          primaryColor: this.config.primaryColor,
          buttonText: this.config.buttonText
        })
      } else {
        throw new Error('Configuration API invalide')
      }
      
    } catch (error) {
      console.warn('⚠️ [CONFIG] Erreur configuration API (non critique):', error)
      console.log('🔧 [CONFIG] Utilisation configuration par défaut avec titre')
      
      // ✅ CONFIGURATION FALLBACK AVEC TITRE
      this.agentConfig = {
        name: 'Anna',
        title: 'Vendeuse IA', // ✅ TITRE PAR DÉFAUT
        personality: 'friendly',
        welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?'
      }
    }
  }

  // ✅ FUSION CONFIGURATION API AVEC TITRE OBLIGATOIRE
  private mergeApiConfiguration(): void {
    if (this.shopConfig?.widget_config) {
      this.config = {
        ...this.config,
        primaryColor: this.shopConfig.widget_config.primaryColor || this.config.primaryColor,
        buttonText: this.shopConfig.widget_config.buttonText || this.config.buttonText,
        position: this.shopConfig.widget_config.position || this.config.position,
        theme: this.shopConfig.widget_config.theme || this.config.theme,
        language: this.shopConfig.widget_config.language || this.config.language,
        borderRadius: this.shopConfig.widget_config.borderRadius || this.config.borderRadius
      }
      console.log('✅ [CONFIG] Widget config fusionnée:', this.config.primaryColor, this.config.buttonText)
    }

    if (this.agentConfig) {
      // ✅ TITRE OBLIGATOIRE AVEC FALLBACK INTELLIGENT
      const title = this.agentConfig.title || this.getDefaultTitle(this.agentConfig.type)
      
      this.config.agentConfig = {
        id: this.agentConfig.id,
        name: this.agentConfig.name,
        title: title, // ✅ TITRE GARANTI
        avatar: this.agentConfig.avatar,
        welcomeMessage: this.agentConfig.welcomeMessage,
        fallbackMessage: this.agentConfig.fallbackMessage,
        personality: this.agentConfig.personality
      }
      
      console.log('✅ [CONFIG] Agent config fusionnée avec titre:', {
        name: this.config.agentConfig.name,
        title: this.config.agentConfig.title
      })
    }
  }

  // ✅ TITRE PAR DÉFAUT SELON LE TYPE
  private getDefaultTitle(type: string): string {
    const titles = {
      'general': 'Conseiller commercial',
      'product_specialist': 'Spécialiste produit',
      'support': 'Conseiller support',
      'upsell': 'Conseiller premium'
    }
    return titles[type as keyof typeof titles] || 'Vendeuse IA'
  }

  // ✅ MISE À JOUR WIDGET AVEC NOUVELLE CONFIG
  private updateWidgetWithConfig(): void {
    if (!this.widgetElement) return

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      const primaryColor = this.config.primaryColor || '#EC4899'
      const buttonText = this.config.buttonText || 'Parler à la vendeuse'
      
      // ✅ MISE À JOUR STYLE DYNAMIQUE
      triggerBtn.style.background = `linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)`
      triggerBtn.style.borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'full')
      
      // ✅ MISE À JOUR TEXTE
      const textSpan = triggerBtn.querySelector('span')
      if (textSpan) {
        textSpan.textContent = buttonText
      }
      
      console.log('✅ [CONFIG] Widget bouton mis à jour:', { primaryColor, buttonText })
    }
  }

  // ✅ DÉTECTION PRODUIT SHOPIFY AMÉLIORÉE
  private detectProductInfo(): boolean {
    try {
      console.log('🔍 [PRODUIT] Détection produit Shopify améliorée...')
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId

      // ✅ MÉTHODE 1: Shopify Analytics (plus fiable)
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString()
        console.log('✅ [PRODUIT] Shopify Analytics:', detectedName)
      }

      // ✅ MÉTHODE 2: Variables globales Shopify
      if (!detectedName && (window as any).meta?.product) {
        const metaProduct = (window as any).meta.product
        detectedName = metaProduct.title
        detectedPrice = metaProduct.price ? metaProduct.price / 100 : undefined
        detectedId = metaProduct.id?.toString()
        console.log('✅ [PRODUIT] Meta global:', detectedName)
      }
      
      // ✅ MÉTHODE 3: Sélecteurs DOM améliorés
      if (!detectedName) {
        const titleSelectors = [
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title',
          '.product__heading h1',
          '[class*="product-title"]',
          '[class*="product__title"]',
          'h1[class*="product"]',
          '.product-meta__title',
          '.pdp-product-name',
          '.product-details h1'
        ]
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            console.log(`✅ [PRODUIT] DOM ${selector}:`, detectedName)
            break
          }
        }
      }

      // ✅ MÉTHODE 4: Détection prix améliorée
      if (!detectedPrice) {
        const priceSelectors = [
          '.price__current .money',
          '.product-form__price .price',
          '.money',
          '.price-current',
          '[class*="price-current"]',
          '[class*="product-price"]',
          '.product-price-value',
          '.price-regular'
        ]
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', '.'))
              console.log(`✅ [PRODUIT] Prix ${selector}:`, detectedPrice)
              break
            }
          }
        }
      }

      // ✅ MÉTHODE 5: JSON-LD structuré
      if (!detectedName || !detectedPrice) {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')
        for (const script of jsonLdScripts) {
          try {
            const data = JSON.parse(script.textContent || '')
            if (data['@type'] === 'Product' || data.product) {
              const product = data.product || data
              if (!detectedName && product.name) {
                detectedName = product.name
                console.log('✅ [PRODUIT] JSON-LD nom:', detectedName)
              }
              if (!detectedPrice && product.offers?.price) {
                detectedPrice = parseFloat(product.offers.price)
                console.log('✅ [PRODUIT] JSON-LD prix:', detectedPrice)
              }
            }
          } catch (e) {
            // Ignorer erreurs JSON
          }
        }
      }

      // ✅ SAUVEGARDE FINALE
      if (detectedName) this.config.productName = detectedName
      if (detectedPrice) this.config.productPrice = detectedPrice
      if (detectedId) this.config.productId = detectedId
      if (!this.config.productUrl) this.config.productUrl = window.location.href

      const success = !!(detectedName || detectedPrice)
      console.log(`${success ? '✅' : '⚠️'} [PRODUIT] Détection finale:`, {
        nom: detectedName,
        prix: detectedPrice,
        id: detectedId,
        url: this.config.productUrl
      })

      return success

    } catch (error) {
      console.warn('⚠️ [PRODUIT] Erreur détection:', error)
      return false
    }
  }

  // ✅ CRÉATION WIDGET AVEC STYLES DYNAMIQUES
  private createWidget() {
    let container = document.getElementById('chatseller-widget')
    
    if (!container) {
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      container.className = 'cs-chatseller-widget'
      container.setAttribute('data-chatseller', 'main-widget')
      container.style.cssText = 'margin: 8px 0; position: relative; z-index: 999999;'
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  // ✅ INSERTION WIDGET POSITION AMÉLIORÉE
  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // ✅ SÉLECTEURS SHOPIFY PLUS COMPLETS
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
      '[class*="product-form"]',
      '.product-form-buttons',
      '.btn-add-to-cart',
      '#AddToCart',
      '.AddToCart'
    ]
    
    let targetElement = null
    
    for (const selector of shopifyCtaSelectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) {
        console.log(`✅ [POSITION] CTA trouvé: ${selector}`)
        break
      }
    }
    
    if (targetElement) {
      try {
        if (position === 'above-cta') {
          targetElement.parentNode?.insertBefore(container, targetElement)
        } else if (position === 'below-cta') {
          targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
        } else if (position === 'beside-cta') {
          // Créer un wrapper flex pour mettre côte à côte
          const wrapper = document.createElement('div')
          wrapper.style.cssText = 'display: flex; gap: 12px; align-items: center; flex-wrap: wrap;'
          targetElement.parentNode?.insertBefore(wrapper, targetElement)
          wrapper.appendChild(targetElement)
          wrapper.appendChild(container)
        } else {
          targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
        }
        
        console.log(`✅ [POSITION] Widget inséré: ${position}`)
        return
      } catch (error) {
        console.warn('⚠️ [POSITION] Erreur insertion CTA:', error)
      }
    }
    
    // ✅ FALLBACK: FORM PRODUIT
    const productForm = document.querySelector('form[action*="/cart/add"]') || 
                       document.querySelector('.product-form') ||
                       document.querySelector('.product-single') ||
                       document.querySelector('main')
    
    if (productForm) {
      try {
        productForm.appendChild(container)
        console.log('✅ [POSITION] Widget inséré dans form/main')
        return
      } catch (error) {
        console.warn('⚠️ [POSITION] Erreur insertion form:', error)
      }
    }
    
    // ✅ FALLBACK FINAL: POSITION FIXE
    if (!this.config.disableFallback) {
      console.log('⚠️ [POSITION] Fallback: position fixe')
      container.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        max-width: 280px !important;
        margin: 0 !important;
      `
      container.className = 'cs-chatseller-widget cs-chatseller-widget-fallback'
      container.setAttribute('data-chatseller-position', 'fallback')
      document.body.appendChild(container)
    }
  }

  // ✅ RENDU WIDGET AVEC CONFIGURATION DYNAMIQUE
  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à la vendeuse'
    const primaryColor = this.config.primaryColor || '#EC4899'
    const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'full')

    this.widgetElement.innerHTML = `
      <div style="width: 100%; margin: 8px 0; position: relative;" data-chatseller="button-container">
        <button 
          id="chatseller-trigger-btn"
          class="cs-chat-trigger-button"
          data-chatseller="trigger-button"
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
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
            overflow: hidden;
          "
          onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 12px 35px rgba(236, 72, 153, 0.4)'; this.style.background='linear-gradient(135deg, #F472B6 0%, #EC4899 100%)'"
          onmouseout="this.style.transform='translateY(0px)'; this.style.boxShadow='0 8px 25px rgba(236, 72, 153, 0.3)'; this.style.background='linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%)'"
          onmousedown="this.style.transform='translateY(0px)'"
          onmouseup="this.style.transform='translateY(-2px)'"
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0; margin-right: 8px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
          <span style="color: inherit; font-size: inherit; font-weight: inherit; margin: 0; padding: 0; background: transparent; border: none;">${buttonText}</span>
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
      
      console.log(`🎨 [WIDGET] Bouton rendu:`, { 
        text: buttonText, 
        color: primaryColor, 
        radius: borderRadius 
      })
    }
  }

  // ✅ OUVERTURE CHAT AVEC VUE MODERNE
  private openChat() {
    if (this.isOpen) return

    this.isOpen = true
    console.log('💬 [CHAT] Ouverture interface moderne')
    
    try {
      this.createVueChatModal()
    } catch (error) {
      console.error('❌ [CHAT] Erreur Vue, fallback simple:', error)
      this.createSimpleChatModal()
    }
  }

  // ✅ CRÉATION MODAL VUE AVEC CONFIGURATION COMPLÈTE
  private createVueChatModal() {
    this.modalElement = document.createElement('div')
    this.modalElement.id = 'chatseller-vue-modal'
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.setAttribute('data-chatseller', 'modal-overlay')
    
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

  // ✅ INITIALISATION VUE AVEC CONFIG COMPLÈTE + TITRE
  private initVueWidget(): void {
    try {
      console.log('🎨 [VUE] Initialisation composant moderne avec titre...')
      
      if (!this.modalElement) {
        throw new Error('Modal element non trouvé')
      }
      
      // ✅ CONFIGURATION ULTRA-COMPLÈTE AVEC TITRE GARANTI
      const agentName = this.config.agentConfig?.name || 'Anna'
      const agentTitle = this.config.agentConfig?.title || 'Vendeuse IA'
      
      const widgetConfig = {
        shopId: this.config.shopId,
        apiUrl: this.config.apiUrl,
        agentConfig: {
          id: this.config.agentConfig?.id || 'demo-agent',
          name: agentName,
          title: agentTitle, // ✅ TITRE OBLIGATOIRE
          avatar: this.config.agentConfig?.avatar,
          welcomeMessage: this.config.agentConfig?.welcomeMessage,
          fallbackMessage: this.config.agentConfig?.fallbackMessage,
          personality: this.config.agentConfig?.personality || 'friendly'
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

      console.log('✅ [VUE] Config Vue avec titre:', {
        agentName: widgetConfig.agentConfig.name,
        agentTitle: widgetConfig.agentConfig.title,
        productName: widgetConfig.productName
      })

      this.vueApp = createApp(ChatSellerWidget, {
        config: widgetConfig
      })

      this.vueApp.mount(this.modalElement)

      console.log('✅ [VUE] Composant Vue moderne monté avec titre')

    } catch (error) {
      console.error('❌ [VUE] Erreur initialisation:', error)
      throw error
    }
  }

  // ✅ MODAL SIMPLE FALLBACK AVEC TITRE
  private createSimpleChatModal() {
    const agentName = this.config.agentConfig?.name || 'Anna'
    const agentTitle = this.config.agentConfig?.title || 'Vendeuse IA'
    const primaryColor = this.config.primaryColor || '#EC4899'

    this.modalElement = document.createElement('div')
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.setAttribute('data-chatseller', 'fallback-modal')
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
          padding: 20px; 
          background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -10)} 100%); 
          color: white;
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
              <p style="margin: 0; font-size: 14px; opacity: 0.95; color: white; font-weight: 500;">
                <span style="display: inline-block; width: 8px; height: 8px; background: #00D26A; border-radius: 50%; margin-right: 6px;"></span>
                En ligne maintenant
              </p>
            </div>
          </div>
          <button id="chatseller-close-btn" class="cs-close-button" style="
            background: rgba(255, 255, 255, 0.15); color: white;
            border: none; border-radius: 50%; width: 40px; height: 40px;
            cursor: pointer; display: flex; align-items: center; justify-content: center;
            transition: all 0.2s ease;
          ">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        
        <div style="
          flex: 1; padding: 24px; display: flex; align-items: center; justify-content: center; 
          background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%);
        ">
          <div style="text-align: center;">
            <div style="
              width: 64px; height: 64px; background: ${primaryColor}; 
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              margin: 0 auto 16px; color: white; font-size: 24px; font-weight: 700;
            ">
              ${agentName.charAt(0).toUpperCase()}
            </div>
            <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
              ${agentName} - ${agentTitle}
            </h4>
            <p style="margin: 0; font-size: 14px; color: #6b7280;">
              🔧 Interface de chat moderne en cours de chargement...
            </p>
            <div style="margin: 16px 0;">
              <div style="
                width: 32px; height: 32px; border: 3px solid ${primaryColor}; 
                border-top: 3px solid transparent; border-radius: 50%;
                animation: spin 1s linear infinite; margin: 0 auto;
              "></div>
            </div>
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

    // ✅ ANIMATION SPIN CSS INLINE
    const spinStyle = document.createElement('style')
    spinStyle.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(spinStyle)

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())
    
    console.log(`✅ [FALLBACK] Modal simple avec titre: ${agentName} - ${agentTitle}`)
  }

  // ✅ FERMETURE CHAT AVEC NETTOYAGE
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
    console.log('✅ [CHAT] Interface fermée')
  }

  // ✅ HELPERS UTILITAIRES
  private getBorderRadiusValue(radius: string): string {
    const radiusMap = {
      'none': '0px',
      'sm': '8px', 
      'md': '12px',
      'lg': '16px',
      'xl': '32px',
      'full': '50px'
    }
    return radiusMap[radius as keyof typeof radiusMap] || '50px'
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

  // ✅ API PUBLIQUE
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
      console.log('📤 [API] Envoi message:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      console.log('📥 [API] Réponse:', result.success)

      return result

    } catch (error) {
      console.error('❌ [API] Erreur:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }
    }
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
      if (this.vueApp) {
        this.vueApp.unmount()
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    this.isInitialized = false
    console.log('🧹 [WIDGET] Détruit complètement')
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