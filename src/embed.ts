// src/embed.ts - WIDGET 100% AUTONOME AVEC CONNEXION AGENT IA - CORRIGÉ
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

  async init(config: ChatSellerConfig) {
    if (this.isInitialized) {
      console.warn('🟡 ChatSeller déjà initialisé')
      return
    }

    console.log('🚀 Initialisation ChatSeller widget...', config.shopId)

    this.config = { ...this.config, ...config }

    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId requis')
      return
    }

    try {
      await this.waitForDOM()
      
      // ✅ ÉTAPE 1: Charger la configuration shop + agent depuis l'API
      await this.loadShopConfiguration()
      
      // ✅ ÉTAPE 2: Détecter automatiquement le produit si activé
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      // ✅ ÉTAPE 3: Créer le widget avec la config complète
      this.createWidget()
      
      this.isInitialized = true
      console.log('✅ ChatSeller widget initialisé avec succès')
      
      // ✅ ÉTAPE 4: Track l'initialisation
      this.track('widget_initialized', {
        shopId: this.config.shopId,
        agentConfigured: !!this.agentConfig,
        productDetected: !!(this.config.productName || this.config.productId)
      })
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      this.createFallbackWidget()
    }
  }

  // ✅ NOUVEAU: Charger la configuration depuis l'API
  private async loadShopConfiguration(): Promise<void> {
    try {
      console.log('🔄 Chargement configuration shop:', this.config.shopId)
      
      const response = await fetch(`${this.config.apiUrl}/public/shops/${this.config.shopId}/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        this.shopConfig = data.data.shop
        this.agentConfig = data.data.agent
        
        // ✅ FUSIONNER la config API avec la config locale
        this.mergeApiConfiguration()
        
        console.log('✅ Configuration chargée:', {
          shop: this.shopConfig?.id,
          agent: this.agentConfig?.name,
          primaryColor: this.config.primaryColor
        })
      } else {
        throw new Error(data.error || 'Erreur configuration API')
      }
      
    } catch (error) {
      console.warn('⚠️ Impossible de charger la configuration:', error)
      // Continuer avec la config par défaut
    }
  }

  // ✅ CORRECTED: Fusionner configuration API + locale avec null checks
  private mergeApiConfiguration(): void {
    if (this.shopConfig) {
      // ✅ Utilisation d'opérateurs de coalescence avec fallbacks sûrs
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
      // Injecter la config agent
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

  // ✅ NOUVEAU: Détection automatique produit
  private detectProductInfo(): void {
    try {
      // Méta tags OpenGraph
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content')
      const ogPrice = document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
      // const ogCurrency = document.querySelector('meta[property="og:price:currency"]')?.getAttribute('content')
      
      // Schema.org Product
      const productSchema = document.querySelector('script[type="application/ld+json"]')
      let schemaData = null
      if (productSchema) {
        try {
          schemaData = JSON.parse(productSchema.textContent || '')
        } catch (e) {}
      }

      // Shopify spécifique
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      
      // WooCommerce spécifique - peut être utilisé dans une future version  
      // const wooPrice = document.querySelector('.price .amount')?.textContent

      // Détection générique par sélecteurs
      const titleSelectors = ['h1.product-title', '.product-name', 'h1', '[data-product-title]']
      const priceSelectors = ['.price', '.product-price', '[data-price]', '.cost']

      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice

      // Priorité: Shopify > OG > Schema > Generic
      if (shopifyProduct) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
      } else if (ogTitle) {
        detectedName = ogTitle
        detectedPrice = ogPrice ? parseFloat(ogPrice) : undefined
      } else if (schemaData?.name) {
        detectedName = schemaData.name
        detectedPrice = schemaData.offers?.price ? parseFloat(schemaData.offers.price) : undefined
      } else {
        // Fallback générique
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
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
              break
            }
          }
        }
      }

      // Mise à jour config avec fallbacks sûrs
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

      if (detectedName || detectedPrice) {
        console.log('✅ Produit détecté:', {
          name: detectedName,
          price: detectedPrice,
          id: this.config.productId
        })
      }

    } catch (error) {
      console.warn('⚠️ Erreur détection produit:', error)
    }
  }

  // ✅ CORRECTED: Extraction ID produit avec fallback sûr
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

  private createWidget() {
    // Trouver ou créer le container
    let container = document.getElementById('chatseller-widget')
    
    if (!container) {
      container = document.getElementById('chatseller-widget-container')
    }
    
    if (!container) {
      // Créer un container et l'insérer au bon endroit selon la position configurée
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  // ✅ NOUVEAU: Insertion intelligente selon position configurée
  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // Sélecteurs pour détecter les boutons CTA
    const ctaSelectors = [
      '#add-to-cart-btn', '.add-to-cart', '[data-add-to-cart]',
      '#buy-now-btn', '.buy-now', '.purchase-btn',
      '.product-actions', '.product-form__buttons',
      '.single_add_to_cart_button', '.button.add_to_cart_button',
      '.btn-addtocart', '.product-form__cart'
    ]
    
    let targetElement = null
    let insertMethod: 'before' | 'after' | 'append' = 'before'
    
    // Trouver l'élément CTA
    for (const selector of ctaSelectors) {
      targetElement = document.querySelector(selector)
      if (targetElement) break
    }
    
    // Déterminer la méthode d'insertion selon la position
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
    
    // Insérer le widget
    if (targetElement) {
      if (insertMethod === 'before') {
        targetElement.parentNode?.insertBefore(container, targetElement)
      } else if (insertMethod === 'after') {
        targetElement.parentNode?.insertBefore(container, targetElement.nextSibling)
      } else {
        targetElement.appendChild(container)
      }
    } else {
      // Fallback: ajouter à la fin du body
      document.body.appendChild(container)
    }
  }

  private renderWidget() {
    if (!this.widgetElement) return

    // ✅ UTILISER LA CONFIG AGENT POUR PERSONNALISER LE BOUTON avec fallbacks sûrs
    const buttonText = this.config.buttonText || 'Parler à un conseiller'
    const primaryColor = this.config.primaryColor || '#007AFF'

    // ✅ HTML COMPLET AVEC STYLES INLINE
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
          ${buttonText}
        </button>
      </div>
    `

    // ✅ AJOUTER L'EVENT LISTENER POUR OUVRIR LE CHAT
    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.openChat())
    }

    console.log('✅ Widget rendu avec succès')
  }

  // ✅ CORRECTED: Ajustement couleur avec validation
  private adjustColor(color: string, percent: number): string {
    try {
      // Convertir hex vers RGB puis ajuster luminosité
      const hex = color.replace('#', '')
      if (hex.length !== 6) return color // Fallback si format invalide
      
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
      return color // Fallback: retourner couleur originale
    }
  }

  private openChat() {
    if (this.isOpen) return

    this.isOpen = true
    this.createChatModal()
    
    // Ajouter le message de bienvenue personnalisé
    if (this.messages.length === 0) {
      const welcomeMsg = this.config.agentConfig?.welcomeMessage || 'Bonjour ! Comment puis-je vous aider avec ce produit ?'
      this.addMessage('assistant', welcomeMsg)
    }

    console.log('💬 Chat ouvert')
  }

  private createChatModal() {
    // Supprimer modal existant si présent
    if (this.modalElement) {
      this.modalElement.remove()
    }

    const agentName = this.config.agentConfig?.name || 'Assistant'
    const agentTitle = this.config.agentConfig?.title || 'Conseiller Commercial'
    const primaryColor = this.config.primaryColor || '#007AFF'

    // ✅ CRÉER LE MODAL COMPLET ÉLARGI À 450PX AVEC STYLES MODERNES
    this.modalElement = document.createElement('div')
    this.modalElement.innerHTML = `
      <div id="chatseller-modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
        animation: fadeIn 0.3s ease-out;
      ">
        <div id="chatseller-chat-container" style="
          width: 450px;
          height: 650px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        ">
          <!-- Header Moderne -->
          <div style="
            padding: 20px;
            background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -20)} 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            box-sizing: border-box;
            position: relative;
            overflow: hidden;
          ">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
              pointer-events: none;
            "></div>
            <div style="display: flex; align-items: center; gap: 12px; position: relative;">
              <div style="position: relative;">
                <div style="
                  width: 48px;
                  height: 48px;
                  border-radius: 50%;
                  background: rgba(255, 255, 255, 0.2);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-weight: 600;
                  font-size: 18px;
                  border: 3px solid rgba(255, 255, 255, 0.3);
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                ">
                  ${agentName.charAt(0).toUpperCase()}
                </div>
                <div style="
                  position: absolute;
                  bottom: -2px;
                  right: -2px;
                  width: 16px;
                  height: 16px;
                  background: #34D399;
                  border-radius: 50%;
                  border: 2px solid white;
                  animation: pulse 2s infinite;
                "></div>
              </div>
              <div>
                <h3 style="
                  font-size: 18px;
                  font-weight: 600;
                  margin: 0;
                  color: white;
                  letter-spacing: -0.025em;
                ">${agentName}</h3>
                <p style="
                  font-size: 13px;
                  margin: 4px 0 0 0;
                  color: rgba(255, 255, 255, 0.9);
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span style="
                    font-size: 11px;
                    background: #34D399;
                    color: #065f46;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-weight: 500;
                  ">En ligne</span>
                  ${agentTitle}
                </p>
              </div>
            </div>
            <button id="chatseller-close-btn" style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.1);
              color: rgba(255, 255, 255, 0.8);
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
              position: relative;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.color='white'; this.style.transform='rotate(90deg)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.color='rgba(255, 255, 255, 0.8)'; this.style.transform='rotate(0deg)'">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transition: transform 0.2s;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Messages Container Moderne -->
          <div id="chatseller-messages" style="
            flex: 1;
            padding: 24px;
            background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
            box-sizing: border-box;
            scrollbar-width: thin;
            scrollbar-color: #cbd5e0 #f7fafc;
          ">
            <!-- Les messages seront ajoutés ici dynamiquement -->
          </div>

          <!-- Input Container Moderne -->
          <div style="
            padding: 20px;
            border-top: 1px solid #e2e8f0;
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            flex-shrink: 0;
            box-sizing: border-box;
          ">
            <div style="display: flex; align-items: flex-end; gap: 12px;">
              <input id="chatseller-input" type="text" placeholder="Tapez votre message..." style="
                flex: 1;
                padding: 16px 20px;
                border: 2px solid rgba(226, 232, 240, 0.8);
                border-radius: 12px;
                font-size: 14px;
                background: rgba(255, 255, 255, 0.8);
                color: #374151;
                outline: none;
                font-family: inherit;
                box-sizing: border-box;
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
              " />
              <button id="chatseller-send-btn" style="
                width: 56px;
                height: 56px;
                background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%);
                color: white;
                border: none;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateY(0);
              " onmouseover="this.style.opacity='0.95'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 20px rgba(0, 0, 0, 0.25)'" onmouseout="this.style.opacity='1'; this.style.transform='translateY(0px)'; this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.15)'">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 12px 0 0 0;
              text-align: center;
              background: #f9fafb;
              padding: 8px 16px;
              border-radius: 8px;
              display: inline-block;
              width: 100%;
              box-sizing: border-box;
            ">
              Propulsé par <strong style="color: ${primaryColor}; font-weight: 600;">ChatSeller</strong> • Assistant IA
            </p>
          </div>
        </div>
      </div>
      
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        #chatseller-messages::-webkit-scrollbar {
          width: 6px;
        }
        #chatseller-messages::-webkit-scrollbar-track {
          background: #f7fafc;
          border-radius: 3px;
        }
        #chatseller-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #cbd5e0, #9ca3af);
          border-radius: 3px;
        }
        #chatseller-input:focus {
          background: rgba(255, 255, 255, 0.95);
          border-color: ${primaryColor};
          box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
        }
      </style>
    `

    document.body.appendChild(this.modalElement)

    // ✅ AJOUTER LES EVENT LISTENERS
    this.setupChatEventListeners()
    this.renderMessages()

    // ✅ RESPONSIVE MOBILE
    if (window.innerWidth <= 768) {
      const container = this.modalElement.querySelector('#chatseller-chat-container') as HTMLElement
      if (container) {
        container.style.width = '100%'
        container.style.height = '100%'
        container.style.borderRadius = '0'
        container.style.maxHeight = '100vh'
      }
      
      const overlay = this.modalElement.querySelector('#chatseller-modal-overlay') as HTMLElement
      if (overlay) {
        overlay.style.padding = '0'
      }
    }
  }

  private setupChatEventListeners() {
    if (!this.modalElement) return

    // Bouton fermer
    const closeBtn = this.modalElement.querySelector('#chatseller-close-btn')
    closeBtn?.addEventListener('click', () => this.closeChat())

    // Fermer en cliquant sur l'overlay
    const overlay = this.modalElement.querySelector('#chatseller-modal-overlay')
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.closeChat()
      }
    })

    // Bouton envoyer
    const sendBtn = this.modalElement.querySelector('#chatseller-send-btn')
    sendBtn?.addEventListener('click', () => this.sendMessage())

    // Input Enter
    const input = this.modalElement.querySelector('#chatseller-input') as HTMLInputElement
    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage()
      }
    })

    // Focus automatique sur l'input
    setTimeout(() => {
      input?.focus()
    }, 100)
  }

  private closeChat() {
    this.isOpen = false
    if (this.modalElement) {
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
    
    if (this.modalElement) {
      this.renderMessages()
    }
  }

  private renderMessages() {
    const messagesContainer = this.modalElement?.querySelector('#chatseller-messages')
    if (!messagesContainer) return

    const agentName = this.config.agentConfig?.name || 'Assistant'
    const primaryColor = this.config.primaryColor || '#007AFF'

    messagesContainer.innerHTML = this.messages.map(message => {
      const isUser = message.role === 'user'
      const time = message.timestamp.toLocaleTimeString('fr', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      return `
        <div style="
          display: flex;
          align-items: flex-start;
          gap: 12px;
          ${isUser ? 'flex-direction: row-reverse;' : ''}
        ">
          <div style="position: relative;">
            <div style="
              width: 40px;
              height: 40px;
              border-radius: 50%;
              ${isUser 
                ? 'background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%); color: white;' 
                : `background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%); color: white;`
              }
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              font-weight: 600;
              flex-shrink: 0;
              border: 2px solid ${isUser ? '#f3f4f6' : 'rgba(255, 255, 255, 0.2)'};
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            ">
              ${isUser ? 'V' : agentName.charAt(0).toUpperCase()}
            </div>
            ${!isUser ? `
              <div style="
                position: absolute;
                bottom: 0;
                right: 0;
                width: 12px;
                height: 12px;
                background: #34D399;
                border-radius: 50%;
                border: 2px solid white;
              "></div>
            ` : ''}
          </div>
          <div style="
            max-width: 320px;
            ${isUser ? 'text-align: right;' : ''}
          ">
            <div style="
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 6px;
              ${isUser ? 'text-align: right;' : ''}
              display: flex;
              align-items: center;
              gap: 8px;
              ${isUser ? 'justify-content: flex-end;' : ''}
            ">
              <span style="
                background: #f3f4f6;
                padding: 2px 8px;
                border-radius: 10px;
                font-weight: 500;
              ">${isUser ? 'Vous' : agentName}</span>
              <span>${time}</span>
            </div>
            <div style="
              padding: 16px;
              border-radius: 16px;
              ${isUser 
                ? `background: linear-gradient(135deg, ${primaryColor} 0%, ${this.adjustColor(primaryColor, -15)} 100%); color: white; border-top-right-radius: 6px;`
                : 'background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color: #374151; border-top-left-radius: 6px; border: 1px solid #e2e8f0;'
              }
              font-size: 14px;
              line-height: 1.6;
              word-wrap: break-word;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              position: relative;
            ">
              ${message.content}
            </div>
          </div>
        </div>
      `
    }).join('')

    // Scroll vers le bas
    messagesContainer.scrollTop = messagesContainer.scrollHeight
  }

  private async sendMessage() {
    const input = this.modalElement?.querySelector('#chatseller-input') as HTMLInputElement
    if (!input || !input.value.trim()) return

    const messageContent = input.value.trim()
    input.value = ''

    // Ajouter le message utilisateur
    this.addMessage('user', messageContent)

    try {
      // ✅ ENVOYER MESSAGE À L'API AVEC BASE DE CONNAISSANCE
      const response = await this.sendMessageToAPI(messageContent)
      
      if (response.success) {
        this.conversationId = response.data.conversationId
        this.addMessage('assistant', response.data.message)
        
        // Track analytics
        this.track('message_received', {
          conversationId: this.conversationId,
          agentName: this.config.agentConfig?.name,
          responseTime: response.data.responseTime
        })
      } else {
        throw new Error(response.error)
      }
      
    } catch (error) {
      console.error('❌ Erreur envoi message:', error)
      
      // Message de fallback personnalisé
      const fallbackMsg = this.config.agentConfig?.fallbackMessage || 
        'Désolé, je rencontre une difficulté technique. Un conseiller vous recontactera bientôt.'
      
      this.addMessage('assistant', fallbackMsg)
    }
  }

  // ✅ NOUVEAU: Envoi message à l'API avec base de connaissance
  private async sendMessageToAPI(message: string): Promise<any> {
    try {
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

      console.log('📤 Envoi message à l\'API:', payload)

      const response = await fetch(`${this.config.apiUrl}/public/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log('📥 Réponse API:', data)
      
      return data

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
        <button onclick="alert('Widget ChatSeller en développement - Version de test')" style="
          width: 100%;
          padding: 16px 24px;
          background: ${primaryColor};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        ">
          💬 ${buttonText} (Test)
        </button>
      </div>
    `
  }

  // ✅ MÉTHODES PUBLIQUES ÉTENDUES
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
      this.modalElement.remove()
      this.modalElement = null
    }
    if (this.widgetElement) {
      this.widgetElement.remove()
      this.widgetElement = null
    }
    this.isInitialized = false
    console.log('🗑️ ChatSeller widget détruit')
  }

  track(event: string, data?: any) {
    console.log('📊 Track event:', event, data)
    
    // ✅ ENVOYER ANALYTICS À L'API
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
      }).catch(err => console.warn('Analytics error:', err))
    }
  }

  // ✅ NOUVELLES MÉTHODES POUR COMMANDES
  async analyzeOrderIntent(message: string, conversationId: string | null, productInfo: any) {
    try {
      const response = await fetch(`${this.config.apiUrl}/public/orders/analyze-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          productInfo,
          shopId: this.config.shopId
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('❌ Erreur analyze order intent:', error)
      return { success: false, error }
    }
  }

  async startOrder(conversationId: string | null, productInfo: any, initialMessage: string) {
    try {
      const response = await fetch(`${this.config.apiUrl}/public/orders/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          productInfo,
          initialMessage,
          shopId: this.config.shopId
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('❌ Erreur start order:', error)
      return { success: false, error }
    }
  }

  async processOrderStep(conversationId: string, step: string, data: any) {
    try {
      const response = await fetch(`${this.config.apiUrl}/public/orders/process-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          step,
          data,
          shopId: this.config.shopId
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('❌ Erreur process order step:', error)
      return { success: false, error }
    }
  }

  async completeOrder(conversationId: string, orderData: any) {
    try {
      const response = await fetch(`${this.config.apiUrl}/public/orders/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          orderData,
          shopId: this.config.shopId
        })
      })
      
      return await response.json()
    } catch (error) {
      console.error('❌ Erreur complete order:', error)
      return { success: false, error }
    }
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

// ✅ AUTO-INIT
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