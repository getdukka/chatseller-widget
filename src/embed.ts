// src/embed.ts - WIDGET 100% AUTONOME SANS DÉPENDANCES
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

class ChatSeller {
  private config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private isInitialized = false
  private isOpen = false
  private messages: Message[] = []
  private modalElement: HTMLElement | null = null

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
      this.createWidget()
      this.isInitialized = true
      console.log('✅ ChatSeller widget initialisé avec succès')
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      this.createFallbackWidget()
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
      // Créer un container et l'insérer au bon endroit
      container = document.createElement('div')
      container.id = 'chatseller-widget'
      
      // Chercher un endroit approprié pour l'insérer
      const productActions = document.querySelector('.product-actions')
      const addToCartBtn = document.querySelector('#add-to-cart-btn')
      
      if (productActions) {
        if (this.config.position === 'above-cta' && addToCartBtn) {
          productActions.insertBefore(container, addToCartBtn)
        } else {
          productActions.appendChild(container)
        }
      } else {
        document.body.appendChild(container)
      }
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private renderWidget() {
    if (!this.widgetElement) return

    // ✅ HTML COMPLET AVEC STYLES INLINE
    this.widgetElement.innerHTML = `
      <div style="width: 100%; margin: 8px 0; position: relative; z-index: 999999;">
        <button 
          id="chatseller-trigger-btn"
          style="
            width: 100%;
            padding: 12px 20px;
            background: ${this.config.primaryColor};
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            outline: none;
            text-decoration: none;
            box-sizing: border-box;
          "
          onmouseover="this.style.opacity='0.9'; this.style.transform='translateY(-1px)'"
          onmouseout="this.style.opacity='1'; this.style.transform='translateY(0px)'"
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="flex-shrink: 0;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
          ${this.config.buttonText}
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

  private openChat() {
    if (this.isOpen) return

    this.isOpen = true
    this.createChatModal()
    
    // Ajouter le message de bienvenue
    if (this.messages.length === 0) {
      this.addMessage('assistant', 'Bonjour ! Comment puis-je vous aider avec ce produit ?')
    }

    console.log('💬 Chat ouvert')
  }

  private createChatModal() {
    // Supprimer modal existant si présent
    if (this.modalElement) {
      this.modalElement.remove()
    }

    // ✅ CRÉER LE MODAL COMPLET AVEC STYLES INLINE
    this.modalElement = document.createElement('div')
    this.modalElement.innerHTML = `
      <div id="chatseller-modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-sizing: border-box;
      ">
        <div id="chatseller-chat-container" style="
          width: 384px;
          height: 600px;
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          border: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
          box-sizing: border-box;
        ">
          <!-- Header -->
          <div style="
            padding: 16px;
            background: ${this.config.primaryColor};
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            box-sizing: border-box;
          ">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 16px;
              ">
                AI
              </div>
              <div>
                <h3 style="
                  font-size: 16px;
                  font-weight: 600;
                  margin: 0;
                  color: white;
                ">Assistant</h3>
                <p style="
                  font-size: 12px;
                  margin: 0;
                  color: rgba(255, 255, 255, 0.8);
                  display: flex;
                  align-items: center;
                  gap: 6px;
                ">
                  <span style="
                    width: 8px;
                    height: 8px;
                    background: #34D399;
                    border-radius: 50%;
                  "></span>
                  En ligne
                </p>
              </div>
            </div>
            <button id="chatseller-close-btn" style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.1);
              color: rgba(255, 255, 255, 0.8);
              border: none;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Messages Container -->
          <div id="chatseller-messages" style="
            flex: 1;
            padding: 16px;
            background: #f9fafb;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-sizing: border-box;
          ">
            <!-- Les messages seront ajoutés ici dynamiquement -->
          </div>

          <!-- Input Container -->
          <div style="
            padding: 16px;
            border-top: 1px solid #e2e8f0;
            background: white;
            flex-shrink: 0;
            box-sizing: border-box;
          ">
            <div style="display: flex; align-items: flex-end; gap: 8px;">
              <input id="chatseller-input" type="text" placeholder="Tapez votre message..." style="
                flex: 1;
                padding: 12px 16px;
                border: 1px solid #d1d5db;
                border-radius: 12px;
                font-size: 14px;
                background: white;
                color: #374151;
                outline: none;
                font-family: inherit;
                box-sizing: border-box;
              " />
              <button id="chatseller-send-btn" style="
                width: 48px;
                height: 48px;
                background: ${this.config.primaryColor};
                color: white;
                border: none;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.2s;
              " onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
            <p style="
              font-size: 12px;
              color: #9ca3af;
              margin: 8px 0 0 0;
              text-align: center;
            ">
              Propulsé par <strong>ChatSeller</strong> • Assistant IA
            </p>
          </div>
        </div>
      </div>
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
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 50%;
            ${isUser 
              ? 'background: #9ca3af; color: white;' 
              : `background: ${this.config.primaryColor}; color: white;`
            }
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
            flex-shrink: 0;
          ">
            ${isUser ? 'V' : 'AI'}
          </div>
          <div style="
            max-width: 280px;
            ${isUser ? 'text-align: right;' : ''}
          ">
            <div style="
              font-size: 11px;
              color: #6b7280;
              margin-bottom: 4px;
              ${isUser ? 'text-align: right;' : ''}
            ">
              ${isUser ? 'Vous' : 'Assistant'} • ${time}
            </div>
            <div style="
              padding: 12px;
              border-radius: 12px;
              ${isUser 
                ? `background: ${this.config.primaryColor}; color: white; border-top-right-radius: 6px;`
                : 'background: #f3f4f6; color: #374151; border-top-left-radius: 6px;'
              }
              font-size: 14px;
              line-height: 1.5;
              word-wrap: break-word;
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

    // Simuler la réponse de l'IA (pour les tests)
    setTimeout(() => {
      let response = "Merci pour votre message ! Comment puis-je vous aider davantage ?"
      
      if (messageContent.toLowerCase().includes('prix')) {
        response = "Le prix de ce produit est très compétitif ! Voulez-vous que je vous aide à finaliser votre commande ?"
      } else if (messageContent.toLowerCase().includes('acheter') || messageContent.toLowerCase().includes('commander')) {
        response = "Parfait ! Je vais vous aider à passer commande. Pour commencer, puis-je avoir votre nom et prénom ?"
      } else if (messageContent.toLowerCase().includes('bonjour') || messageContent.toLowerCase().includes('salut')) {
        response = `Bonjour ! Je vois que vous vous intéressez à ce produit. Comment puis-je vous aider ? Avez-vous des questions spécifiques ?`
      }
      
      this.addMessage('assistant', response)
    }, 1000)
  }

  private createFallbackWidget() {
    if (!this.widgetElement) {
      const container = document.createElement('div')
      container.id = 'chatseller-widget-fallback'
      document.body.appendChild(container)
      this.widgetElement = container
    }

    this.widgetElement.innerHTML = `
      <div style="margin: 8px 0;">
        <button onclick="alert('Widget ChatSeller en développement - Version de test')" style="
          width: 100%;
          padding: 12px 20px;
          background: ${this.config.primaryColor};
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          💬 ${this.config.buttonText} (Test)
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
  }

  getDebugInfo() {
    return {
      isInitialized: this.isInitialized,
      isOpen: this.isOpen,
      messagesCount: this.messages.length,
      config: { ...this.config },
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