// src/embed.ts 

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
  agentConfig?: {
    id?: string
    name?: string
    title?: string
    avatar?: string
    welcomeMessage?: string  
    fallbackMessage?: string
    personality?: string
    customProductType?: string  
    shopName?: string  
  }
  forceContainer?: string
  debug?: boolean
  disableFallback?: boolean
}

class ChatSeller {
  public config: ChatSellerConfig
  private widgetElement: HTMLElement | null = null
  private isInitialized = false
  private isOpen = false
  private modalElement: HTMLElement | null = null
  private vueApp: any = null
  private cssInjected = false
  private conversationData: any = null // ✅ RESTAURÉ : Persistance conversation

  constructor() {
    this.config = {
      shopId: '',
      apiUrl: 'https://chatseller-api-production.up.railway.app',
      theme: 'modern',
      primaryColor: '#8B5CF6', 
      position: 'above-cta',
      buttonText: 'Parler au vendeur',
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

    if (!this.isProductPage()) {
      console.log('🚫 [INIT] Page non-produit, initialisation annulée')
      return
    }

    console.log('🚀 Initialisation ChatSeller widget...', config.shopId)
    this.config = { ...this.config, ...config }

    if (!this.config.shopId) {
      console.error('❌ ChatSeller: shopId requis')
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
    // ✅ RESTAURÉ : UTILISER LA COULEUR CONFIGURÉE DYNAMIQUEMENT
    const primaryColor = this.config.primaryColor || '#8B5CF6'
    const darkerColor = this.adjustColor(primaryColor, -15)
    const rgbColor = this.hexToRgb(primaryColor)
    
    return `
/* ✅ CHATSELLER WIDGET - CSS COMPLET RESTAURÉ AVEC CORRECTIONS ICÔNE */
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

/* ✅ CORRECTION MAJEURE : BOUTON TRIGGER AVEC ICÔNE FORCÉE ET COULEUR DYNAMIQUE */
.cs-chat-trigger-button {
  width: 100% !important;
  padding: 16px 24px !important;
  background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%) !important;
  color: white !important;
  border: none !important;
  border-radius: 50px !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  cursor: pointer !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 8px 25px rgba(${rgbColor}, 0.3) !important;
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
  box-shadow: 0 12px 35px rgba(${rgbColor}, 0.4) !important;
}

/* ✅ CORRECTION MAJEURE : Styles SVG forcés avec !important maximal pour corriger icône manquante */
.cs-chat-trigger-button svg {
  width: 20px !important;
  height: 20px !important;
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2 !important;
  flex-shrink: 0 !important;
  display: block !important;
  opacity: 1 !important;
  visibility: visible !important;
  position: relative !important;
  z-index: 999999 !important;
  pointer-events: none !important;
  /* ✅ AJOUT : Forces supplémentaires pour Shopify */
  min-width: 20px !important;
  max-width: 20px !important;
  min-height: 20px !important;
  max-height: 20px !important;
  color: white !important;
  stroke: white !important;
}

.cs-chat-trigger-button svg path {
  fill: none !important;
  stroke: currentColor !important;
  stroke-width: 2 !important;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
  opacity: 1 !important;
  visibility: visible !important;
  display: block !important;
  pointer-events: none !important;
  color: white !important;
  stroke: white !important;
}

/* ✅ PROTECTION ANTI-OVERRIDE SHOPIFY/AUTRES THEMES */
.cs-chat-trigger-button svg,
.cs-chat-trigger-button svg * {
  transition: none !important;
  transform: none !important;
  animation: none !important;
  box-shadow: none !important;
  text-shadow: none !important;
  filter: none !important;
}

.cs-chat-trigger-button:hover svg {
  opacity: 1 !important;
  transform: none !important;
}

/* ✅ SPECIFIQUE SHOPIFY - NEUTRALISER LEURS OVERRIDES */
.shopify-section .cs-chat-trigger-button svg,
.product-form .cs-chat-trigger-button svg,
[class*="product"] .cs-chat-trigger-button svg {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
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

/* ✅ CORRECTION : Mobile plein écran forcé */
@media (max-width: 767px) {
  .cs-chat-modal-overlay {
    padding: 0 !important;
    align-items: stretch !important;
    justify-content: stretch !important;
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    height: 100dvh !important; /* ✅ Dynamic viewport height pour mobile */
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
  animation: cs-fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

/* ✅ CORRECTION : Mobile plein écran strict */
.cs-chat-container-mobile {
  width: 100vw !important;
  height: 100dvh !important; /* ✅ Dynamic viewport height */
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
  z-index: 2147483647 !important;
}

/* ✅ HEADERS CORRIGÉS - COULEUR DYNAMIQUE */
.cs-desktop-header,
.cs-mobile-header {
  padding: 20px !important;
  color: #ffffff !important;
  background: linear-gradient(135deg, ${primaryColor} 0%, ${darkerColor} 100%) !important;
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

/* ✅ CORRECTION : Mobile safe area */
.cs-mobile-header {
  padding: calc(env(safe-area-inset-top) + 16px) 20px 16px 20px !important;
  min-height: calc(75px + env(safe-area-inset-top)) !important;
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
  margin: 0 0 4px 0 !important;
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

/* ✅ STATUS AVEC PRODUIT SUR MÊME LIGNE */
.cs-agent-status,
.cs-mobile-status-text {
  font-size: 14px !important;
  color: rgba(255, 255, 255, 0.95) !important;
  margin: 0 !important;
  display: flex !important;
  align-items: center !important;
  flex-wrap: wrap !important;
  gap: 8px !important;
  line-height: 1.3 !important;
  font-weight: 500 !important;
  font-family: inherit !important;
  padding: 0 !important;
  border: none !important;
  min-width: 0 !important;
}

.cs-mobile-status-text {
  font-size: 13px !important;
  gap: 6px !important;
}

/* ✅ SECTION STATUS EN LIGNE */
.cs-online-section {
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
  white-space: nowrap !important;
  flex-shrink: 0 !important;
}

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

/* ✅ SÉPARATEUR ET NOM PRODUIT */
.cs-product-separator {
  color: rgba(255, 255, 255, 0.7) !important;
  margin: 0 4px !important;
  flex-shrink: 0 !important;
}

.cs-product-name {
  font-size: 13px !important;
  opacity: 0.9 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
  max-width: 200px !important;
  flex-shrink: 1 !important;
  min-width: 0 !important;
}

/* ✅ BOUTONS HEADER */
.cs-header-actions,
.cs-mobile-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 !important;
  padding: 0 !important;
  flex-shrink: 0 !important;
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

/* ✅ ZONE MESSAGES STYLE WHATSAPP */
.cs-messages-area-desktop {
  flex: 1 !important;
  background: #f0f2f5 !important;
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

.cs-messages-area-mobile {
  flex: 1 !important;
  background: #f0f2f5 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding: 16px !important;
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
  gap: 12px !important;
  min-height: 100% !important;
  flex: 1 !important;
  color: #374151 !important;
  font-family: inherit !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  list-style: none !important;
}

/* ✅ MESSAGES ALIGNMENT WHATSAPP STYLE */
.cs-message-item,
.cs-mobile-message {
  display: flex !important;
  max-width: 100% !important;
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

/* ✅ BULLES SANS AVATARS - NOM DANS BULLE */
.cs-assistant-bubble,
.cs-mobile-assistant-bubble {
  max-width: 75% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.cs-user-bubble,
.cs-mobile-user-bubble {
  max-width: 75% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

/* ✅ BULLES DE MESSAGES STYLE WHATSAPP SIMPLIFIÉ */
.cs-message-text,
.cs-mobile-message-text {
  border-radius: 18px !important;
  padding: 10px 14px !important;
  font-size: 14px !important;
  line-height: 1.4 !important;
  word-wrap: break-word !important;
  word-break: break-word !important;
  margin: 0 !important;
  display: block !important;
  max-width: 100% !important;
  overflow-wrap: break-word !important;
  font-weight: 400 !important;
  font-family: inherit !important;
  text-decoration: none !important;
  outline: none !important;
  position: relative !important;
  z-index: 1 !important;
  box-shadow: none !important;
  border: none !important;
}

/* ✅ TEXTE ASSISTANT AVEC NOM INTÉGRÉ */
.cs-assistant-text,
.cs-mobile-assistant-text {
  background: #ffffff !important;
  color: #1f2937 !important;
}

/* ✅ NOM AGENT DANS BULLE AVEC COULEUR DYNAMIQUE */
.cs-agent-name-in-bubble {
  font-weight: 700 !important;
  font-size: 13px !important;
  color: ${primaryColor} !important;
  margin: 0 0 2px 0 !important;
  display: block !important;
  font-family: inherit !important;
}

.cs-agent-title-in-bubble {
  font-weight: 500 !important;
  font-size: 11px !important;
  color: #6b7280 !important;
  margin: 0 0 6px 0 !important;
  display: block !important;
  font-family: inherit !important;
}

/* ✅ TEXTE UTILISATEUR AVEC "VOUS" INTÉGRÉ ET COULEUR DYNAMIQUE */
.cs-user-text,
.cs-mobile-user-text {
  background: ${primaryColor} !important;
  color: #ffffff !important;
  margin-left: auto !important;
}

.cs-you-label-in-bubble {
  font-weight: 700 !important;
  font-size: 13px !important;
  color: rgba(255, 255, 255, 0.9) !important;
  margin: 0 0 4px 0 !important;
  display: block !important;
  font-family: inherit !important;
}

/* ✅ TEMPS MESSAGE */
.cs-message-time,
.cs-mobile-message-time {
  font-size: 11px !important;
  color: #9ca3af !important;
  padding: 0 !important;
  display: block !important;
  margin: 4px 0 0 0 !important;
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
  max-width: 75% !important;
}

.cs-typing-indicator,
.cs-mobile-typing-dots {
  display: flex !important;
  gap: 4px !important;
  padding: 12px 16px !important;
  background: #ffffff !important;
  border-radius: 18px !important;
  margin: 0 !important;
  box-shadow: none !important;
  border: none !important;
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
  padding: 16px 20px !important;
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
  padding-bottom: calc(16px + env(safe-area-inset-bottom)) !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

.cs-input-container,
.cs-mobile-input-container {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  margin: 0 0 12px 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.cs-mobile-input-container {
  margin: 0 0 10px 0 !important;
  padding: 0 16px !important;
}

.cs-message-input,
.cs-mobile-message-input {
  flex: 1 !important;
  background: #f8fafc !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 25px !important;
  padding: 12px 16px !important;
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
  border-color: ${primaryColor} !important;
  box-shadow: 0 0 0 3px rgba(${rgbColor}, 0.1) !important;
}

.cs-message-input::placeholder,
.cs-mobile-message-input::placeholder {
  color: #9ca3af !important;
  opacity: 1 !important;
  font-family: inherit !important;
  font-size: inherit !important;
  font-weight: normal !important;
}

/* ✅ BOUTONS VOICE ET SEND AVEC COULEURS DYNAMIQUES */
.cs-voice-button,
.cs-mobile-voice {
  background: #6B7280 !important; /* ✅ GRIS POUR MICRO */
  border: none !important;
  color: #ffffff !important;
  cursor: pointer !important;
  padding: 6px !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 36px !important;
  height: 36px !important;
  margin: 0 !important;
  outline: none !important;
  font-family: inherit !important;
}

.cs-voice-button:hover,
.cs-mobile-voice:hover {
  background: #4B5563 !important;
  transform: scale(1.05) !important;
}

.cs-send-button,
.cs-mobile-send {
  width: 44px !important;
  height: 44px !important;
  background: ${primaryColor} !important; /* ✅ COULEUR DYNAMIQUE */
  border: none !important;
  border-radius: 50% !important;
  color: #ffffff !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0 !important;
  box-shadow: 0 4px 14px rgba(${rgbColor}, 0.4) !important;
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
  box-shadow: 0 6px 18px rgba(${rgbColor}, 0.5) !important;
  background: ${darkerColor} !important;
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

/* ✅ FOOTER CORRIGÉ DEUX COLONNES */
.cs-footer-info {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 11px !important;
  color: #9ca3af !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
  line-height: 1.3 !important;
  width: 100% !important;
}

.cs-mobile-footer {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 10px !important;
  color: #9ca3af !important;
  margin: 0 !important;
  padding: 0 16px !important;
  border: none !important;
  background: transparent !important;
  font-family: inherit !important;
  line-height: 1.3 !important;
  width: 100% !important;
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
  text-align: left !important;
  flex-shrink: 0 !important;
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
  text-align: right !important;
  flex-shrink: 0 !important;
}

/* ✅ SCROLLBARS CUSTOMISÉES AVEC COULEUR DYNAMIQUE */
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
  background: rgba(${rgbColor}, 0.3) !important;
  border-radius: 2px !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-thumb:hover,
.cs-messages-area-mobile::-webkit-scrollbar-thumb:hover {
  background: rgba(${rgbColor}, 0.5) !important;
}

/* ✅ RESPONSIVE QUERIES */
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
  
  .cs-product-name {
    max-width: 120px !important;
  }
}

@media (max-width: 480px) {
  .cs-agent-name,
  .cs-mobile-name {
    font-size: 15px !important;
  }
  
  .cs-agent-status,
  .cs-mobile-status-text {
    font-size: 12px !important;
  }
  
  .cs-product-name {
    max-width: 100px !important;
  }
}

/* ✅ ANIMATIONS COMPLÈTES */
@keyframes cs-pulse-status {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.1); 
  }
}

@keyframes cs-typing-animation {
  0%, 60%, 100% {
    transform: translateY(0) !important;
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6px) !important;
    opacity: 1;
  }
}

@keyframes cs-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes cs-fadeIn {
  0% { 
    opacity: 0; 
    transform: scale(0.96) translateY(10px); 
  }
  100% { 
    opacity: 1; 
    transform: scale(1) translateY(0); 
  }
}

@keyframes cs-message-appear {
  0% { 
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  100% { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ✅ PROTECTION FINALE ANTI-CONFLITS */
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

/* ✅ PROTECTION SHOPIFY/WOOCOMMERCE */
.cs-chatseller-widget * {
  box-sizing: border-box !important;
}

.cs-chatseller-widget button:not([type="submit"]):not([type="button"]):not([type="reset"]) {
  type: button !important;
}

/* ✅ PROTECTION MOBILE VIEWPORT */
@media (max-width: 767px) {
  html.cs-modal-open,
  body.cs-modal-open {
    overflow: hidden !important;
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .cs-chat-container-mobile {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 100vw !important;
    height: 100dvh !important;
    max-height: none !important;
    border-radius: 0 !important;
  }
}

/* ✅ PRINT MEDIA */
@media print {
  .cs-chatseller-widget,
  .cs-chat-modal-overlay {
    display: none !important;
  }
}

/* ✅ HIGH CONTRAST MODE */
@media (prefers-contrast: high) {
  .cs-chat-container-desktop,
  .cs-chat-container-mobile {
    border: 2px solid #000000 !important;
  }
  
  .cs-message-text,
  .cs-mobile-message-text {
    border: 1px solid #000000 !important;
  }
}

/* ✅ REDUCED MOTION */
@media (prefers-reduced-motion: reduce) {
  .cs-chatseller-widget *,
  .cs-chatseller-widget *::before,
  .cs-chatseller-widget *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
    `
  }

  public cleanupExistingWidgets(): void {
    const selectors = [
      '#chatseller-widget',
      '#chatseller-modal', 
      '#chatseller-vue-modal',
      '[data-chatseller]',
      '.chatseller-widget',
      '.cs-chat-modal-overlay'
    ]
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector)
      elements.forEach(el => {
        try {
          if (el.parentNode) {
            el.parentNode.removeChild(el)
          }
        } catch (error) {
          console.warn('Erreur suppression élément:', error)
        }
      })
    })
    
