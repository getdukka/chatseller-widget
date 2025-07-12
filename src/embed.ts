import { createApp } from 'vue'
import ChatSellerWidget from './ChatSellerWidget.vue'
import './style.css'

export interface AgentConfig {
  name?: string
  avatar?: string
  welcomeMessage?: string
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
}

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private app: any = null
  private isInitialized = false

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://api.chatseller.app',
      theme: 'modern',
      primaryColor: '#ec4899',
      position: 'bottom-right',
      buttonText: 'Parler au vendeur',
      language: 'fr',
      autoDetectProduct: true
    }
  }

  init(config: ChatSellerConfig) {
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

    // Create widget container
    this.createWidgetContainer()

    // Mount Vue app
    this.mountWidget()

    this.isInitialized = true
    console.log('ChatSeller widget initialized', this.config)
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
  }

  updateConfig(newConfig: Partial<ChatSellerConfig>) {
    this.config = { ...this.config, ...newConfig }
    
    // Re-mount widget with new config
    if (this.isInitialized) {
      this.destroy()
      this.init(this.config)
    }
  }

  // Analytics tracking
  track(event: string, data?: any) {
    if (!this.config.shopId) return

    // Send analytics to API
    const apiUrl = this.config.apiUrl || 'https://api.chatseller.app'
    fetch(`${apiUrl}/api/v1/analytics/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shopId: this.config.shopId,
        eventType: event,
        eventData: data,
        pageUrl: window.location.href,
        referrer: document.referrer
      })
    }).catch(error => {
      console.warn('Failed to send analytics:', error)
    })
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