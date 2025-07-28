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
  theme?: 'modern' | 'minimal' | 'custom'
  primaryColor?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
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

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private app: any = null
  private isInitialized = false
  private shopConfigLoaded = false

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#ec4899',
      position: 'bottom-right',
      buttonText: 'Parler au vendeur',
      language: 'fr',
      autoDetectProduct: true
    }
  }

  async init(config: ChatSellerConfig) {
    if (this.isInitialized) {
      console.warn('ChatSeller is already initialized')
      return
    }

    // Merge config with defaults
    this.config = { ...this.config, ...config }

    // Validate required config
    if (!this.config.shopId) {
      console.error('ChatSeller: shopId is required')
      return
    }

    // Auto-detect product information if enabled
    if (this.config.autoDetectProduct) {
      this.detectProductInfo()
    }

    // ✅ NOUVELLE ÉTAPE : Charger la configuration depuis l'API
    await this.loadShopConfiguration()

    // Create widget container
    this.createWidgetContainer()

    // Mount Vue app
    this.mountWidget()

    this.isInitialized = true
    console.log('✅ ChatSeller widget initialized', this.config)
  }

  // ✅ NOUVELLE MÉTHODE : Charger la configuration du shop et de l'agent
  private async loadShopConfiguration() {
    try {
      console.log(`🔄 Loading configuration for shop: ${this.config.shopId}`)
      
      const response = await fetch(`${this.config.apiUrl}/api/v1/public/shops/${this.config.shopId}/agent`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
            // Préserver les configs explicitement passées
            shopId: this.config.shopId,
            apiUrl: this.config.apiUrl
          }
        }

        // Configurer l'agent
        if (shopConfig.data.agent) {
          this.config.agentConfig = shopConfig.data.agent
          
          // Utiliser les messages de l'agent si définis
          if (shopConfig.data.agent.welcomeMessage) {
            this.config.buttonText = this.config.buttonText || 'Parler avec un conseiller'
          }
        } else if (shopConfig.data.shop.agentConfig) {
          // Fallback vers la config agent du shop
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
      
      // Configuration par défaut si l'API échoue
      this.config.agentConfig = {
        name: 'Assistant',
        welcomeMessage: 'Bonjour ! Comment puis-je vous aider ?',
        fallbackMessage: 'Je transmets votre question à notre équipe.',
        avatar: `https://ui-avatars.com/api/?name=Assistant&background=${this.config.primaryColor?.replace('#', '') || 'ec4899'}&color=fff`
      }
      
      this.shopConfigLoaded = false
    }
  }

  private detectProductInfo() {
    // Try to auto-detect product information from the page
    const url = window.location.href
    
    // Product URL
    if (!this.config.productUrl) {
      this.config.productUrl = url
    }

    // Try to detect product ID from URL
    if (!this.config.productId) {
      const productIdMatches = url.match(/\/products\/([^\/\?]+)/) || 
                              url.match(/product[_-]id[=:]([^&\?]+)/) ||
                              url.match(/id[=:]([^&\?]+)/)
      if (productIdMatches && productIdMatches[1]) {
        this.config.productId = productIdMatches[1]
      }
    }

    // Try to detect product name from page title or meta tags
    if (!this.config.productName) {
      const titleElement = document.querySelector('h1[class*="product"], h1[class*="title"]')
      const metaTitle = document.querySelector('meta[property="og:title"]')
      
      if (titleElement?.textContent) {
        const trimmedContent = titleElement.textContent.trim()
        if (trimmedContent) {
          this.config.productName = trimmedContent
        }
      } else if (metaTitle) {
        const content = metaTitle.getAttribute('content')
        if (content) {
          this.config.productName = content
        }
      }
      
      // Fallback to document title if no product name found
      if (!this.config.productName) {
        this.config.productName = document.title
      }
    }

    // Try to detect product price
    if (!this.config.productPrice) {
      const priceSelectors = [
        '[class*="price"]:not([class*="old"], [class*="was"], [class*="original"])',
        '[data-price]',
        '.amount',
        '.cost'
      ]

      for (const selector of priceSelectors) {
        const priceElement = document.querySelector(selector)
        if (priceElement) {
          const priceText = priceElement.textContent || priceElement.getAttribute('data-price')
          if (priceText) {
            const priceMatch = priceText.match(/[\d,]+\.?\d*/)
            if (priceMatch) {
              this.config.productPrice = parseFloat(priceMatch[0].replace(',', ''))
              break
            }
          }
        }
      }
    }

    console.log('🔍 Product detection completed:', {
      productId: this.config.productId,
      productName: this.config.productName,
      productPrice: this.config.productPrice
    })
  }

  private createWidgetContainer() {
    // Remove existing widget if any
    const existingWidget = document.getElementById('chatseller-widget')
    if (existingWidget) {
      existingWidget.remove()
    }

    // Create widget container
    this.widgetElement = document.createElement('div')
    this.widgetElement.id = 'chatseller-widget'
    
    // Set position styles
    const positionStyles = this.getPositionStyles()
    Object.assign(this.widgetElement.style, {
      position: 'fixed',
      zIndex: '2147483647',
      ...positionStyles
    })

    // Add to DOM
    document.body.appendChild(this.widgetElement)
  }

  private getPositionStyles() {
    const { position } = this.config
    const offset = '20px'

    switch (position) {
      case 'bottom-right':
        return { bottom: offset, right: offset }
      case 'bottom-left':
        return { bottom: offset, left: offset }
      case 'top-right':
        return { top: offset, right: offset }
      case 'top-left':
        return { top: offset, left: offset }
      default:
        return { bottom: offset, right: offset }
    }
  }

  private mountWidget() {
    if (!this.widgetElement) return

    this.app = createApp(ChatSellerWidget, {
      config: this.config
    })

    this.app.mount(this.widgetElement)
  }

  // Public methods
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
  }

  updateConfig(newConfig: Partial<ChatSellerConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // Re-mount widget with new config
    if (this.isInitialized) {
      this.destroy()
      this.init(this.config)
    }
  }

  // ✅ NOUVELLE MÉTHODE : Envoyer un message à l'IA
  async sendMessage(message: string, conversationId?: string): Promise<any> {
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
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('❌ Failed to send message:', error)
      throw error
    }
  }

  // Analytics tracking
  track(event: string, data?: any) {
    if (!this.config.shopId) return

    // Send analytics to API
    const apiUrl = this.config.apiUrl || 'https://chatseller-api-production.up.railway.app'
    fetch(`${apiUrl}/api/v1/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shopId: this.config.shopId,
        eventType: event,
        eventData: {
          ...data,
          shopConfigLoaded: this.shopConfigLoaded,
          agentConfigured: !!this.config.agentConfig
        },
        pageUrl: window.location.href,
        referrer: document.referrer
      })
    }).catch(error => {
      console.warn('Failed to send analytics:', error)
    })
  }

  // ✅ HELPER : Obtenir ou créer un ID visiteur
  private getVisitorId(): string {
    let visitorId = localStorage.getItem('chatseller_visitor_id')
    if (!visitorId) {
      visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('chatseller_visitor_id', visitorId)
    }
    return visitorId
  }

  // ✅ GETTERS pour débug
  get isConfigLoaded(): boolean {
    return this.shopConfigLoaded
  }

  get currentConfig(): ChatSellerConfig {
    return { ...this.config }
  }
}

// Global instance
const chatSeller = new ChatSeller()

// Auto-init if config is provided via data attributes
document.addEventListener('DOMContentLoaded', () => {
  const scriptTag = document.querySelector('script[src*="chatseller"]')
  if (scriptTag) {
    const shopId = scriptTag.getAttribute('data-shop-id')
    if (shopId) {
      // Create config object with proper type handling
      const config: ChatSellerConfig = { shopId }
      
      // Add optional properties only if they exist
      const apiUrl = scriptTag.getAttribute('data-api-url')
      if (apiUrl) config.apiUrl = apiUrl
      
      const theme = scriptTag.getAttribute('data-theme') as 'modern' | 'minimal' | 'custom'
      if (theme) config.theme = theme
      
      const primaryColor = scriptTag.getAttribute('data-primary-color')
      if (primaryColor) config.primaryColor = primaryColor
      
      const position = scriptTag.getAttribute('data-position') as 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
      if (position) config.position = position
      
      const buttonText = scriptTag.getAttribute('data-button-text')
      if (buttonText) config.buttonText = buttonText
      
      const language = scriptTag.getAttribute('data-language') as 'fr' | 'en' | 'wo'
      if (language) config.language = language
      
      chatSeller.init(config)
    }
  }
})

// Expose to window for manual initialization
declare global {
  interface Window {
    ChatSeller: ChatSeller
  }
}

window.ChatSeller = chatSeller

export default chatSeller