    console.log('🧹 Widgets existants nettoyés')
  }

  public detectProductInfo(): boolean {
    try {
      console.log('🔍 Détection produit...')
      
      let detectedName = this.config.productName
      let detectedPrice = this.config.productPrice
      let detectedId = this.config.productId

      // ✅ RESTAURÉ : DÉTECTION SHOPIFY AVANCÉE
      const shopifyProduct = (window as any).ShopifyAnalytics?.meta?.product
      if (shopifyProduct && shopifyProduct.title) {
        detectedName = shopifyProduct.title
        detectedPrice = shopifyProduct.price ? shopifyProduct.price / 100 : undefined
        detectedId = shopifyProduct.id?.toString()
        console.log('✅ Produit Shopify détecté:', detectedName)
      }
      
      // ✅ RESTAURÉ : SÉLECTEURS DE TITRE ÉTENDUS
      if (!detectedName) {
        const titleSelectors = [
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title',
          'h1[class*="product"]',
          '.product-title h1',
          '.product-info__title',
          '.product-detail-title',
          '.product-single__title h1',
          '.product__info .product__title',
          '.product-meta__title',
          '.product-single-title'
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

      // ✅ RESTAURÉ : SÉLECTEURS DE PRIX ÉTENDUS
      if (!detectedPrice) {
        const priceSelectors = [
          '.price__current',
          '.product-form__price .price',
          '.money',
          '.price-current',
          '.product-price',
          '.price .money',
          '[data-product-price]',
          '.product-single__price .money',
          '.product__price .money',
          '.price-sale .money',
          '.product-form__price'
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

      // ✅ RESTAURÉ : DÉTECTION WOOCOMMERCE
      const wooProduct = document.querySelector('.woocommerce-product')
      if (wooProduct && !detectedName) {
        const wooTitle = wooProduct.querySelector('.product_title, .entry-title')
        if (wooTitle?.textContent?.trim()) {
          detectedName = wooTitle.textContent.trim()
          console.log('✅ Produit WooCommerce détecté:', detectedName)
        }
      }

      if (detectedName) this.config.productName = detectedName
      if (detectedPrice) this.config.productPrice = detectedPrice
      if (detectedId) this.config.productId = detectedId
      if (!this.config.productUrl) this.config.productUrl = window.location.href

      console.log('🔍 Détection finale:', {
        name: detectedName,
        price: detectedPrice,
        id: detectedId
      })

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
      container.setAttribute('data-chatseller', 'main-widget')
      this.insertWidgetAtPosition(container)
    }

    this.widgetElement = container
    this.renderWidget()
  }

  private insertWidgetAtPosition(container: HTMLElement): void {
  // ✅ VÉRIFICATION STRICTE : SEULEMENT PAGES PRODUITS
  if (!this.isProductPage()) {
    console.log('🚫 [WIDGET] Page non-produit détectée, widget non inséré')
    return
  }

  const position = this.config.position || 'above-cta'
  
  // ✅ SÉLECTEURS CTA ÉTENDUS POUR SHOPIFY + WOOCOMMERCE + AUTRES
  const ctaSelectors = [
    // Shopify - ORDRE PRIORITÉ
    'form[action*="/cart/add"] button[type="submit"]',
    '.product-form__buttons button[name="add"]',
    '.product-form__cart-submit',
    '.product-single__add-to-cart',
    'button[name="add"]:not([name="add-to-cart"])',
    '.add-to-cart',
    '.shopify-payment-button__button',
    
    // WooCommerce
    '.single_add_to_cart_button',
    'button[name="add-to-cart"]',
    '.wc-add-to-cart',
    '.add_to_cart_button',
    
    // Générique
    'button[class*="add-to-cart"]',
    'button[class*="add-cart"]',
    'button[class*="buy"]',
    'button[class*="purchase"]',
    '.buy-button',
    '.purchase-button'
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
      const targetParent = targetElement.parentNode
      if (targetParent) {
        if (position === 'above-cta') {
          targetParent.insertBefore(container, targetElement)
        } else if (position === 'below-cta') {
          targetParent.insertBefore(container, targetElement.nextSibling)
        } else if (position === 'beside-cta') {
          if (targetElement instanceof HTMLElement) {
            targetElement.style.display = 'flex'
            targetElement.style.gap = '10px'
            targetElement.appendChild(container)
          } else {
            targetParent.insertBefore(container, targetElement.nextSibling)
          }
        } else {
          targetParent.insertBefore(container, targetElement.nextSibling)
        }
        
        console.log('✅ Widget inséré avec succès')
        return
      }
    } catch (error) {
      console.warn('⚠️ Erreur insertion:', error)
    }
  }
  
  console.warn('⚠️ Aucun bouton CTA trouvé sur cette page produit')
}

// ✅ NOUVELLE FONCTION : Détection stricte des pages produits
private isProductPage(): boolean {
  try {
    console.log('🔍 [PRODUCT PAGE] Vérification type de page...')
    
    // ✅ SHOPIFY - Vérifications multiples
    if (this.isShopify()) {
      // Vérifier template Shopify
      const shopifyTemplateMeta = document.querySelector('meta[name="shopify-template"]')
      if (shopifyTemplateMeta) {
        const template = shopifyTemplateMeta.getAttribute('content')
        console.log('🛍️ [SHOPIFY] Template détecté:', template)
        return template === 'product' || (template?.startsWith('product.') ?? false)
      }
      
      // Vérifier URL Shopify
      const isShopifyProductUrl = /\/products\/[^\/]+\/?(?:\?|$)/.test(window.location.pathname)
      if (isShopifyProductUrl) {
        console.log('✅ [SHOPIFY] URL produit confirmée:', window.location.pathname)
        return true
      }
      
      // Vérifier sélecteurs produit Shopify
      const shopifyProductSelectors = [
        'form[action*="/cart/add"]',
        '.product-form',
        '.product-single',
        '[data-product-handle]',
        '.product'
      ]
      
      for (const selector of shopifyProductSelectors) {
        if (document.querySelector(selector)) {
          console.log('✅ [SHOPIFY] Sélecteur produit trouvé:', selector)
          return true
        }
      }
    }
    
    // ✅ WOOCOMMERCE
    if (this.isWooCommerce()) {
      // Vérifier classe body WooCommerce
      if (document.body.classList.contains('single-product')) {
        console.log('✅ [WOOCOMMERCE] Page single-product confirmée')
        return true
      }
      
      // Vérifier sélecteurs WooCommerce
      const wooSelectors = [
        '.woocommerce-product',
        '.single-product',
        'form.cart',
        '.single_add_to_cart_button'
      ]
      
      for (const selector of wooSelectors) {
        if (document.querySelector(selector)) {
          console.log('✅ [WOOCOMMERCE] Sélecteur produit trouvé:', selector)
          return true
        }
      }
    }
    
    // ✅ DÉTECTION GÉNÉRIQUE
    const genericProductIndicators = [
      // URLs typiques
      () => /\/(product|item|p)\//.test(window.location.pathname),
      () => /\/products\/[^\/]+/.test(window.location.pathname),
      
      // Sélecteurs génériques
      () => !!document.querySelector('button[class*="add-to-cart"], button[class*="buy"], .product-price, [data-product-id]'),
      
      // Métadonnées
      () => !!document.querySelector('meta[property="product:price"], script[type="application/ld+json"]')?.textContent?.includes('"@type": "Product"')
    ]
    
    for (const indicator of genericProductIndicators) {
      if (indicator()) {
        console.log('✅ [GENERIC] Indicateur produit générique confirmé')
        return true
      }
    }
    
    console.log('🚫 [PRODUCT PAGE] Pas une page produit détectée')
    return false
    
  } catch (error) {
    console.warn('⚠️ Erreur détection page produit:', error)
    return false // En cas d'erreur, on ne montre pas le widget
  }
}

// ✅ HELPERS pour détection plateformes
private isShopify(): boolean {
  return !!(
    (window as any).Shopify ||
    document.querySelector('[data-shopify]') ||
    window.location.hostname.includes('myshopify.com') ||
    document.querySelector('script[src*="shopify"]') ||
    document.querySelector('meta[name="shopify-template"]')
  )
}

private isWooCommerce(): boolean {
  return !!(
    document.querySelector('.woocommerce') ||
    document.querySelector('[class*="woo"]') ||
    (window as any).wc_add_to_cart_params ||
    document.body.classList.contains('woocommerce')
  )
}

  private renderWidget() {
    if (!this.widgetElement) return

    const buttonText = this.config.buttonText || 'Parler à la vendeuse'
    const primaryColor = this.config.primaryColor || '#8B5CF6'
    const darkerColor = this.adjustColor(primaryColor, -15)
    const borderRadius = this.getBorderRadiusValue(this.config.borderRadius || 'full')

    // ✅ CORRECTION MAJEURE : BOUTON AVEC ICÔNE FORCÉE - SVG INLINE STRICT
    this.widgetElement.innerHTML = `
      <button 
        id="chatseller-trigger-btn"
        class="cs-chat-trigger-button"
        type="button"
        aria-label="Ouvrir le chat avec ${buttonText}"
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
          box-shadow: 0 8px 25px rgba(${this.hexToRgb(primaryColor)}, 0.3) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 8px !important;
          outline: none !important;
          min-height: 56px !important;
          margin: 0 !important;
          opacity: 1 !important;
          visibility: visible !important;
          position: relative !important;
          z-index: 999999 !important;
          text-decoration: none !important;
          user-select: none !important;
        "
      >
        <!-- ✅ CORRECTION ICÔNE : SVG INLINE FORCÉ AVEC PROTECTION MAXIMALE -->
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="white" 
          stroke-width="2" 
          stroke-linecap="round" 
          stroke-linejoin="round"
          style="
            flex-shrink: 0 !important; 
            display: block !important; 
            opacity: 1 !important; 
            visibility: visible !important;
            position: relative !important;
            z-index: 999999 !important;
            pointer-events: none !important;
            min-width: 20px !important;
            max-width: 20px !important;
            min-height: 20px !important;
            max-height: 20px !important;
            color: white !important;
            stroke: white !important;
          "
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
            fill="none"
            stroke="white"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            style="
              opacity: 1 !important;
              visibility: visible !important;
              display: block !important;
              pointer-events: none !important;
              color: white !important;
              stroke: white !important;
            "
          />
        </svg>
        <!-- ✅ TEXTE DU BOUTON -->
        <span style="
          flex: 1; 
          display: block !important; 
          text-align: center !important;
          opacity: 1 !important;
          visibility: visible !important;
          font-size: inherit !important;
          font-weight: inherit !important;
          color: white !important;
        ">${buttonText}</span>
      </button>
    `

    // ✅ RESTAURÉ : EVENT LISTENER ROBUSTE
    const triggerBtn = this.widgetElement.querySelector('#chatseller-trigger-btn') as HTMLElement
    if (triggerBtn) {
      // Supprimer les anciens listeners
      const newBtn = triggerBtn.cloneNode(true) as HTMLElement
      triggerBtn.parentNode?.replaceChild(newBtn, triggerBtn)
      
      // Ajouter le nouveau listener
      newBtn.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        console.log('🖱️ Clic sur bouton widget détecté')
        this.openChat()
      })
      
      // Hover effect avec couleur dynamique
      const rgbColor = this.hexToRgb(primaryColor)
      newBtn.addEventListener('mouseenter', () => {
        newBtn.style.transform = 'translateY(-2px)'
        newBtn.style.boxShadow = `0 12px 35px rgba(${rgbColor}, 0.4)`
      })
      
      newBtn.addEventListener('mouseleave', () => {
        newBtn.style.transform = 'translateY(0)'
        newBtn.style.boxShadow = `0 8px 25px rgba(${rgbColor}, 0.3)`
      })
    }
  }

  // ✅ RESTAURÉ : CORRECTION MAJEURE : Méthode openChat qui gère la réouverture
  private openChat() {
    console.log('💬 [OPEN CHAT] Tentative ouverture, état actuel:', { 
      isOpen: this.isOpen, 
      modalExists: !!this.modalElement,
      vueAppExists: !!this.vueApp 
    })
    
    // ✅ SI DÉJÀ OUVERT, NE RIEN FAIRE
    if (this.isOpen && this.modalElement && this.vueApp) {
      console.log('ℹ️ [OPEN CHAT] Chat déjà ouvert, ignore')
      return
    }
    
    // ✅ FERMER LE MODAL EXISTANT S'IL Y EN A UN PROPREMENT
    if (this.modalElement || this.isOpen) {
      console.log('🔄 [OPEN CHAT] Fermeture propre du chat existant...')
      this.closeChat()
      
      // Attendre un petit délai pour s'assurer que le nettoyage est terminé
      setTimeout(() => {
        this.proceedWithChatOpening()
      }, 100)
    } else {
      this.proceedWithChatOpening()
    }
  }

  private proceedWithChatOpening() {
    console.log('🚀 [OPEN CHAT] Procédure d\'ouverture...')
    this.isOpen = true
    
    // ✅ RESTAURÉ : AJOUT : Protection mobile viewport
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      document.documentElement.classList.add('cs-modal-open')
      document.body.classList.add('cs-modal-open')
    }
    
    try {
      this.createVueChatModal()
      console.log('✅ [OPEN CHAT] Modal Vue créé avec succès')
    } catch (error) {
      console.error('❌ [OPEN CHAT] Erreur création Vue:', error)
      this.createFallbackModal()
    }
  }

  private createVueChatModal() {
    // ✅ RESTAURÉ : NETTOYAGE PRÉVENTIF RENFORCÉ
    this.cleanupModalElements()

    console.log('🎨 [CREATE MODAL] Création du modal Vue...')

    this.modalElement = document.createElement('div')
    this.modalElement.id = 'chatseller-vue-modal'
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.setAttribute('data-chatseller', 'vue-modal')

    // ✅ RESTAURÉ : STYLES INLINE POUR FORCER L'AFFICHAGE
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
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
    `

    // ✅ RESTAURÉ : GESTION MOBILE
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      this.modalElement.style.padding = '0px !important'
      this.modalElement.style.alignItems = 'stretch !important'
      this.modalElement.style.justifyContent = 'stretch !important'
      this.modalElement.style.height = '100dvh !important' // ✅ Dynamic viewport height
    }

    document.body.appendChild(this.modalElement)
    console.log('📱 [CREATE MODAL] Élément modal ajouté au DOM')

    try {
      this.initVueWidget()
    } catch (error) {
      console.error('❌ [CREATE MODAL] Erreur init Vue:', error)
      throw error
    }
  }

  private cleanupModalElements() {
    // Supprimer tous les modals existants
    const existingModals = document.querySelectorAll('#chatseller-vue-modal, .cs-chat-modal-overlay, [data-chatseller="vue-modal"]')
    existingModals.forEach(modal => {
      try {
        if (modal.parentNode) {
          modal.parentNode.removeChild(modal)
        }
      } catch (error) {
        console.warn('⚠️ Erreur suppression modal:', error)
      }
    })
    console.log('🧹 [CLEANUP] Modals existants supprimés')
  }

  private initVueWidget(): void {
    try {
      console.log('🎨 [INIT VUE] Initialisation composant Vue avec configuration complète...')
      
      if (!this.modalElement) {
        throw new Error('Modal element non trouvé pour Vue')
      }
      
      // ✅ CORRECTION MAJEURE : Récupération produit avec type personnalisé
      const currentProduct = this.detectCurrentProduct()
      if (currentProduct) {
        const hasProductChanged = this.config.productName !== currentProduct.name ||
                                 this.config.productId !== currentProduct.id
        
        if (hasProductChanged) {
          console.log('🔄 [PRODUCT CHANGE] Produit changé détecté')
          this.handleProductChange(currentProduct)
        } else {
          this.config.productName = currentProduct.name
          this.config.productPrice = currentProduct.price
          this.config.productUrl = currentProduct.url || window.location.href
        }
      }
      
      // ✅ CORRECTION CRITIQUE : Configuration complète avec welcomeMessage
      const widgetConfig = {
        shopId: this.config.shopId,
        apiUrl: this.config.apiUrl,
        agentConfig: {
          id: this.config.agentConfig?.id || this.config.agentId,
          name: this.config.agentConfig?.name || 'Rose',
          title: this.config.agentConfig?.title || 'Vendeuse',
          avatar: this.config.agentConfig?.avatar, // ✅ AVATAR SYNC
          welcomeMessage: this.config.agentConfig?.welcomeMessage, // ✅ CORRECTION MAJEURE
          fallbackMessage: this.config.agentConfig?.fallbackMessage,
          personality: this.config.agentConfig?.personality || 'friendly',
          customProductType: this.config.agentConfig?.customProductType, // ✅ NOUVEAU CHAMP
          shopName: this.config.agentConfig?.shopName || 'notre boutique' // ✅ NOUVEAU CHAMP
        },
        primaryColor: this.config.primaryColor,
        buttonText: this.config.buttonText,
        borderRadius: this.config.borderRadius,
        language: this.config.language,
        productId: this.config.productId,
        productName: this.config.productName,
        productPrice: this.config.productPrice,
        productUrl: this.config.productUrl || window.location.href
      }

      console.log('⚙️ [INIT VUE] Configuration widget avec welcomeMessage:', {
        shopId: widgetConfig.shopId,
        agent: widgetConfig.agentConfig.name,
        title: widgetConfig.agentConfig.title,
        hasWelcomeMessage: !!widgetConfig.agentConfig.welcomeMessage,
        welcomePreview: widgetConfig.agentConfig.welcomeMessage?.substring(0, 50),
        hasAvatar: !!widgetConfig.agentConfig.avatar,
        customProductType: widgetConfig.agentConfig.customProductType,
        shopName: widgetConfig.agentConfig.shopName,
        product: widgetConfig.productName,
        hasPersistence: true
      })

      this.vueApp = createApp(ChatSellerWidget, {
        config: widgetConfig
      })

      // ✅ MÉTHODES GLOBALES ÉTENDUES
      if (typeof window !== 'undefined') {
        (window as any).ChatSeller = {
          ...((window as any).ChatSeller || {}),
          
          // Méthodes de base
          closeChat: () => this.closeChat(),
          
          // ✅ NOUVELLES MÉTHODES DE PERSISTANCE
          saveConversation: (messages: any[], conversationId: string) => {
            this.saveConversation(messages, conversationId)
          },
          
          loadConversation: () => {
            return this.loadConversation()
          },
          
          resetConversation: () => {
            this.resetConversation()
          },
          
          // ✅ GESTION CHANGEMENT PRODUIT
          updateProduct: (productInfo: any) => {
            this.handleProductChange(productInfo)
          },
          
          // ✅ NOUVEAU : Méthodes configuration agent
          getAgentConfig: () => {
            return this.config.agentConfig
          },
          
          updateAgentConfig: (newConfig: any) => {
            this.config.agentConfig = { ...this.config.agentConfig, ...newConfig }
            console.log('🔄 [CONFIG UPDATE] Configuration agent mise à jour:', this.config.agentConfig)
          },
          
          // Debug et status
          getConversationStatus: () => ({
            currentKey: this.currentConversationKey,
            hasHistory: this.conversationHistory.size > 0,
            currentProduct: {
              id: this.config.productId,
              name: this.config.productName,
              url: this.config.productUrl
            },
            agentConfig: this.config.agentConfig
          })
        }
      }

      this.vueApp.mount(this.modalElement)
      console.log('✅ [INIT VUE] Composant Vue monté avec welcomeMessage et configuration complète')

    } catch (error) {
      console.error('❌ [INIT VUE] Erreur initialisation Vue:', error)
      throw error
    }
  }

  // ✅ RESTAURÉ : NOUVELLE FONCTION : Détection produit améliorée
  private detectCurrentProduct(): any {
    try {
      console.log('🔍 [PRODUCT DETECT] Détection produit avec type personnalisé...')
      
      let detectedProduct: any = {
        id: this.config.productId,
        name: this.config.productName,
        price: this.config.productPrice,
        url: this.config.productUrl || window.location.href,
        customType: this.config.agentConfig?.customProductType // ✅ NOUVEAU
      }

      // ✅ DÉTECTION SHOPIFY AVANCÉE
      if ((window as any).ShopifyAnalytics?.meta?.product) {
        const shopifyProduct = (window as any).ShopifyAnalytics.meta.product
        detectedProduct = {
          id: shopifyProduct.id?.toString() || detectedProduct.id,
          name: shopifyProduct.title || detectedProduct.name,
          price: shopifyProduct.price ? shopifyProduct.price / 100 : detectedProduct.price,
          url: window.location.href,
          customType: this.config.agentConfig?.customProductType
        }
        console.log('✅ [PRODUCT DETECT] Shopify détecté:', detectedProduct.name)
        return detectedProduct
      }
      
      // ✅ DÉTECTION WOOCOMMERCE AMÉLIORÉE
      const wooProduct = document.querySelector('.woocommerce-product, .single-product')
      if (wooProduct) {
        const wooTitle = wooProduct.querySelector('.product_title, .entry-title, h1.product-title')
        if (wooTitle?.textContent?.trim()) {
          detectedProduct.name = wooTitle.textContent.trim()
          console.log('✅ [PRODUCT DETECT] WooCommerce détecté:', detectedProduct.name)
        }
        
        // ✅ DÉTECTION PRIX WOOCOMMERCE
        const wooPrice = wooProduct.querySelector('.price .woocommerce-Price-amount, .price ins .amount, .price .amount')
        if (wooPrice?.textContent) {
          const priceMatch = wooPrice.textContent.match(/[\d,]+(?:[.,]\d{2})?/)
          if (priceMatch) {
            detectedProduct.price = parseFloat(priceMatch[0].replace(',', '.'))
          }
        }
      }

      // ✅ DÉTECTION GÉNÉRIQUE ÉTENDUE
      if (!detectedProduct.name || detectedProduct.name === 'undefined') {
        const titleSelectors = [
          // Shopify
          '.product__title',
          '.product-form__title', 
          'h1.product-title',
          '.product-single__title',
          '.product-info__title',
          // WooCommerce
          '.product_title',
          '.entry-title',
          // Générique
          'h1[class*="product"]',
          '.product-title h1',
          '.product-detail-title',
          '[data-product-title]',
          '.item-title',
          '.product-name'
        ]
        
        for (const selector of titleSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            detectedProduct.name = element.textContent.trim()
            console.log(`✅ [PRODUCT DETECT] Générique détecté via ${selector}:`, detectedProduct.name)
            break
          }
        }
      }

      // ✅ DÉTECTION PRIX AMÉLIORÉE
      if (!detectedProduct.price) {
        const priceSelectors = [
          // Shopify
          '.price__current',
          '.product-form__price .price',
          '.money',
          '.price-current',
          '.product-single__price .money',
          '.product__price .money',
          // WooCommerce
          '.price .woocommerce-Price-amount',
          '.price ins .amount',
          // Générique
          '.product-price',
          '.price .money',
          '[data-product-price]',
          '.price-sale .money',
          '.current-price',
          '.sale-price'
        ]
        
        for (const selector of priceSelectors) {
          const element = document.querySelector(selector)
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim()
            const priceMatch = priceText.match(/[\d,]+(?:[.,]\d{2})?/)
            if (priceMatch) {
              detectedProduct.price = parseFloat(priceMatch[0].replace(',', '.'))
              console.log(`✅ [PRODUCT DETECT] Prix détecté:`, detectedProduct.price)
              break
            }
          }
        }
      }

      // ✅ NOUVEAU : Détection automatique du type si customType pas défini
      if (!detectedProduct.customType && detectedProduct.name) {
        detectedProduct.customType = this.getProductTypeFromName(detectedProduct.name)
      }

      console.log('🔍 [PRODUCT DETECT] Résultat final avec type personnalisé:', {
        name: detectedProduct.name,
        price: detectedProduct.price,
        customType: detectedProduct.customType,
        id: detectedProduct.id
      })
      
      return detectedProduct.name ? detectedProduct : null

    } catch (error) {
      console.warn('⚠️ [PRODUCT DETECT] Erreur détection produit:', error)
      return null
    }
  }

  // ✅ NOUVELLE HELPER : Détecter type de produit depuis le nom
  private getProductTypeFromName(productName: string): string {
    if (!productName) return 'produit'
    
    const name = productName.toLowerCase()
    
    // Détection intelligente du type
    if (name.includes('jeu') || name.includes('game') || name.includes('cartes') || name.includes('poker')) return 'jeu'
    if (name.includes('livre') || name.includes('book') || name.includes('roman') || name.includes('guide')) return 'livre'  
    if (name.includes('cours') || name.includes('formation') || name.includes('training') || name.includes('apprentissage')) return 'formation'
    if (name.includes('smartphone') || name.includes('téléphone') || name.includes('phone') || name.includes('mobile')) return 'smartphone'
    if (name.includes('ordinateur') || name.includes('laptop') || name.includes('computer') || name.includes('pc')) return 'ordinateur'
    if (name.includes('vêtement') || name.includes('tshirt') || name.includes('robe') || name.includes('pantalon')) return 'vêtement'
    if (name.includes('service') || name.includes('consultation') || name.includes('accompagnement')) return 'service'
    if (name.includes('bijou') || name.includes('collier') || name.includes('bracelet') || name.includes('bague')) return 'bijou'
    
    return 'produit'
  }

  private createFallbackModal() {
    const agentName = this.config.agentConfig?.name || 'Anna'
    const primaryColor = this.config.primaryColor || '#8B5CF6'

    console.log('🔧 [FALLBACK] Création modal de fallback...')

    this.modalElement = document.createElement('div')
    this.modalElement.className = 'cs-chat-modal-overlay'
    this.modalElement.setAttribute('data-chatseller', 'fallback-modal')
    
    this.modalElement.innerHTML = `
      <div style="
        width: 400px; height: 500px; background: white; border-radius: 16px;
        display: flex; flex-direction: column; padding: 20px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
      ">
        <h3 style="margin: 0 0 20px 0; color: ${primaryColor};">
          💬 ${agentName} - Vendeuse IA
        </h3>
        <p style="margin: 0 0 20px 0; color: #666;">
          Interface de chat en cours de chargement...
        </p>
        <div style="margin: 20px 0; display: flex; justify-content: center;">
          <div style="
            width: 40px; height: 40px; border: 4px solid #f3f4f6;
            border-top: 4px solid ${primaryColor}; border-radius: 50%;
            animation: cs-spin 1s linear infinite;
          "></div>
        </div>
        <button 
          id="close-fallback"
          style="
            background: ${primaryColor}; color: white; border: none; 
            padding: 12px 24px; border-radius: 8px; cursor: pointer;
            margin-top: auto; font-size: 14px; font-weight: 600;
          "
        >
          Fermer
        </button>
      </div>
    `

    document.body.appendChild(this.modalElement)

    const closeBtn = this.modalElement.querySelector('#close-fallback')
    closeBtn?.addEventListener('click', () => this.closeChat())

    console.log('✅ [FALLBACK] Modal de fallback créé')
  }

  private createFallbackWidget() {
    console.log('🔧 [FALLBACK WIDGET] Création widget de fallback')
    
    const container = document.createElement('div')
    container.className = 'cs-chatseller-widget'
    container.setAttribute('data-chatseller', 'fallback-widget')
    container.innerHTML = `
      <div style="
        background: #f3f4f6; padding: 12px; border-radius: 8px;
        text-align: center; font-size: 14px; color: #666;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border: 1px solid #e5e7eb;
      ">
        ⚠️ Widget ChatSeller en cours de chargement...
      </div>
    `
    
    const targetElement = document.querySelector('.product-form__buttons') ||
                         document.querySelector('.product-form') ||
                         document.querySelector('form[action*="/cart/add"]') ||
                         document.querySelector('.single_add_to_cart_button')
    
    if (targetElement) {
      targetElement.parentNode?.insertBefore(container, targetElement)
    } else {
      document.body.appendChild(container)
    }
    
    console.log('✅ [FALLBACK WIDGET] Widget de fallback créé')
  }

  // ✅ RESTAURÉ : CORRECTION MAJEURE : Méthode closeChat qui permet la réouverture
  closeChat() {
    console.log('❌ [CLOSE CHAT] Début fermeture chat...')
    
    this.isOpen = false
    
    // ✅ RESTAURÉ : SUPPRESSION MOBILE VIEWPORT CLASSES
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('cs-modal-open')
      document.body.classList.remove('cs-modal-open')
    }
    
    // ✅ RESTAURÉ : DÉMONTAGE PROPRE DE VUE SANS DESTRUCTION
    if (this.vueApp) {
      try {
        console.log('🎨 [CLOSE CHAT] Démontage application Vue...')
        this.vueApp.unmount()
        console.log('✅ [CLOSE CHAT] Vue app démontée')
      } catch (error) {
        console.warn('⚠️ [CLOSE CHAT] Erreur démontage Vue:', error)
      }
      this.vueApp = null
    }
    
    // ✅ RESTAURÉ : SUPPRESSION COMPLÈTE DU MODAL
    if (this.modalElement) {
      try {
        console.log('🗑️ [CLOSE CHAT] Suppression élément modal...')
        this.modalElement.remove()
        console.log('✅ [CLOSE CHAT] Modal supprimé')
      } catch (error) {
        console.warn('⚠️ [CLOSE CHAT] Erreur suppression modal:', error)
      }
      this.modalElement = null
    }
    
    // ✅ RESTAURÉ : NETTOYAGE SÉCURISÉ DES MODALS ORPHELINS
    this.cleanupModalElements()
    
    console.log('✅ [CLOSE CHAT] Chat fermé proprement - prêt pour réouverture')
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

  private hexToRgb(hex: string): string {
    try {
      const color = hex.replace('#', '')
      const r = parseInt(color.substr(0, 2), 16)
      const g = parseInt(color.substr(2, 2), 16)
      const b = parseInt(color.substr(4, 2), 16)
      return `${r}, ${g}, ${b}`
    } catch (error: unknown) {
      console.warn('⚠️ Erreur conversion hex vers rgb:', error)
      return '139, 92, 246' // Fallback violet
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

  // ✅ RESTAURÉ : API PUBLIQUE ÉTENDUE
  show() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'block'
      console.log('👁️ Widget rendu visible')
    }
  }

  hide() {
    if (this.widgetElement) {
      this.widgetElement.style.display = 'none'
      console.log('🙈 Widget masqué')
    }
  }

  destroy() {
    console.log('🗑️ [DESTROY] Destruction complète du widget...')
    
    this.closeChat()
    this.cleanupExistingWidgets()
    
    const styles = document.getElementById('chatseller-styles')
    if (styles) styles.remove()
    
    this.isInitialized = false
    this.cssInjected = false
    this.widgetElement = null
    this.conversationData = null
    
    console.log('✅ [DESTROY] Widget détruit complètement')
  }

  refresh() {
    console.log('🔄 [REFRESH] Actualisation du widget...')
    if (this.isInitialized) {
      this.cleanupExistingWidgets()
      this.createWidget()
      if (this.config.autoDetectProduct) {
        this.detectProductInfo()
      }
    }
  }

  updateConfig(newConfig: Partial<ChatSellerConfig>) {
    console.log('⚙️ [UPDATE CONFIG] Mise à jour configuration...')
    this.config = { ...this.config, ...newConfig }
    this.refresh()
  }

  // ✅ RESTAURÉ : STRUCTURE CONVERSATION
  private conversationHistory: Map<string, any> = new Map()
  private currentConversationKey: string | null = null

  // ✅ RESTAURÉ : GÉNÉRER CLÉ CONVERSATION INTELLIGENTE
  private generateConversationKey(): string {
    const shopId = this.config.shopId
    const productId = this.config.productId || 'general'
    const productName = this.config.productName || 'general'
    
    // Clé basée sur shopId + produit (ID ou nom normalisé)
    const normalizedProduct = productId !== 'general' 
      ? productId 
      : productName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)
    
    return `${shopId}-${normalizedProduct}`
  }

  // ✅ RESTAURÉ : GESTION LOCALSTORAGE ROBUSTE AVEC PERSISTANCE AMÉLIORÉE
  saveConversation(messages: any[], conversationId: string | null) {
    try {
      if (!this.currentConversationKey) {
        this.currentConversationKey = this.generateConversationKey()
      }

      const conversationData = {
        messages,
        conversationId,
        timestamp: new Date().toISOString(),
        shopId: this.config.shopId,
        productInfo: {
          id: this.config.productId,
          name: this.config.productName,
          price: this.config.productPrice,
          url: this.config.productUrl || window.location.href
        },
        userAgent: navigator.userAgent,
        lastActivity: Date.now()
      }
      
      // ✅ SAUVEGARDE LOCALE ET NAVIGATEUR
      this.conversationHistory.set(this.currentConversationKey, conversationData)
      
      // ✅ SAUVEGARDE LOCALSTORAGE AVEC NETTOYAGE AUTO
      try {
        const storageKey = `chatseller-conv-${this.currentConversationKey}`
        localStorage.setItem(storageKey, JSON.stringify(conversationData))
        
        // ✅ NETTOYAGE CONVERSATIONS ANCIENNES (>7 jours)
        this.cleanupOldConversations()
        
        console.log('💾 [PERSISTENCE] Conversation sauvegardée:', {
          key: this.currentConversationKey,
          messages: messages.length,
          product: conversationData.productInfo.name
        })
      } catch (storageError) {
        console.warn('⚠️ [PERSISTENCE] LocalStorage failed, using memory only:', storageError)
      }
      
    } catch (error) {
      console.warn('⚠️ [PERSISTENCE] Erreur sauvegarde conversation:', error)
    }
  }

  loadConversation(): any {
    try {
      const requestedKey = this.generateConversationKey()
      console.log('📂 [PERSISTENCE] Recherche conversation:', requestedKey)

      // ✅ PRIORITÉ 1 : Conversation en mémoire
      if (this.conversationHistory.has(requestedKey)) {
        const memoryConv = this.conversationHistory.get(requestedKey)
        if (this.isConversationValid(memoryConv)) {
          this.currentConversationKey = requestedKey
          console.log('📂 [PERSISTENCE] Conversation trouvée en mémoire')
          return memoryConv
        }
      }

      // ✅ PRIORITÉ 2 : LocalStorage
      try {
        const storageKey = `chatseller-conv-${requestedKey}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const data = JSON.parse(stored)
          if (this.isConversationValid(data)) {
            this.conversationHistory.set(requestedKey, data)
            this.currentConversationKey = requestedKey
            console.log('📂 [PERSISTENCE] Conversation restaurée depuis localStorage')
            return data
          }
        }
      } catch (storageError) {
        console.warn('⚠️ [PERSISTENCE] Erreur lecture localStorage:', storageError)
      }

      // ✅ PRIORITÉ 3 : Recherche conversation similaire (même shop, produit différent)
      const similarConv = this.findSimilarConversation()
      if (similarConv) {
        console.log('📂 [PERSISTENCE] Conversation similaire trouvée, création nouvelle session')
        // Ne pas restaurer mais notifier qu'il y a un historique
        return {
          isNewProductConversation: true,
          previousProduct: similarConv.productInfo?.name,
          suggestedMessage: `Je vois que nous avons déjà échangé au sujet de "${similarConv.productInfo?.name}". Aujourd'hui vous regardez "${this.config.productName}". Comment puis-je vous aider ?`
        }
      }

      console.log('📂 [PERSISTENCE] Aucune conversation trouvée, nouvelle session')
      return null

    } catch (error) {
      console.warn('⚠️ [PERSISTENCE] Erreur chargement conversation:', error)
      return null
    }
  }

  // ✅ RESTAURÉ : VALIDATION CONVERSATION
  private isConversationValid(conversation: any): boolean {
    if (!conversation || !conversation.messages || !Array.isArray(conversation.messages)) {
      return false
    }

    // ✅ Vérifier que la conversation n'est pas trop ancienne (7 jours)
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 jours
    const age = Date.now() - (conversation.lastActivity || 0)
    
    if (age > maxAge) {
      console.log('⏰ [PERSISTENCE] Conversation trop ancienne:', age / (24 * 60 * 60 * 1000), 'jours')
      return false
    }

    return true // Conversation valide
  }

  // ✅ RESTAURÉ : RECHERCHE CONVERSATION SIMILAIRE
  private findSimilarConversation(): any {
    try {
      const currentShop = this.config.shopId
      
      // Chercher dans localStorage toutes les conversations du même shop
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(`chatseller-conv-${currentShop}-`)) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const data = JSON.parse(stored)
              if (data.shopId === currentShop && data.messages && data.messages.length > 0) {
                return data
              }
            }
          } catch (e) {
            console.warn('⚠️ Erreur lecture conversation:', key, e)
          }
        }
      }
      
      return null
    } catch (error) {
      console.warn('⚠️ [PERSISTENCE] Erreur recherche similaire:', error)
      return null
    }
  }

  // ✅ RESTAURÉ : NETTOYAGE CONVERSATIONS ANCIENNES
  private cleanupOldConversations(): void {
    try {
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 jours
      const currentTime = Date.now()
      
      // Nettoyer localStorage
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('chatseller-conv-')) {
          try {
            const stored = localStorage.getItem(key)
            if (stored) {
              const data = JSON.parse(stored)
              const age = currentTime - (data.lastActivity || 0)
              if (age > maxAge) {
                keysToRemove.push(key)
              }
            }
          } catch (e) {
            keysToRemove.push(key) // Supprimer les conversations corrompues
          }
        }
      }
      
      // Supprimer les conversations anciennes
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key)
          console.log('🧹 [CLEANUP] Conversation ancienne supprimée:', key)
        } catch (e) {
          console.warn('⚠️ [CLEANUP] Erreur suppression:', key, e)
        }
      })
      
      // Nettoyer mémoire
      this.conversationHistory.forEach((value, key) => {
        const age = currentTime - (value.lastActivity || 0)
        if (age > maxAge) {
          this.conversationHistory.delete(key)
        }
      })
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 [CLEANUP] ${keysToRemove.length} conversations anciennes nettoyées`)
      }
      
    } catch (error) {
      console.warn('⚠️ [CLEANUP] Erreur nettoyage:', error)
    }
  }

  // ✅ RESET CONVERSATION (BOUTON RESET)
  resetConversation() {
    try {
      if (this.currentConversationKey) {
        // Supprimer de localStorage
        const storageKey = `chatseller-conv-${this.currentConversationKey}`
        localStorage.removeItem(storageKey)
        
        // Supprimer de mémoire
        this.conversationHistory.delete(this.currentConversationKey)
        
        console.log('🔄 [RESET] Conversation réinitialisée:', this.currentConversationKey)
      }
      
      // Réinitialiser état
      this.currentConversationKey = null
      
    } catch (error) {
      console.warn('⚠️ [RESET] Erreur reset conversation:', error)
    }
  }

  // ✅ CHANGER DE PRODUIT (LOGIQUE INTELLIGENTE)
  handleProductChange(newProductInfo: any) {
    console.log('🔄 [PRODUCT CHANGE] Changement de produit détecté:', {
      from: this.config.productName,
      to: newProductInfo.name,
      customType: newProductInfo.customType
    })
    
    // Sauvegarder conversation actuelle si elle existe
    if (this.currentConversationKey && this.conversationHistory.has(this.currentConversationKey)) {
      console.log('💾 [PRODUCT CHANGE] Sauvegarde de la conversation précédente')
    }
    
    // Mettre à jour config produit avec type personnalisé
    this.config.productId = newProductInfo.id
    this.config.productName = newProductInfo.name
    this.config.productPrice = newProductInfo.price
    this.config.productUrl = newProductInfo.url
    
    // ✅ NOUVEAU : Mise à jour customProductType dans agentConfig
    if (this.config.agentConfig && newProductInfo.customType) {
      this.config.agentConfig.customProductType = newProductInfo.customType
    }
    
    // Générer nouvelle clé de conversation
    this.currentConversationKey = null
    
    console.log('✅ [PRODUCT CHANGE] Nouveau contexte produit configuré avec type:', newProductInfo.customType)
  }

  // ✅ NOUVELLE MÉTHODE : Mise à jour configuration agent depuis Dashboard
  updateAgentConfiguration(newAgentConfig: any) {
    console.log('🔄 [AGENT CONFIG UPDATE] Mise à jour configuration agent depuis Dashboard:', newAgentConfig)
    
    if (!this.config.agentConfig) {
      this.config.agentConfig = {}
    }
    
    // Mise à jour complète avec nouveaux champs
    this.config.agentConfig = {
      ...this.config.agentConfig,
      name: newAgentConfig.name || this.config.agentConfig.name,
      title: newAgentConfig.title || this.config.agentConfig.title,
      avatar: newAgentConfig.avatar || this.config.agentConfig.avatar,
      welcomeMessage: newAgentConfig.welcomeMessage || this.config.agentConfig.welcomeMessage,
      fallbackMessage: newAgentConfig.fallbackMessage || this.config.agentConfig.fallbackMessage,
      personality: newAgentConfig.personality || this.config.agentConfig.personality,
      customProductType: newAgentConfig.customProductType || this.config.agentConfig.customProductType,
      shopName: newAgentConfig.shopName || this.config.agentConfig.shopName
    }
    
    console.log('✅ [AGENT CONFIG UPDATE] Configuration agent mise à jour:', {
      name: this.config.agentConfig.name,
      title: this.config.agentConfig.title,
      hasWelcomeMessage: !!this.config.agentConfig.welcomeMessage,
      hasAvatar: !!this.config.agentConfig.avatar,
      customProductType: this.config.agentConfig.customProductType,
      shopName: this.config.agentConfig.shopName
    })
    
    // Si le chat est ouvert, informer le composant Vue de la mise à jour
    if (this.isOpen && this.vueApp && typeof window !== 'undefined') {
      console.log('🔄 [LIVE UPDATE] Notification du composant Vue pour mise à jour en temps réel')
      // Le composant Vue écoutera les changements via les méthodes globales
    }
  }

  // ✅ NOUVELLE MÉTHODE : Forcer rechargement configuration depuis API
  async refreshConfigFromDashboard(agentId?: string): Promise<boolean> {
    try {
      console.log('🔄 [REFRESH CONFIG] Rechargement configuration depuis Dashboard...')
      
      if (!agentId && !this.config.agentId) {
        console.warn('⚠️ [REFRESH CONFIG] Aucun agentId disponible pour le rechargement')
        return false
      }
      
      const targetAgentId = agentId || this.config.agentId
      const apiUrl = this.config.apiUrl || 'https://chatseller-api-production.up.railway.app'
      
      // Appeler l'API publique pour récupérer la config
      const response = await fetch(`${apiUrl}/api/v1/public/shops/${this.config.shopId}/config`)
      
      if (!response.ok) {
        console.error('❌ [REFRESH CONFIG] Erreur API:', response.status)
        return false
      }
      
      const configData = await response.json()
      
      if (configData.success && configData.data.agent) {
        console.log('✅ [REFRESH CONFIG] Nouvelle configuration reçue:', configData.data.agent.name)
        
        // Mettre à jour la configuration agent
        this.updateAgentConfiguration({
          id: configData.data.agent.id,
          name: configData.data.agent.name,
          title: configData.data.agent.title,
          avatar: configData.data.agent.avatar,
          welcomeMessage: configData.data.agent.welcomeMessage,
          fallbackMessage: configData.data.agent.fallbackMessage,
          personality: configData.data.agent.personality,
          customProductType: configData.data.agent.customProductType,
          shopName: configData.data.shop.name
        })
        
        console.log('✅ [REFRESH CONFIG] Configuration mise à jour avec succès')
        return true
      }
      
      return false
      
    } catch (error) {
      console.error('❌ [REFRESH CONFIG] Erreur:', error)
      return false
    }
  }

  // API publique étendue avec nouvelles fonctionnalités
  getPublicAPI() {
    return {
      // Méthodes de base existantes
      show: () => this.show(),
      hide: () => this.hide(),
      destroy: () => this.destroy(),
      refresh: () => this.refresh(),
      updateConfig: (newConfig: Partial<ChatSellerConfig>) => this.updateConfig(newConfig),
      
      // ✅ NOUVELLES MÉTHODES PUBLIQUES
      updateAgentConfig: (newAgentConfig: any) => this.updateAgentConfiguration(newAgentConfig),
      refreshFromDashboard: (agentId?: string) => this.refreshConfigFromDashboard(agentId),
      getCurrentConfig: () => this.currentConfig,
      getCurrentProduct: () => ({
        id: this.config.productId,
        name: this.config.productName,
        price: this.config.productPrice,
        customType: this.config.agentConfig?.customProductType
      }),
      
      // Getters améliorés
      get isReady(): boolean { return this.isReady },
      get version(): string { return this.version },
      get isModalOpen(): boolean { return this.isModalOpen },
      get hasDetectedProduct(): boolean { return this.hasDetectedProduct },
      
      // Debug amélioré
      debug: () => ({
        ...this.debug(),
        agentConfig: this.config.agentConfig,
        productCustomType: this.config.agentConfig?.customProductType
      })
    }
  }

  // ✅ GETTERS PUBLICS
  get isReady(): boolean {
    return this.isInitialized
  }

  get version(): string {
    return '1.5.3' // ✅ Version mise à jour
  }

  get currentConfig(): ChatSellerConfig {
    return { ...this.config }
  }

  get isModalOpen(): boolean {
    return this.isOpen && !!this.modalElement
  }

  get hasDetectedProduct(): boolean {
    return !!(this.config.productName || this.config.productPrice)
  }

  // ✅ DEBUG HELPERS
  debug() {
    return {
      isInitialized: this.isInitialized,
      isOpen: this.isOpen,
      hasModal: !!this.modalElement,
      hasVueApp: !!this.vueApp,
      hasWidget: !!this.widgetElement,
      hasConversation: !!this.conversationData,
      config: this.config,
      version: this.version
    }
  }
}

// ✅ INITIALISATION AUTOMATIQUE AVANCÉE
(() => {
  const chatSeller = new ChatSeller()
  
  if (typeof window !== 'undefined') {
    // ✅ EXPOSITION API PUBLIQUE COMPLÈTE
    (window as any).ChatSeller = {
      // API de base
      ...chatSeller.getPublicAPI(),
      
      // ✅ NOUVELLES MÉTHODES GLOBALES POUR SYNCHRONISATION DASHBOARD
      syncFromDashboard: async (agentId?: string) => {
        console.log('🔄 [SYNC DASHBOARD] Synchronisation depuis Dashboard...')
        const success = await chatSeller.refreshConfigFromDashboard(agentId)
        if (success) {
          console.log('✅ [SYNC DASHBOARD] Configuration synchronisée avec succès')
          // Rafraîchir le widget pour appliquer les changements
          chatSeller.refresh()
        }
        return success
      },
      
      // ✅ MÉTHODE POUR MISE À JOUR EN TEMPS RÉEL DEPUIS DASHBOARD
      updateFromDashboard: (updates: any) => {
        console.log('🔄 [LIVE UPDATE] Mise à jour en temps réel depuis Dashboard:', updates)
        
        if (updates.agent) {
          chatSeller.updateAgentConfiguration(updates.agent)
        }
        
        if (updates.widget) {
          const newConfig = { ...chatSeller.currentConfig }
          Object.assign(newConfig, updates.widget)
          chatSeller.updateConfig(newConfig)
        }
        
        // Actualiser le widget pour refléter les changements
        if (chatSeller.isReady) {
          chatSeller.refresh()
        }
      },
      
      // ✅ MÉTHODE POUR DÉCLENCHER MESSAGE D'ACCUEIL MANUELLEMENT
      triggerWelcomeMessage: () => {
        console.log('👋 [MANUAL WELCOME] Déclenchement manuel message d\'accueil')
        if (chatSeller.isModalOpen && typeof window !== 'undefined') {
          // Informer le composant Vue de déclencher le message d'accueil
          const event = new CustomEvent('chatseller-trigger-welcome', {
            detail: { 
              agentConfig: chatSeller.currentConfig.agentConfig,
              forceWelcome: true
            }
          })
          window.dispatchEvent(event)
        }
      }
    }
    
    // ✅ AUTO-INIT INTELLIGENT AMÉLIORÉ
    const autoInit = () => {
      if ((window as any).ChatSellerConfig && !chatSeller.isReady) {
        console.log('🚀 [AUTO-INIT] Initialisation automatique avec configuration enrichie...')
        
        // ✅ ENRICHIR CONFIG AVEC DONNÉES MANQUANTES
        const enrichedConfig = {
          ...(window as any).ChatSellerConfig,
          agentConfig: {
            ...((window as any).ChatSellerConfig.agentConfig || {}),
            // S'assurer que les champs critiques sont présents
            welcomeMessage: (window as any).ChatSellerConfig.agentConfig?.welcomeMessage || null,
            customProductType: (window as any).ChatSellerConfig.agentConfig?.customProductType || null,
            shopName: (window as any).ChatSellerConfig.agentConfig?.shopName || 'notre boutique'
          }
        }
        
        console.log('🔧 [AUTO-INIT] Configuration enrichie:', {
          shopId: enrichedConfig.shopId,
          agentName: enrichedConfig.agentConfig?.name,
          hasWelcomeMessage: !!enrichedConfig.agentConfig?.welcomeMessage,
          hasCustomProductType: !!enrichedConfig.agentConfig?.customProductType,
          shopName: enrichedConfig.agentConfig?.shopName
        })
        
        chatSeller.init(enrichedConfig)
      }
    }
    
    // ✅ GESTION MULTI-ÉTAT DU DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit)
    } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
      setTimeout(autoInit, 200)
    }
    
    // ✅ SUPPORT SHOPIFY SECTIONS DYNAMIQUES AVANCÉ
    if (typeof window !== 'undefined') {
      const isShopify = (window as any).Shopify || 
                       document.querySelector('[data-shopify]') || 
                       window.location.hostname.includes('myshopify.com') ||
                       document.querySelector('script[src*="shopify"]')
                       
      if (isShopify) {
        console.log('🛍️ [SHOPIFY] Mode Shopify activé avec synchronisation avancée')
        
        // Écouter les changements de section Shopify
        document.addEventListener('shopify:section:load', function(event) {
          console.log('🔄 [SHOPIFY] Section rechargée:', event)
          setTimeout(() => {
            if (!chatSeller.isReady) {
              autoInit()
            } else {
              // Détecter nouveau produit et mettre à jour
              const newProduct = chatSeller['detectCurrentProduct']?.()
              if (newProduct) {
                chatSeller.handleProductChange(newProduct)
                chatSeller.refresh()
              }
            }
          }, 1000)
        })
        
        document.addEventListener('shopify:section:unload', function(event) {
          console.log('🗑️ [SHOPIFY] Section déchargée:', event)
          chatSeller.cleanupExistingWidgets()
        })
        
        // ✅ GESTION SPA SHOPIFY AMÉLIORÉE
        let currentUrl = window.location.href
        const checkUrlChange = () => {
          if (window.location.href !== currentUrl) {
            currentUrl = window.location.href
            console.log('🔄 [SPA] URL changée, rechargement widget:', currentUrl)
            
            // Détecter nouveau produit
            setTimeout(() => {
              const newProduct = chatSeller['detectCurrentProduct']?.()
              if (newProduct) {
                chatSeller.handleProductChange(newProduct)
              }
              
              if (!chatSeller.isReady) {
                autoInit()
              } else {
                chatSeller.refresh()
              }
            }, 700)
          }
        }
        
        setInterval(checkUrlChange, 2000)
        window.addEventListener('popstate', checkUrlChange)
      }
      
      // ✅ SUPPORT WOOCOMMERCE AMÉLIORÉ
      const isWooCommerce = document.querySelector('.woocommerce') || 
                           document.querySelector('[class*="woo"]') ||
                           (window as any).wc_add_to_cart_params
                           
      if (isWooCommerce) {
        console.log('🛒 [WOOCOMMERCE] Mode WooCommerce activé avec détection produit')
        
        document.addEventListener('updated_cart_totals', () => {
          console.log('🔄 [WOOCOMMERCE] Panier mis à jour')
          if (chatSeller.currentConfig?.autoDetectProduct) {
            const newProduct = chatSeller['detectCurrentProduct']?.()
            if (newProduct) {
              chatSeller.handleProductChange(newProduct)
            }
          }
        })
      }
    }
    
    // ✅ ÉCOUTER ÉVÉNEMENTS DASHBOARD POUR SYNCHRONISATION TEMPS RÉEL
    if (typeof window !== 'undefined') {
      window.addEventListener('chatseller-config-updated', (event: any) => {
        console.log('📡 [DASHBOARD SYNC] Configuration mise à jour depuis Dashboard:', event.detail)
        
        if (event.detail) {
          (window as any).ChatSeller.updateFromDashboard(event.detail)
        }
      })
      
      // ✅ ÉCOUTER DÉCLENCHEMENT MANUEL MESSAGE D'ACCUEIL
      window.addEventListener('chatseller-trigger-welcome', (event: any) => {
        console.log('👋 [WELCOME EVENT] Déclenchement message d\'accueil:', event.detail)
        // L'événement sera géré par le composant Vue
      })
    }
    
    console.log('✅ [CHATSELLER] Widget chargé avec nouvelles fonctionnalités - version 1.5.4')
    
    // ✅ EXPOSER FONCTIONS DE DEBUG ÉTENDUES
    if (process.env.NODE_ENV === 'development' || (window as any).ChatSellerConfig?.debug) {
      (window as any).ChatSellerDebug = {
        instance: chatSeller,
        version: '1.5.4',
        debug: () => chatSeller.debug(),
        cleanup: () => chatSeller.cleanupExistingWidgets(),
        refresh: () => chatSeller.refresh(),
        destroy: () => chatSeller.destroy(),
        // ✅ NOUVEAUX OUTILS DEBUG
        testWelcomeMessage: () => (window as any).ChatSeller.triggerWelcomeMessage(),
        getCurrentConfig: () => chatSeller.currentConfig,
        syncFromDashboard: () => (window as any).ChatSeller.syncFromDashboard(),
        detectProduct: () => chatSeller['detectCurrentProduct']?.()
      }
    }
  }
})()

// ✅ VERSION MISE À JOUR
const CHATSELLER_VERSION = '1.5.4'

// ✅ DÉCLARATIONS TYPESCRIPT COMPLÈTES
declare global {
  interface Window {
    ChatSeller: ChatSeller
    ChatSellerConfig?: ChatSellerConfig
    ChatSellerDebug?: {
      instance: ChatSeller
      version: string
      debug: () => any
      cleanup: () => void
      refresh: () => void
      destroy: () => void
    }
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
    wc_add_to_cart_params?: {
      [key: string]: any
    }
  }
}