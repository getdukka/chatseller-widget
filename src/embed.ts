// src/embed.ts - VERSION CORRIGÉE

// ✅ POLYFILLS CRITIQUES POUR LE NAVIGATEUR
if (typeof global === 'undefined') {
  (window as any).global = window
}
if (typeof process === 'undefined') {
  (window as any).process = {
    env: { NODE_ENV: 'production' }
  }
}

import { createApp } from 'vue'
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
  public config: ChatSellerConfig // ✅ CHANGÉ DE PRIVATE À PUBLIC
  private widgetElement: HTMLElement | null = null
  private isInitialized = false
  private isOpen = false
  private modalElement: HTMLElement | null = null
  private vueApp: any = null
  private cssInjected = false

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#EC4899',
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
      this.injectCriticalCSS()
      this.cleanupExistingWidgets()
      this.createWidget()
      
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
      
      this.isInitialized = true
      console.log('✅ ChatSeller widget initialisé')
      
    } catch (error) {
      console.error('❌ Échec initialisation ChatSeller:', error)
      this.createFallbackWidget()
    }
  }

  private injectCriticalCSS(): void {
    if (this.cssInjected) return

    // ✅ SUPPRESSION DES ANCIENS STYLES
    const existingStyle = document.getElementById('chatseller-styles')
    if (existingStyle) existingStyle.remove()

    const style = document.createElement('style')
    style.id = 'chatseller-styles'
    style.innerHTML = this.getCompleteCSS()
    document.head.appendChild(style)
    
    this.cssInjected = true
    console.log('✅ CSS ChatSeller injecté')
  }

  private getCompleteCSS(): string {
    return `
/* ✅ CHATSELLER WIDGET - CSS COMPLET AVEC ISOLATION RENFORCÉE */
.cs-chatseller-widget,
.cs-chatseller-widget *,
.cs-chatseller-widget *::before,
.cs-chatseller-widget *::after {
  all: unset !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  line-height: normal !important;
  -webkit-font-smoothing: antialiased !important;
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
}

.cs-chatseller-widget {
  position: relative !important;
  z-index: 999999 !important;
  display: block !important;
  margin: 8px 0 !important;
  width: 100% !important;
  font-size: 14px !important;
  color: #374151 !important;
  contain: layout style !important;
  isolation: isolate !important;
}

/* ✅ BOUTON TRIGGER ULTRA-VISIBLE AVEC ICÔNE */
.cs-chat-trigger-button {
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
  font-family: inherit !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 8px !important;
  outline: none !important;
  min-height: 56px !important;
  margin: 0 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 999999 !important;
}

.cs-chat-trigger-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 12px 35px rgba(236, 72, 153, 0.4) !important;
}

.cs-chat-trigger-button svg {
  width: 20px !important;
  height: 20px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2 !important;
  flex-shrink: 0 !important;
}

/* ✅ MODAL OVERLAY - PROTECTION MAXIMALE */
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
  margin: 0 !important;
  border: none !important;
  font-family: inherit !important;
  opacity: 1 !important;
  visibility: visible !important;
  pointer-events: auto !important;
  contain: layout style !important;
}

@media (max-width: 767px) {
  .cs-chat-modal-overlay {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
  }
}

/* ✅ CONTAINERS PRINCIPAUX */
.cs-chat-container-desktop {
  width: 650px !important;
  height: 700px !important;
  max-height: 90vh !important;
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
  margin: 0 !important;
  padding: 0 !important;
  text-align: left !important;
}

.cs-chat-container-mobile {
  width: 100vw !important;
  height: 100vh !important;
  background: #ffffff !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  transform: none !important;
  opacity: 1 !important;
  visibility: visible !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  z-index: 999999 !important;
}

/* ✅ HEADERS ULTRA-RENFORCÉS */
.cs-desktop-header,
.cs-mobile-header {
  padding: 20px !important;
  color: #ffffff !important;
  background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-shrink: 0 !important;
  position: relative !important;
  overflow: hidden !important;
  min-height: 85px !important;
  margin: 0 !important;
  border: none !important;
  z-index: 2 !important;
  font-family: inherit !important;
  text-align: left !important;
}

.cs-mobile-header {
  padding: 16px 20px !important;
  min-height: 75px !important;
}

/* ✅ AGENT INFO */
.cs-agent-info,
.cs-mobile-agent-info {
  display: flex !important;
  align-items: center !important;
  gap: 14px !important;
  flex: 1 !important;
  min-width: 0 !important;
  color: #ffffff !important;
  font-family: inherit !important;
}

.cs-agent-avatar,
.cs-mobile-avatar {
  width: 48px !important;
  height: 48px !important;
  border-radius: 50% !important;
  position: relative !important;
  overflow: hidden !important;
  border: 3px solid rgba(255, 255, 255, 0.3) !important;
  flex-shrink: 0 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  display: block !important;
}

.cs-mobile-avatar {
  width: 42px !important;
  height: 42px !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
}

.cs-agent-avatar img,
.cs-mobile-avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cs-agent-details,
.cs-mobile-details {
  min-width: 0 !important;
  flex: 1 !important;
  color: #ffffff !important;
}

.cs-agent-name,
.cs-mobile-name {
  font-size: 18px !important;
  font-weight: 700 !important;
  color: #ffffff !important;
  margin: 0 0 6px 0 !important;
  display: block !important;
  line-height: 1.2 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  font-family: inherit !important;
  text-decoration: none !important;
  padding: 0 !important;
  border: none !important;
}

.cs-mobile-name {
  font-size: 16px !important;
}

.cs-agent-status,
.cs-mobile-status-text {
  font-size: 14px !important;
  color: rgba(255, 255, 255, 0.95) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  line-height: 1.3 !important;
  font-weight: 500 !important;
  font-family: inherit !important;
  padding: 0 !important;
  border: none !important;
  flex-wrap: wrap !important;
  min-width: 80px !important;
}

.cs-mobile-status-text {
  font-size: 13px !important;
}

.cs-product-info-header,
.cs-mobile-product-info {
  font-size: 13px !important;
  opacity: 0.9 !important;
}

/* ✅ STATUS INDICATORS */
.cs-status-dot {
  width: 8px !important;
  height: 8px !important;
  border-radius: 50% !important;
  background: #00D26A !important;
  flex-shrink: 0 !important;
  animation: cs-pulse-status 2s infinite !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

.cs-status-indicator,
.cs-mobile-status {
  position: absolute !important;
  bottom: 2px !important;
  right: 2px !important;
  width: 14px !important;
  height: 14px !important;
  border-radius: 50% !important;
  background: #00D26A !important;
  border: 3px solid #ffffff !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
}

/* ✅ BOUTONS HEADER */
.cs-header-actions,
.cs-mobile-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cs-action-button,
.cs-mobile-reset {
  background: rgba(255, 255, 255, 0.15) !important;
  border: none !important;
  color: #ffffff !important;
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
  backdrop-filter: blur(10px) !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
  text-decoration: none !important;
  font-size: 16px !important;
  line-height: 1 !important;
}

.cs-close-button,
.cs-mobile-close {
  background: rgba(255, 255, 255, 0.15) !important;
  border: none !important;
  color: #ffffff !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
  backdrop-filter: blur(10px) !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
  text-decoration: none !important;
  font-size: 16px !important;
  line-height: 1 !important;
}

.cs-close-button:hover,
.cs-mobile-close:hover,
.cs-action-button:hover,
.cs-mobile-reset:hover {
  background: rgba(255, 255, 255, 0.25) !important;
  transform: scale(1.05) !important;
}

.cs-close-button:hover {
  transform: rotate(90deg) !important;
}

/* ✅ ZONE MESSAGES */
.cs-messages-area-desktop {
  flex: 1 !important;
  background: linear-gradient(to bottom, #fafbfc 0%, #ffffff 100%) !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 24px !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  color: #374151 !important;
  font-family: inherit !important;
  position: relative !important;
  margin: 0 !important;
  border: none !important;
}

.cs-messages-area-mobile {
  flex: 1 !important;
  background: #fafbfc !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 20px !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important;
  color: #374151 !important;
  font-family: inherit !important;
  position: relative !important;
  margin: 0 !important;
  border: none !important;
}

.cs-messages-list,
.cs-mobile-messages-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 18px !important;
  min-height: 100% !important;
  flex: 1 !important;
  color: #374151 !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  list-style: none !important;
}

/* ✅ MESSAGES */
.cs-message-item,
.cs-mobile-message {
  display: flex !important;
  max-width: 100% !important;
  align-items: flex-start !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  opacity: 1 !important;
  animation: cs-message-appear 0.3s ease-out !important;
}

.cs-assistant-message,
.cs-mobile-assistant {
  justify-content: flex-start !important;
}

.cs-user-message,
.cs-mobile-user {
  justify-content: flex-end !important;
}

/* ✅ BULLES MESSAGES */
.cs-assistant-bubble,
.cs-mobile-assistant-bubble {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  max-width: 85% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.cs-user-bubble,
.cs-mobile-user-bubble {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  max-width: 85% !important;
  flex-direction: row-reverse !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* ✅ AVATARS MESSAGES */
.cs-message-avatar,
.cs-mobile-message-avatar {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
  border: 2px solid #f3f4f6 !important;
  background: #f3f4f6 !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cs-message-avatar img,
.cs-mobile-message-avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
  border: none !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cs-user-avatar,
.cs-mobile-user-avatar {
  width: 36px !important;
  height: 36px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #ffffff !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  flex-shrink: 0 !important;
  text-transform: uppercase !important;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3) !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  line-height: 1 !important;
}

/* ✅ CONTENU MESSAGES */
.cs-message-content,
.cs-mobile-bubble-content {
  flex: 1 !important;
  min-width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  color: inherit !important;
  font-family: inherit !important;
}

/* ✅ TEXTE MESSAGES */
.cs-message-text,
.cs-mobile-message-text {
  border-radius: 20px !important;
  padding: 14px 18px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  margin: 0 0 6px 0 !important;
  display: block !important;
  max-width: 100% !important;
  overflow-wrap: break-word !important;
  font-weight: 400 !important;
  font-family: inherit !important;
  text-decoration: none !important;
  outline: none !important;
  position: relative !important;
  z-index: 1 !important;
}

.cs-assistant-text,
.cs-mobile-assistant-text {
  background: #ffffff !important;
  color: #2d3748 !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

.cs-user-text,
.cs-mobile-user-text {
  background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3) !important;
  margin-left: auto !important;
}

.cs-message-time,
.cs-mobile-message-time {
  font-size: 11px !important;
  color: #9ca3af !important;
  padding: 0 4px !important;
  display: block !important;
  margin: 2px 0 0 0 !important;
  text-align: right !important;
  opacity: 0.8 !important;
  font-family: inherit !important;
  font-weight: normal !important;
  border: none !important;
  background: transparent !important;
}

/* ✅ TYPING INDICATOR */
.cs-typing-content,
.cs-mobile-typing {
  display: flex !important;
  flex-direction: column !important;
  gap: 4px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.cs-typing-indicator,
.cs-mobile-typing-dots {
  display: flex !important;
  gap: 4px !important;
  padding: 14px 18px !important;
  background: #ffffff !important;
  border-radius: 20px !important;
  border: 1px solid #e2e8f0 !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
  margin: 0 !important;
}

.cs-typing-dot,
.cs-mobile-dot {
  width: 6px !important;
  height: 6px !important;
  border-radius: 50% !important;
  background: #9ca3af !important;
  animation: cs-typing-animation 1.4s infinite !important;
  display: block !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

.cs-typing-dot:nth-child(1),
.cs-mobile-dot:nth-child(1) { animation-delay: 0s !important; }
.cs-typing-dot:nth-child(2),
.cs-mobile-dot:nth-child(2) { animation-delay: 0.2s !important; }
.cs-typing-dot:nth-child(3),
.cs-mobile-dot:nth-child(3) { animation-delay: 0.4s !important; }

/* ✅ INPUT SECTION */
.cs-input-section-desktop,
.cs-mobile-input-section {
  padding: 20px !important;
  border-top: 1px solid #e5e7eb !important;
  background: #ffffff !important;
  flex-shrink: 0 !important;
  margin: 0 !important;
  color: #374151 !important;
  font-family: inherit !important;
  position: relative !important;
  z-index: 2 !important;
}

.cs-mobile-input-section {
  padding-bottom: 16px !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.cs-input-container,
.cs-mobile-input-container {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 0 16px 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.cs-mobile-input-container {
  margin: 0 0 12px 0 !important;
  padding: 0 16px !important;
}

.cs-message-input,
.cs-mobile-message-input {
  flex: 1 !important;
  background: #f8fafc !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 25px !important;
  padding: 14px 18px !important;
  font-size: 14px !important;
  color: #374151 !important;
  font-family: inherit !important;
  line-height: 1.5 !important;
  resize: none !important;
  min-height: 20px !important;
  font-weight: 400 !important;
  margin: 0 !important;
  text-decoration: none !important;
  outline: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  transition: all 0.2s ease !important;
}

.cs-message-input:focus,
.cs-mobile-message-input:focus {
  background: #ffffff !important;
  border-color: #EC4899 !important;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.1) !important;
}

.cs-message-input::placeholder,
.cs-mobile-message-input::placeholder {
  color: #9ca3af !important;
  opacity: 1 !important;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: normal !important;
}

/* ✅ BOUTONS VOICE */
.cs-voice-button,
.cs-mobile-voice {
  background: transparent !important;
  border: none !important;
  color: #9ca3af !important;
  cursor: pointer !important;
  padding: 6px !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 32px !important;
  height: 32px !important;
  margin: 0 !important;
  outline: none !important;
  font-family: inherit !important;
}

.cs-voice-button:hover,
.cs-mobile-voice:hover {
  color: #6b7280 !important;
  background: rgba(0, 0, 0, 0.05) !important;
}

/* ✅ BOUTONS SEND */
.cs-send-button,
.cs-mobile-send {
  width: 44px !important;
  height: 44px !important;
  background: #EC4899 !important;
  border: none !important;
  border-radius: 50% !important;
  color: #ffffff !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
  box-shadow: 0 4px 14px rgba(236, 72, 153, 0.4) !important;
  transform: translateY(0) !important;
  margin: 0 !important;
  padding: 0 !important;
  outline: none !important;
  font-family: inherit !important;
  font-size: 16px !important;
  line-height: 1 !important;
  text-decoration: none !important;
  appearance: none !important;
  -webkit-appearance: none !important;
}

.cs-send-button:hover:not(:disabled),
.cs-mobile-send:hover:not(:disabled) {
  transform: translateY(-1px) !important;
  box-shadow: 0 6px 18px rgba(236, 72, 153, 0.5) !important;
}

.cs-send-button:disabled,
.cs-mobile-send:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

.cs-loading-spinner,
.cs-mobile-loading-spinner {
  width: 20px !important;
  height: 20px !important;
  border: 2px solid transparent !important;
  border-top: 2px solid currentColor !important;
  border-radius: 50% !important;
  animation: cs-spin 1s linear infinite !important;
  margin: 0 !important;
  padding: 0 !important;
  display: block !important;
}

/* ✅ FOOTER CORRIGÉ */
.cs-footer-info {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 11px !important;
  color: #9ca3af !important;
  gap: 4px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
  line-height: 1.3 !important;
  text-align: center !important;
}

.cs-mobile-footer {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 10px !important;
  color: #9ca3af !important;
  margin-top: 12px !important;
  padding: 0 16px !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
  line-height: 1.3 !important;
  text-align: center !important;
  gap: 4px !important;
}

.cs-powered-by,
.cs-mobile-powered {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  font-weight: 500 !important;
  color: inherit !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  text-decoration: none !important;
}

.cs-security,
.cs-mobile-security {
  display: flex !important;
  align-items: center !important;
  gap: 4px !important;
  font-weight: 500 !important;
  color: inherit !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  text-decoration: none !important;
}

/* ✅ SCROLLBARS */
.cs-messages-area-desktop::-webkit-scrollbar,
.cs-messages-area-mobile::-webkit-scrollbar {
  width: 4px !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-track,
.cs-messages-area-mobile::-webkit-scrollbar-track {
  background: transparent !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-thumb,
.cs-messages-area-mobile::-webkit-scrollbar-thumb {
  background: rgba(236, 72, 153, 0.3) !important;
  border-radius: 2px !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-thumb:hover,
.cs-messages-area-mobile::-webkit-scrollbar-thumb:hover {
  background: rgba(236, 72, 153, 0.5) !important;
}

/* ✅ RESPONSIVE */
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

/* ✅ ANIMATIONS */
@keyframes cs-pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes cs-typing-animation {
  0%, 60%, 100% {
    transform: translateY(0) !important;
  }
  30% {
    transform: translateY(-6px) !important;
  }
}

@keyframes cs-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes cs-fadeIn {
  0% { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes cs-message-appear {
  0% { 
    opacity: 0;
    transform: translateY(10px);
  }
  100% { 
    opacity: 1;
    transform: translateY(0);
  }
}

.cs-chat-container-desktop {
  animation: cs-fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* ✅ PROTECTION FINALE ANTI-SHOPIFY */
.cs-chatseller-widget {
  contain: layout style !important;
  isolation: isolate !important;
}

.cs-chatseller-widget,
.cs-chatseller-widget * {
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
  user-select: auto !important;
  -webkit-user-select: auto !important;
  -moz-user-select: auto !important;
  -ms-user-select: auto !important;
}

.cs-chatseller-widget input,
.cs-chatseller-widget textarea,
.cs-chatseller-widget button {
  -webkit-appearance: none !important;
  -moz-appearance: none !important;
  appearance: none !important;
  background-image: none !important;
  background-clip: padding-box !important;
}

/* ✅ PRINT MEDIA */
@media print {
  .cs-chatseller-widget,
  .cs-chat-modal-overlay {
    display: none !important;
  }
}
    `
  }

  // ✅ CHANGÉ DE PRIVATE À PUBLIC pour permettre l'accès depuis l'extérieur
  public cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-modal',
      '[data-chatseller]',
      '.chatseller-widget'
    ]
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => el.remove())
    })
  }

  // ✅ CHANGÉ DE PRIVATE À PUBLIC pour permettre l'accès depuis l'extérieur
  public detectProductInfo(): boolean {
    try {
      console.log('🔍 Détection produit...')
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId

      // ✅ DÉTECTION SHOPIFY AVANCÉE
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString()
        console.log('✅ Produit Shopify détecté:', detectedName)
      }
      
      // ✅ SÉLECTEURS DE TITRE ÉTENDUS
      if (!detectedName) {
        const titleSelectors = [
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title',
          'h1[class*="product"]',
          '.product-title h1',
          '.product-info__title',
          '.product-detail-title'
        ]
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedName = element.textContent.trim()
            console.log(`✅ Titre détecté via ${selector}:`, detectedName)
            break
          }
        }
      }

      // ✅ SÉLECTEURS DE PRIX ÉTENDUS
      if (!detectedPrice) {
        const priceSelectors = [
          '.price__current',
          '.product-form__price .price',
          '.money',
          '.price-current',
          '.product-price',
          '.price .money',
          '[data-product-price]'
        ]
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedPrice = parseFloat(priceMatch[0].replace(',', '.'))
              console.log(`✅ Prix détecté via ${selector}:`, detectedPrice)
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
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
    const position = this.config.position || 'above-cta'
    
    // ✅ SÉLECTEURS CTA ÉTENDUS
    const ctaSelectors = [
      '.product-form__buttons',
      'form[action*="/cart/add"] button[type="submit"]',
      '.product-form button[name="add"]',
      '.add-to-cart',
      'button[name="add"]',
      '.product-form__cart-submit',
      '.btn.product-form__cart-submit',
      '.shopify-payment-button'
    ]
    
    let targetElement = null
    
    for (const selector of ctaSelectors) {
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
    
    // ✅ FALLBACKS ÉTENDUS
    const fallbackSelectors = [
      'form[action*="/cart/add"]',
      '.product-form',
      '.product-single',
      '.product-details',
      '.main-content'
    ]
    
    for (const selector of fallbackSelectors) {
      const fallbackElement = document.querySelector(selector)
      if (fallbackElement) {
        try {
          fallbackElement.appendChild(container)
          console.log(`✅ Widget inséré via fallback: ${selector}`)
          return
        } catch (error) {
          console.warn('⚠️ Erreur insertion fallback:', error)
        }
      }
    }
    
    // ✅ FALLBACK FINAL
    if (!this.config.disableFallback) {
      console.log('⚠️ Fallback: insertion body')
      document.body.appendChild(container)
    }
  }

  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à la vendeuse'
    const primaryColor = this.config.primaryColor || '#EC4899'
    const darkerColor = this.adjustColor(primaryColor, -15)
    const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'full')

    // ✅ BOUTON AVEC ICÔNE ET CONFIGURATION DYNAMIQUE
    this.widgetElement.innerHTML = `
      <button 
        id="chatseller-trigger-btn"
        class="cs-chat-trigger-button"
        style="
          width: 100% !important;
          padding: 16px 24px !important;
          background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: ${borderRadius} !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 8px 25px rgba(236, 72, 153, 0.3) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          outline: none !important;
          min-height: 56px !important;
          margin: 0 !important;
          text-transform: none !important;
          letter-spacing: normal !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 999999 !important;
        "
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
        </svg>
        <span>${buttonText}</span>
      </button>
    `

    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      triggerBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        this.openChat()
      })
    }
  }

  // ✅ CORRECTION PRINCIPALE : Le bouton ne disparaît JAMAIS
  private openChat() {
    console.log('💬 Ouverture chat, état actuel:', { isOpen: this.isOpen, modalExists: !!this.modalElement })
    
    // Si modal déjà ouvert, ne rien faire
    if (this.isOpen && this.modalElement) {
      console.log('🔄 Modal déjà ouvert')
      return
    }
    
    // ✅ LE BOUTON RESTE TOUJOURS VISIBLE - NE JAMAIS LE CACHER
    this.isOpen = true
    
    try {
      this.createVueChatModal()
    } catch (error) {
      console.error('❌ Erreur ouverture chat Vue:', error)
      this.createFallbackModal()
    }
  }

  private createVueChatModal() {
    this.modalElement = document.createElement('div')
    this.modalElement.id = 'chatseller-vue-modal'
    this.modalElement.className = 'cs-chat-modal-overlay'

    // ✅ STYLES INLINE POUR FORCER L'AFFICHAGE
    this.modalElement.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.75) !important;
      backdrop-filter: blur(12px) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 20px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
    `

    document.body.appendChild(this.modalElement)

    try {
      this.initVueWidget()
    } catch (error) {
      console.error('❌ Erreur Vue:', error)
      throw error
    }
  }

  private initVueWidget(): void {
    try {
      console.log('🎨 Initialisation composant Vue...')
      
      if (!this.modalElement) {
        throw new Error('Modal element non trouvé')
      }
      
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

      console.log('✅ Composant Vue initialisé')

    } catch (error) {
      console.error('❌ Erreur initialisation Vue:', error)
      throw error
    }
  }

  private createFallbackModal() {
    const agentName = this.config.agentConfig?.name || 'Anna'
    const primaryColor = this.config.primaryColor || '#EC4899'

    this.modalElement = document.createElement('div')
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.innerHTML = `
      <div style="
        width: 400px; height: 500px; background: white; border-radius: 16px;
        display: flex; flex-direction: column; padding: 20px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <h3 style="margin: 0 0 20px 0; color: ${primaryColor};">
          💬 ${agentName} - Vendeuse IA
        </h3>
        <p style="margin: 0 0 20px 0; color: #666;">
          Interface de chat en cours de chargement...
        </p>
        <button 
          id="close-fallback"
          style="
            background: ${primaryColor}; color: white; border: none; 
            padding: 10px 20px; border-radius: 8px; cursor: pointer;
            margin-top: auto;
          "
        >
          Fermer
        </button>
      </div>
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#close-fallback')
    closeBtn?.addEventListener('click', () => this.closeChat())
  }

  private createFallbackWidget() {
    console.log('🔧 ChatSeller: Création widget de fallback')
    
    const container = document.createElement('div')
    container.className = 'cs-chatseller-widget'
    container.innerHTML = `
      <div style="
        background: #f3f4f6; padding: 12px; border-radius: 8px;
        text-align: center; font-size: 14px; color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        ⚠️ Widget ChatSeller en cours de chargement...
      </div>
    `
    
    const targetElement = document.querySelector('.product-form__buttons') ||
                         document.querySelector('.product-form') ||
                         document.querySelector('form[action*="/cart/add"]')
    
    if (targetElement) {
      targetElement.insertBefore(container, targetElement.firstChild)
    } else {
      document.body.appendChild(container)
    }
  }

  // ✅ MÉTHODE : Fermer le chat SANS détruire le bouton
  closeChat() {
    console.log('❌ Fermeture chat')
    this.isOpen = false
    
    if (this.modalElement) {
      if (this.vueApp) {
        this.vueApp.unmount()
        this.vueApp = null
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    
    // ✅ LE BOUTON RESTE TOUJOURS VISIBLE
  }

  private getBorderRadiusValue(radius: string): string {
    const radiusMap = {
      'none': '0px',
      'sm': '8px',
      'md': '12px',
      'lg': '16px',
      'xl': '24px',
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
    console.log('🗑️ Destruction complète du widget')
    this.cleanupExistingWidgets()
    if (this.modalElement) {
      if (this.vueApp) {
        this.vueApp.unmount()
      }
      this.modalElement.remove()
      this.modalElement = null
    }
    const styles = document.getElementById('chatseller-styles')
    if (styles) styles.remove()
    this.isInitialized = false
    this.cssInjected = false
  }

  // ✅ GESTION LOCALSTORAGE
  saveConversation(messages: any[], conversationId: string | null) {
    try {
      const conversationData = {
        messages,
        conversationId,
        timestamp: new Date().toISOString(),
        shopId: this.config.shopId
      }
      localStorage.setItem(`chatseller-conversation-${this.config.shopId}`, JSON.stringify(conversationData))
      console.log('💾 Conversation sauvegardée')
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde conversation:', error)
    }
  }

  loadConversation() {
    try {
      const saved = localStorage.getItem(`chatseller-conversation-${this.config.shopId}`)
      if (saved) {
        const data = JSON.parse(saved)
        console.log('📂 Conversation restaurée')
        return data
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement conversation:', error)
    }
    return null
  }

  resetConversation() {
    try {
      localStorage.removeItem(`chatseller-conversation-${this.config.shopId}`)
      console.log('🔄 Conversation réinitialisée')
    } catch (error) {
      console.warn('⚠️ Erreur reset conversation:', error)
    }
  }

  get isReady(): boolean {
    return this.isInitialized
  }

  get version(): string {
    return '1.5.0'
  }
}

// ✅ INITIALISATION AUTOMATIQUE POUR WIDGET EMBEDDABLE
(() => {
  const chatSeller = new ChatSeller()
  
  // ✅ EXPOSITION GLOBALE IMMÉDIATE
  if (typeof window !== 'undefined') {
    (window as any).ChatSeller = chatSeller
    
    // ✅ AUTO-INIT INTELLIGENT
    const autoInit = () => {
      if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
        chatSeller.init((window as any).ChatSellerConfig)
      }
    }
    
    // ✅ GESTION MULTI-ÉTAT DU DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit)
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setTimeout(autoInit, 100)
    }
    
    // ✅ SUPPORT SHOPIFY SECTIONS DYNAMIQUES AVANCÉ
    if (typeof window !== 'undefined') {
      // Détecter si on est sur Shopify
      if ((window as any).Shopify || document.querySelector('[data-shopify]') || window.location.hostname.includes('myshopify.com')) {
        console.log('🛍️ ChatSeller: Mode Shopify activé')
        
        // Écouter les changements de section Shopify
        document.addEventListener('shopify:section:load', function(event) {
          console.log('🔄 ChatSeller: Section Shopify rechargée')
          setTimeout(() => {
            if (!chatSeller.isReady) {
              autoInit()
            }
          }, 1000)
        })
        
        document.addEventListener('shopify:section:unload', function(event) {
          console.log('🗑️ ChatSeller: Section Shopify déchargée')
          chatSeller.cleanupExistingWidgets()
        })
        
        // Écouter les changements de variantes
        document.addEventListener('variant:change', function() {
          console.log('🔄 ChatSeller: Variante changée')
          if (chatSeller.config?.autoDetectProduct) {
            chatSeller.detectProductInfo()
          }
        })
        
        // ✅ GESTION SPA SHOPIFY (AJAX)
        let currentUrl = window.location.href
        setInterval(() => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href
            console.log('🔄 ChatSeller: URL changée (SPA), rechargement widget')
            chatSeller.cleanupExistingWidgets()
            setTimeout(autoInit, 700)
          }
        }, 2000)
      }
    }
    
    console.log('✅ ChatSeller widget chargé - version 1.5.0')
  }
})()

// ✅ DÉCLARATIONS TYPESCRIPT ÉTENDUES
declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
    // ✅ AJOUT DES TYPES SHOPIFY POUR CORRIGER L'ERREUR
    Shopify?: {
      [key: string]: any
    }
    ShopifyAnalytics?: {
      meta?: {
        product?: {
          id: number
          title: string
          price: number
          [key: string]: any
        }
        [key: string]: any
      }
      [key: string]: any
    }
  }
}