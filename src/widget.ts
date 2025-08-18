// src/widget.ts - ENTRY POINT POUR LE COMPOSANT VUE
import { createApp } from 'vue'
import ChatSellerWidget from './ChatSellerWidget.vue'

// ✅ INTERFACE POUR LA CONFIG
export interface WidgetConfig {
  config: {
    shopId: string
    agentConfig?: {
      id: string
      name: string
      title: string
      avatar?: string
      welcomeMessage?: string
      fallbackMessage?: string
      personality?: string
    }
    widget?: {
      primaryColor?: string
      buttonText?: string
      language?: string
    }
    productInfo?: {
      id?: string
      name?: string
      price?: number
      url?: string
    }
    apiUrl?: string
  }
  onClose?: () => void
}

// ✅ FONCTION D'INITIALISATION DU WIDGET VUE
export function initChatWidget(container: HTMLElement, config: WidgetConfig) {
  console.log('🎨 Initialisation du widget Vue avec config:', config)

  // ✅ Créer l'application Vue
  const app = createApp(ChatSellerWidget, {
    config: config.config,
    onChatClose: config.onClose || (() => {})
  })

  // ✅ Monter l'application
  const instance = app.mount(container)
  
  return {
    app,
    instance,
    unmount: () => {
      app.unmount()
    }
  }
}

// ✅ EXPORT PAR DÉFAUT
export { ChatSellerWidget }
export default {
  initChatWidget,
  ChatSellerWidget
}