<!-- src/ChatSellerWidget.vue -->
<template>
  <div class="cs-chatseller-widget-vue">
    <!-- ✅ INTERFACE DESKTOP -->
    <div 
      v-if="!isMobile"
      class="cs-chat-container-desktop"
      :style="desktopContainerStyle"
    >
      
      <!-- ✅ HEADER CORRIGÉ - COULEUR DYNAMIQUE -->
      <div class="cs-desktop-header" :style="headerStyle">
        <div class="cs-agent-info" :style="agentInfoStyle">
          <div class="cs-agent-avatar" :style="avatarStyle">
            <img
              :src="agentAvatar"
              :alt="agentName"
              :style="avatarImageStyle"
              @error="handleAvatarError"
            >
          </div>
          <div class="cs-agent-details">
            <h3 class="cs-agent-name" :style="agentNameStyle">{{ agentName }} - {{ agentTitle }}</h3>
            <!-- ✅ STATUS AVEC PRODUIT SUR UNE SEULE LIGNE CORRIGÉE -->
            <p class="cs-agent-status" :style="agentStatusStyle">
              <span class="cs-online-section" :style="onlineSectionStyle">
                <span class="cs-status-dot" :style="statusDotStyle"></span>
                En ligne
              </span>
              <span v-if="productInfo" class="cs-product-separator" :style="productSeparatorStyle">|</span>
              <span v-if="productInfo" class="cs-product-name" :style="productNameStyle">
                {{ productInfo.name }}{{ productInfo.price ? ` • ${formatPrice(productInfo.price)}` : '' }}
              </span>
            </p>
          </div>
        </div>
        
        <div class="cs-header-actions" :style="headerActionsStyle">
          <button @click="resetChat" class="cs-action-button" :style="actionButtonStyle" title="Recommencer la conversation">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
          <button @click="closeChat" class="cs-close-button" :style="closeButtonStyle">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- ✅ ZONE DE CHAT STYLE WHATSAPP -->
      <div ref="messagesContainer" class="cs-messages-area-desktop" :style="messagesAreaStyle">
        <div class="cs-messages-list" :style="messagesListStyle">
          
          <!-- ✅ MESSAGES ALIGNÉS WHATSAPP STYLE -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="cs-message-item"
            :class="message.role === 'assistant' ? 'cs-assistant-message' : 'cs-user-message'"
            :style="messageItemStyle(message.role)"
          >
            
            <!-- ✅ MESSAGE ASSISTANT - ALIGNÉ À GAUCHE AVEC NOM DANS BULLE -->
            <div v-if="message.role === 'assistant'" class="cs-assistant-bubble" :style="assistantBubbleStyle">
              <div class="cs-message-text cs-assistant-text" :style="assistantTextStyle">
                <div class="cs-agent-name-in-bubble" :style="agentNameInBubbleStyle">{{ agentName }}</div>
                <div class="cs-agent-title-in-bubble" :style="agentTitleInBubbleStyle">{{ agentTitle }}</div>
                <div v-html="formatMessage(message.content)"></div>
                <div class="cs-message-time" :style="messageTimeStyle">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- ✅ MESSAGE UTILISATEUR - COULEUR DYNAMIQUE -->
            <div v-else class="cs-user-bubble" :style="userBubbleStyle">
              <div class="cs-message-text cs-user-text" :style="userTextStyle">
                <div class="cs-you-label-in-bubble" :style="youLabelInBubbleStyle">Vous</div>
                <div>{{ message.content }}</div>
                <div class="cs-message-time" :style="messageTimeUserStyle">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- ✅ INDICATEUR DE FRAPPE  -->
          <div v-if="isTyping" class="cs-message-item cs-assistant-message" :style="messageItemStyle('assistant')">
            <div class="cs-typing-simple" :style="typingSimpleStyle">
              <span class="cs-typing-text" :style="typingTextStyle">{{ agentName }} est en train d'écrire...</span>
            </div>
          </div>

          <div ref="messagesEndRef" />
        </div>
      </div>

      <!-- ✅ INPUT SECTION -->
      <div class="cs-input-section-desktop" :style="inputSectionStyle">
        <div class="cs-input-container" :style="inputContainerStyle">
          <input
            v-model="currentMessage"
            @keypress.enter="sendMessage"
            :placeholder="inputPlaceholder"
            class="cs-message-input"
            :style="messageInputStyle"
            :disabled="isTyping || isLoading"
          />
          
          <!-- ✅ BOUTON MICRO EN GRIS -->
          <button
            @click="handleVoiceMessage"
            class="cs-voice-button"
            :style="voiceButtonStyle"
            title="Message vocal"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </button>
          
          <!-- ✅ BOUTON SEND COULEUR DYNAMIQUE -->
          <button
            @click="sendMessage"
            :disabled="!currentMessage.trim() || isTyping || isLoading"
            class="cs-send-button"
            :style="sendButtonStyle"
          >
            <svg v-if="!isTyping" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <div v-else class="cs-loading-spinner" :style="loadingSpinnerStyle"></div>
          </button>
        </div>
        
        <!-- ✅ FOOTER CORRIGÉ - DEUX COLONNES -->
        <div class="cs-footer-info" :style="footerInfoStyle">
          <span class="cs-powered-by" :style="poweredByStyle">
            Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong>
          </span>
          <span class="cs-security" :style="securityStyle">🔒 Conversations sécurisées</span>
        </div>
      </div>
    </div>

    <!-- ✅ INTERFACE MOBILE PLEIN ÉCRAN CORRIGÉE -->
    <div 
      v-else
      class="cs-chat-container-mobile"
      :style="mobileContainerStyle"
    >
      
      <!-- ✅ Header Mobile avec Safe Area -->
      <div class="cs-mobile-header" :style="mobileHeaderStyle">
        <div class="cs-mobile-agent-info" :style="agentInfoStyle">
          <div class="cs-mobile-avatar" :style="mobileAvatarStyle">
            <img :src="agentAvatar" :alt="agentName" :style="avatarImageStyle" @error="handleAvatarError">
          </div>
          <div class="cs-mobile-details">
            <h3 class="cs-mobile-name" :style="mobileNameStyle">{{ agentName }} - {{ agentTitle }}</h3>
            <p class="cs-mobile-status-text" :style="mobileStatusStyle">
              <span class="cs-online-section" :style="onlineSectionStyle">
                <span class="cs-status-dot" :style="statusDotStyle"></span>
                En ligne
              </span>
              <span v-if="productInfo" class="cs-product-separator" :style="productSeparatorStyle"> | </span>
              <span v-if="productInfo" class="cs-product-name" :style="productNameStyle">
                {{ productInfo.name }}
              </span>
            </p>
          </div>
        </div>
        
        <div class="cs-mobile-actions" :style="headerActionsStyle">
          <button @click="resetChat" class="cs-mobile-reset" :style="mobileActionButtonStyle" title="Recommencer">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </button>
          <button @click="closeChat" class="cs-mobile-close" :style="closeButtonStyle">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- ✅ Messages mobile CORRIGÉS -->
      <div ref="mobileMessagesContainer" class="cs-messages-area-mobile" :style="mobileMessagesAreaStyle">
        <div class="cs-mobile-messages-list" :style="messagesListStyle">
          <div
            v-for="message in messages"
            :key="message.id"
            class="cs-mobile-message"
            :class="message.role === 'assistant' ? 'cs-mobile-assistant' : 'cs-mobile-user'"
            :style="messageItemStyle(message.role)"
          >
            
            <div v-if="message.role === 'assistant'" class="cs-mobile-assistant-bubble" :style="assistantBubbleStyle">
              <div class="cs-mobile-message-text cs-mobile-assistant-text" :style="assistantTextStyle">
                <div class="cs-agent-name-in-bubble" :style="agentNameInBubbleStyle">{{ agentName }}</div>
                <div class="cs-agent-title-in-bubble" :style="agentTitleInBubbleStyle">{{ agentTitle }}</div>
                <div v-html="formatMessage(message.content)"></div>
                <div class="cs-mobile-message-time" :style="messageTimeStyle">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>

            <!-- ✅ Message utilisateur couleur dynamique -->
            <div v-else class="cs-mobile-user-bubble" :style="userBubbleStyle">
              <div class="cs-mobile-message-text cs-mobile-user-text" :style="userTextStyle">
                <div class="cs-you-label-in-bubble" :style="youLabelInBubbleStyle">Vous</div>
                <div>{{ message.content }}</div>
                <div class="cs-mobile-message-time" :style="messageTimeUserStyle">{{ formatTime(message.timestamp) }}</div>
              </div>
            </div>
          </div>

          <!-- ✅ Typing mobile CORRIGÉ UNE LIGNE HORIZONTALE -->
          <div v-if="isTyping" class="cs-mobile-message cs-mobile-assistant" :style="messageItemStyle('assistant')">
            <div class="cs-mobile-typing-simple" :style="typingSimpleStyle">
              <span class="cs-mobile-typing-text" :style="typingTextStyle">{{ agentName }} est en train d'écrire...</span>
            </div>
          </div>

          <div ref="mobileMessagesEndRef" />
        </div>
      </div>

      <!-- ✅ Input Mobile avec gestion clavier CORRIGÉE -->
      <div class="cs-mobile-input-section" :style="mobileInputSectionStyle">
        <div class="cs-mobile-input-container" :style="mobileInputContainerStyle">
          <input
            ref="mobileInput"
            v-model="currentMessage"
            @keypress.enter="sendMessage"
            @focus="handleMobileInputFocus"
            @blur="handleMobileInputBlur"
            :placeholder="inputPlaceholder"
            class="cs-mobile-message-input"
            :style="messageInputStyle"
            :disabled="isTyping || isLoading"
          />
          
          <!-- ✅ Bouton micro gris -->
          <button
            @click="handleVoiceMessage"
            class="cs-mobile-voice"
            :style="voiceButtonStyle"
            title="Message vocal"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
            </svg>
          </button>
          
          <!-- ✅ Bouton send couleur dynamique -->
          <button
            @click="sendMessage"
            :disabled="!currentMessage.trim() || isTyping"
            class="cs-mobile-send"
            :style="sendButtonStyle"
          >
            <svg v-if="!isTyping" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
            <div v-else class="cs-mobile-loading-spinner" :style="loadingSpinnerStyle"></div>
          </button>
        </div>
        
        <!-- ✅ FOOTER MOBILE CORRIGÉ -->
        <div class="cs-mobile-footer" :style="mobileFooterStyle">
          <span class="cs-mobile-powered" :style="poweredByStyle">
            Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong>
          </span>
          <span class="cs-mobile-security" :style="securityStyle">🔒 Sécurisé</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { CSSProperties } from 'vue'

interface Props {
  config?: {
    shopId?: string
    shopName?: string
    apiUrl?: string
    agentConfig?: {
      id?: string
      name?: string
      title?: string
      avatar?: string
      welcomeMessage?: string
      fallbackMessage?: string
      personality?: string
    }
    primaryColor?: string
    buttonText?: string
    language?: string
    productId?: string
    productName?: string
    productPrice?: number
    productUrl?: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    shopId: 'demo',
    apiUrl: 'https://chatseller-api-production.up.railway.app',
    agentConfig: {
      name: 'Rose',
      title: 'Vendeuse'
    },
    primaryColor: '#8B5CF6',
    buttonText: 'Parler à la vendeuse',
    language: 'fr'
  })
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ✅ STATE COMPLET RESTAURÉ
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const isLoading = ref(false)
const conversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement>()
const mobileMessagesContainer = ref<HTMLElement>()
const messagesEndRef = ref<HTMLElement>()
const mobileMessagesEndRef = ref<HTMLElement>()
const mobileInput = ref<HTMLInputElement>()
const keyboardVisible = ref(false)

// ✅ RESTAURÉ : SYSTÈME DE PERSISTANCE CONVERSATION
const conversationHistory: Map<string, any> = new Map()
let currentConversationKey: string | null = null
let conversationData: any = null

// ✅ COMPUTED AVEC COULEUR DYNAMIQUE
const configData = computed(() => props.config || {})

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const agentName = computed(() => {
  return configData.value.agentConfig?.name || 'Rose'
})

const agentTitle = computed(() => {
  return configData.value.agentConfig?.title || 'Vendeuse'
})

const agentAvatar = computed(() => {
  if (configData.value.agentConfig?.avatar) {
    return configData.value.agentConfig.avatar
  }
  const color = (configData.value.primaryColor || '#8B5CF6').replace('#', '')
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${color}&color=fff&size=128`
})

const productInfo = computed(() => {
  if (configData.value.productName || configData.value.productPrice) {
    return {
      name: configData.value.productName,
      price: configData.value.productPrice,
      url: configData.value.productUrl,
      id: configData.value.productId
    }
  }
  return null
})

// ✅ COULEUR PRIMAIRE DYNAMIQUE
const primaryColor = computed(() => configData.value.primaryColor || '#8B5CF6')

const inputPlaceholder = computed(() => {
  return `Tapez votre message...`
})

// ✅ STYLES COMPUTED CORRIGÉS AVEC COULEUR DYNAMIQUE

const headerStyle = computed((): CSSProperties => ({
  padding: '20px',
  color: '#ffffff',
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${adjustColor(primaryColor.value, -15)} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: '0',
  minHeight: isMobile.value ? '75px' : '85px',
  margin: '0',
  border: 'none',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}))

// ✅ HEADER MOBILE AVEC SAFE AREA
const mobileHeaderStyle = computed((): CSSProperties => ({
  padding: 'calc(env(safe-area-inset-top) + 16px) 20px 16px 20px',
  color: '#ffffff',
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${adjustColor(primaryColor.value, -15)} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexShrink: '0',
  minHeight: 'calc(75px + env(safe-area-inset-top))',
  margin: '0',
  border: 'none',
  zIndex: '10',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textAlign: 'left',
  position: 'relative',
  overflow: 'hidden',
  width: '100vw'
}))

const desktopContainerStyle = computed((): CSSProperties => ({
  width: '650px',
  height: '700px',
  maxHeight: '90vh',
  maxWidth: '95vw',
  background: '#ffffff',
  borderRadius: '24px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}))

// ✅ MOBILE PLEIN ÉCRAN CORRIGÉ AVEC GESTION CLAVIER
const mobileContainerStyle = computed((): CSSProperties => ({
  width: '100vw',
  height: keyboardVisible.value ? '100vh' : '100dvh', // ✅ Gestion clavier
  maxWidth: '100vw',
  maxHeight: keyboardVisible.value ? '100vh' : '100dvh',
  background: '#ffffff',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  margin: '0',
  padding: '0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  position: 'fixed',
  top: '0',
  left: '0',
  right: '0',
  bottom: '0',
  zIndex: '2147483647',
  borderRadius: '0',
  border: 'none'
}))

const agentInfoStyle = computed((): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  flex: '1',
  color: '#ffffff',
  minWidth: '0'
}))

const avatarStyle = computed((): CSSProperties => ({
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  position: 'relative',
  overflow: 'hidden',
  border: '3px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(255, 255, 255, 0.1)',
  display: 'block',
  flexShrink: '0'
}))

const mobileAvatarStyle = computed((): CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '50%',
  position: 'relative',
  overflow: 'hidden',
  border: '2px solid rgba(255, 255, 255, 0.3)',
  background: 'rgba(255, 255, 255, 0.1)',
  display: 'block',
  flexShrink: '0'
}))

const avatarImageStyle = computed((): CSSProperties => ({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block'
}))

const agentNameStyle = computed((): CSSProperties => ({
  fontSize: '18px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 4px 0',
  lineHeight: '1.2',
  fontFamily: 'inherit'
}))

const mobileNameStyle = computed((): CSSProperties => ({
  fontSize: '16px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 4px 0',
  lineHeight: '1.2',
  fontFamily: 'inherit'
}))

// ✅ STATUS AVEC PRODUIT SUR UNE SEULE LIGNE CORRIGÉE
const agentStatusStyle = computed((): CSSProperties => ({
  fontSize: '14px',
  color: 'rgba(255, 255, 255, 0.95)',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  lineHeight: '1.3',
  fontWeight: '500',
  fontFamily: 'inherit',
  minWidth: '0',
  whiteSpace: 'nowrap', // ✅ CORRECTION : Empêche le retour à la ligne
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}))

const mobileStatusStyle = computed((): CSSProperties => ({
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.95)',
  margin: '0',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  lineHeight: '1.3',
  fontWeight: '500',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
}))

const onlineSectionStyle = computed((): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
  flexShrink: '0'
}))

const statusDotStyle = computed((): CSSProperties => ({
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#00D26A',
  display: 'block',
  flexShrink: '0',
  animation: 'cs-pulse-status 2s infinite'
}))

const productSeparatorStyle = computed((): CSSProperties => ({
  color: 'rgba(255, 255, 255, 0.7)',
  margin: '0 4px',
  flexShrink: '0'
}))

const productNameStyle = computed((): CSSProperties => ({
  fontSize: '13px',
  opacity: '0.9',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: isMobile.value ? '120px' : '150px',
  flexShrink: '1',
  minWidth: '0'
}))

const headerActionsStyle = computed((): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: '0'
}))

const actionButtonStyle = computed((): CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.15)',
  border: 'none',
  color: '#ffffff',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: '0'
}))

const mobileActionButtonStyle = computed((): CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.15)',
  border: 'none',
  color: '#ffffff',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: '0'
}))

const closeButtonStyle = computed((): CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.15)',
  border: 'none',
  color: '#ffffff',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: '0'
}))

// ✅ BACKGROUND WHATSAPP STYLE
const messagesAreaStyle = computed((): CSSProperties => ({
  flex: '1',
  background: '#f0f2f5',
  overflowY: 'auto',
  padding: '20px',
  display: 'flex',
  flexDirection: 'column',
  color: '#374151',
  fontFamily: 'inherit',
  minHeight: '0'
}))

// ✅ MOBILE MESSAGES AREA AVEC GESTION CLAVIER
const mobileMessagesAreaStyle = computed((): CSSProperties => ({
  flex: '1',
  background: '#f0f2f5',
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  color: '#374151',
  fontFamily: 'inherit',
  minHeight: '0',
  width: '100vw',
  maxWidth: '100vw',
  paddingBottom: keyboardVisible.value ? '16px' : 'calc(16px + env(safe-area-inset-bottom))' // ✅ Gestion clavier
}))

const messagesListStyle = computed((): CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  flex: '1',
  margin: '0',
  padding: '0'
}))

// ✅ ALIGNMENT MESSAGES WHATSAPP STYLE
const messageItemStyle = (role: string): CSSProperties => ({
  display: 'flex',
  width: '100%',
  justifyContent: role === 'assistant' ? 'flex-start' : 'flex-end',
  margin: '0',
  padding: '0'
})

const assistantBubbleStyle = computed((): CSSProperties => ({
  maxWidth: '75%',
  margin: '0',
  padding: '0'
}))

const userBubbleStyle = computed((): CSSProperties => ({
  maxWidth: '75%',
  margin: '0',
  padding: '0'
}))

// ✅ BULLES STYLE WHATSAPP SANS OMBRES
const assistantTextStyle = computed((): CSSProperties => ({
  borderRadius: '18px',
  padding: '10px 14px',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0',
  background: '#ffffff',
  color: '#1f2937',
  border: 'none',
  boxShadow: 'none',
  fontFamily: 'inherit',
  wordWrap: 'break-word',
  position: 'relative'
}))

// ✅ BULLE UTILISATEUR AVEC COULEUR DYNAMIQUE
const userTextStyle = computed((): CSSProperties => ({
  borderRadius: '18px',
  padding: '10px 14px',
  fontSize: '14px',
  lineHeight: '1.4',
  margin: '0',
  background: primaryColor.value,
  color: '#ffffff',
  border: 'none',
  boxShadow: 'none',
  fontFamily: 'inherit',
  wordWrap: 'break-word',
  position: 'relative'
}))

// ✅ NOM AGENT DANS LA BULLE AVEC COULEUR DYNAMIQUE
const agentNameInBubbleStyle = computed((): CSSProperties => ({
  fontWeight: '700',
  fontSize: '13px',
  color: primaryColor.value,
  margin: '0 0 2px 0',
  display: 'block',
  fontFamily: 'inherit'
}))

const agentTitleInBubbleStyle = computed((): CSSProperties => ({
  fontWeight: '500',
  fontSize: '11px',
  color: '#6b7280',
  margin: '0 0 6px 0',
  display: 'block',
  fontFamily: 'inherit'
}))

const youLabelInBubbleStyle = computed((): CSSProperties => ({
  fontWeight: '700',
  fontSize: '13px',
  color: 'rgba(255, 255, 255, 0.9)',
  margin: '0 0 4px 0',
  display: 'block',
  fontFamily: 'inherit'
}))

const messageTimeStyle = computed((): CSSProperties => ({
  fontSize: '11px',
  color: '#9ca3af',
  margin: '4px 0 0 0',
  textAlign: 'right',
  opacity: '0.8',
  fontFamily: 'inherit'
}))

// ✅ HEURE MESSAGE UTILISATEUR EN BLANC
const messageTimeUserStyle = computed((): CSSProperties => ({
  fontSize: '11px',
  color: '#FFFFFF',
  margin: '4px 0 0 0',
  textAlign: 'right',
  opacity: '1',
  fontFamily: 'inherit'
}))

// ✅ TYPING INDICATOR 

const typingSimpleStyle = computed((): CSSProperties => ({
  padding: '12px 16px !important',
  background: 'transparent !important',
  borderRadius: '18px !important',
  margin: '0 !important',
  color: '#6b7280 !important',
  fontSize: '12px !important',
  fontStyle: 'italic !important',
  fontFamily: 'inherit !important',
  maxWidth: '75% !important'
}))

const typingTextStyle = computed((): CSSProperties => ({
  fontSize: '12px',
  color: '#6b7280',
  fontStyle: 'italic',
  marginRight: '8px',
  fontFamily: 'inherit',
  whiteSpace: 'nowrap' 
}))

const typingIndicatorStyle = computed((): CSSProperties => ({
  display: 'flex', 
  alignItems: 'center', 
  gap: '8px',
  padding: '12px 16px',
  background: '#ffffff',
  borderRadius: '18px',
  margin: '0'
}))

const typingDotsStyle = computed((): CSSProperties => ({
  display: 'flex',
  gap: '4px',
  alignItems: 'center'
}))

const typingDotStyle = computed((): CSSProperties => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#9ca3af',
  animation: 'cs-typing-animation 1.4s infinite'
}))

const inputSectionStyle = computed((): CSSProperties => ({
  padding: '16px 20px',
  borderTop: '1px solid #e5e7eb',
  background: '#ffffff',
  flexShrink: '0',
  margin: '0',
  fontFamily: 'inherit'
}))

const inputContainerStyle = computed((): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  margin: '0 0 12px 0',
  padding: '0'
}))

// ✅ INPUT MOBILE AVEC SAFE AREA ET GESTION CLAVIER
const mobileInputSectionStyle = computed((): CSSProperties => ({
  borderTop: '1px solid #e5e7eb',
  background: '#ffffff',
  flexShrink: '0',
  paddingTop: '16px',
  paddingBottom: keyboardVisible.value ? '16px' : 'calc(16px + env(safe-area-inset-bottom))', 
  paddingLeft: '0',
  paddingRight: '0',
  margin: '0',
  fontFamily: 'inherit',
  width: '100vw',
  maxWidth: '100vw'
}))

const mobileInputContainerStyle = computed((): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  margin: '0 0 10px 0',
  padding: '0 16px'
}))

const messageInputStyle = computed((): CSSProperties => ({
  flex: '1',
  background: '#f8fafc',
  border: '2px solid #e2e8f0',
  borderRadius: '25px',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#374151',
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'all 0.2s ease',
  margin: '0'
}))

// ✅ BOUTON MICRO EN GRIS
const voiceButtonStyle = computed((): CSSProperties => ({
  background: '#6B7280',
  border: 'none',
  color: '#ffffff',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  margin: '0',
  outline: 'none'
}))

// ✅ BOUTON SEND AVEC COULEUR DYNAMIQUE
const sendButtonStyle = computed((): CSSProperties => ({
  width: '44px',
  height: '44px',
  background: primaryColor.value,
  border: 'none',
  borderRadius: '50%',
  color: '#ffffff',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  flexShrink: '0',
  boxShadow: `0 4px 14px rgba(${hexToRgb(primaryColor.value)}, 0.4)`,
  margin: '0',
  outline: 'none'
}))

const loadingSpinnerStyle = computed((): CSSProperties => ({
  width: '20px',
  height: '20px',
  border: '2px solid transparent',
  borderTop: '2px solid currentColor',
  borderRadius: '50%',
  animation: 'cs-spin 1s linear infinite'
}))

// ✅ FOOTER CORRIGÉ DEUX COLONNES
const footerInfoStyle = computed((): CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '11px',
  color: '#9ca3af',
  margin: '0',
  padding: '0',
  width: '100%',
  fontFamily: 'inherit'
}))

const mobileFooterStyle = computed((): CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '10px',
  color: '#9ca3af',
  margin: '0',
  padding: '0 16px',
  width: '100%',
  fontFamily: 'inherit'
}))

const poweredByStyle = computed((): CSSProperties => ({
  textAlign: 'left',
  flexShrink: '0',
  fontFamily: 'inherit'
}))

const securityStyle = computed((): CSSProperties => ({
  textAlign: 'right',
  flexShrink: '0',
  fontFamily: 'inherit'
}))

// ✅ FONCTIONS COMPLÈTES RESTAURÉES

// ✅ NOUVELLE FONCTION : Initialiser conversation via API /init
const initConversation = async () => {
  try {
    console.log('🎬 [INIT] Initialisation conversation via API...')

    // ✅ PRIORITÉ 1 : Vérifier conversation sauvegardée
    if (typeof window !== 'undefined' && (window as any).ChatSeller) {
      const savedConversation = (window as any).ChatSeller.loadConversation()

      if (savedConversation && savedConversation.messages && savedConversation.messages.length > 0) {
        messages.value = savedConversation.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        conversationId.value = savedConversation.conversationId
        console.log('📂 [INIT] Conversation restaurée:', {
          messages: messages.value.length,
          conversationId: conversationId.value
        })
        return
      }
    }

    // ✅ PRIORITÉ 2 : Appeler API /init pour créer conversation et recevoir message de bienvenue
    const apiUrl = configData.value.apiUrl || 'https://chatseller-api-production.up.railway.app'
    const endpoint = `${apiUrl}/api/v1/chat/init`

    console.log('🌐 [INIT] Appel API init:', endpoint)

    const payload = {
      shopId: configData.value.shopId || 'demo',
      agentId: configData.value.agentConfig?.id,
      productContext: productInfo.value ? {
        id: productInfo.value.id,
        name: productInfo.value.name,
        price: productInfo.value.price,
        url: productInfo.value.url
      } : null
    }

    console.log('📤 [INIT] Payload:', payload)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit'
    })

    if (!response.ok) {
      throw new Error(`Init API Error: ${response.status}`)
    }

    const result = await response.json()
    console.log('📥 [INIT] Réponse API:', result)

    if (result.success && result.data) {
      // ✅ Sauvegarder conversationId
      conversationId.value = result.data.conversationId

      // ✅ Afficher le message de bienvenue reçu de l'API
      const welcomeMsg: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.data.welcomeMessage,
        timestamp: new Date()
      }
      messages.value.push(welcomeMsg)

      console.log('✅ [INIT] Conversation initialisée:', {
        conversationId: conversationId.value,
        welcomeMessage: result.data.welcomeMessage.substring(0, 50) + '...'
      })

      // Scroll vers le bas
      await nextTick()
      scrollToBottom()
    } else {
      throw new Error('Init API response invalid')
    }

  } catch (error) {
    console.error('❌ [INIT] Erreur initialisation:', error)

    // ✅ Fallback : Générer message d'accueil côté client
    console.log('🔄 [INIT] Fallback sur message local...')
    await sendWelcomeMessageFallback()
  }
}

// ✅ FONCTION FALLBACK : Message d'accueil local (si API /init échoue)
const sendWelcomeMessageFallback = async () => {
  try {
    console.log('📝 [FALLBACK] Génération message d\'accueil local...')

    let welcomeMessage = ''

    // ✅ Utiliser welcomeMessage personnalisé de l'agent
    if (configData.value.agentConfig?.welcomeMessage) {
      console.log('✅ [FALLBACK] Message personnalisé trouvé')
      welcomeMessage = replaceWelcomeVariables(configData.value.agentConfig.welcomeMessage)
    } else {
      // ✅ Message par défaut intelligent
      const greeting = getTimeBasedGreeting()
      const agentName = configData.value.agentConfig?.name || 'Assistant'
      const agentTitle = configData.value.agentConfig?.title || 'Conseiller'

      if (productInfo.value?.name) {
        welcomeMessage = `${greeting} ! Je suis ${agentName}, ${agentTitle}.

Je vois que vous vous intéressez à "${productInfo.value.name}". Comment puis-je vous aider ? 😊`
      } else {
        welcomeMessage = `${greeting} ! Je suis ${agentName}, ${agentTitle}.

Comment puis-je vous aider aujourd'hui ? 😊`
      }
    }

    // ✅ Ajouter le message d'accueil
    const welcomeMsg: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }

    messages.value.push(welcomeMsg)
    console.log('✅ [FALLBACK] Message d\'accueil ajouté')

    // Scroll vers le bas
    await nextTick()
    scrollToBottom()

  } catch (error) {
    console.error('❌ [FALLBACK] Erreur message d\'accueil:', error)

    // ✅ Fallback minimal
    const fallbackMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: `Bonjour ! Je suis ${configData.value.agentConfig?.name || 'votre conseiller'}. Comment puis-je vous aider ? 😊`,
      timestamp: new Date()
    }
    messages.value.push(fallbackMessage)
  }
}

// ✅ NOUVELLE FONCTION : Remplacement variables dynamiques
const replaceWelcomeVariables = (message: string): string => {
  try {
    const agentName = configData.value.agentConfig?.name || 'Assistant'
    const agentTitle = configData.value.agentConfig?.title || 'Conseiller'
    const shopName = configData.value.shopName || 'cette boutique'
    const currentTime = new Date().getHours()
    const greeting = currentTime < 12 ? 'Bonjour' : currentTime < 18 ? 'Bonsoir' : 'Bonsoir'

    let productType = 'produit'
    let productName = 'ce produit'
    let productPrice = ''

    if (productInfo.value?.name) {
      productName = productInfo.value.name
      productType = getProductType(productInfo.value.name)
    }

    if (productInfo.value?.price) {
      productPrice = `${productInfo.value.price} CFA`
    }

    console.log('🔄 [VARIABLES] Remplacement des variables:', {
      agentName,
      agentTitle,
      shopName,
      productName,
      productPrice
    })

    return message
      // ✅ Support syntaxe ${variable}
      .replace(/\$\{agentName\}/g, agentName)
      .replace(/\$\{agentTitle\}/g, agentTitle)
      .replace(/\$\{shopName\}/g, shopName)
      .replace(/\$\{productName\}/g, productName)
      .replace(/\$\{productType\}/g, productType)
      .replace(/\$\{greeting\}/g, greeting)
      .replace(/\$\{productPrice\}/g, productPrice)
      // ✅ Support syntaxe {variable} pour Dashboard
      .replace(/\{nomConseillere\}/g, agentName)
      .replace(/\{nomMarque\}/g, shopName)
      .replace(/\{prenom\}/g, 'Client')

  } catch (error) {
    console.error('❌ [VARIABLES] Erreur remplacement variables:', error)
    return message // Retourner message original en cas d'erreur
  }
}

// ✅ HELPER : Obtenir le moment de la journée pour salutation naturelle
const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bonsoir'
  return 'Bonsoir'
}

// ✅ HELPER : Déterminer le type de produit pour un message naturel
const getProductType = (productName: string): string => {
  if (!productName) return 'produit'
  
  const name = productName.toLowerCase()
  
  if (name.includes('jeu') || name.includes('game') || name.includes('cartes')) return 'jeu'
  if (name.includes('livre') || name.includes('book') || name.includes('roman')) return 'livre'  
  if (name.includes('cours') || name.includes('formation') || name.includes('training')) return 'formation'
  if (name.includes('smartphone') || name.includes('téléphone') || name.includes('phone')) return 'smartphone'
  if (name.includes('ordinateur') || name.includes('laptop') || name.includes('computer')) return 'ordinateur'
  if (name.includes('vêtement') || name.includes('tshirt') || name.includes('robe')) return 'vêtement'
  if (name.includes('service') || name.includes('consultation') || name.includes('accompagnement')) return 'service'
  if (name.includes('bijou') || name.includes('collier') || name.includes('bracelet')) return 'bijou'
  
  return 'produit'
}

// ✅ GESTION MOBILE INPUT FOCUS/BLUR
const handleMobileInputFocus = () => {
  if (isMobile.value) {
    keyboardVisible.value = true
    console.log('📱 [MOBILE] Clavier affiché')
    // Petit délai pour permettre l'animation
    setTimeout(() => {
      scrollToBottom()
    }, 300)
  }
}

const handleMobileInputBlur = () => {
  if (isMobile.value) {
    keyboardVisible.value = false
    console.log('📱 [MOBILE] Clavier masqué')
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value || isLoading.value) return

  const messageContent = currentMessage.value.trim()
  currentMessage.value = ''

  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content: messageContent,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  isTyping.value = true
  await nextTick()
  scrollToBottom()

  try {
    console.log('📤 [WIDGET] Envoi message à l\'API...', {
      message: messageContent.substring(0, 50),
      conversationId: conversationId.value
    })

    // ✅ CORRECTION : Déterminer si c'est le premier message utilisateur
    const userMessageCount = messages.value.filter(m => m.role === 'user').length
    const isFirstUserMessage = userMessageCount === 1

    console.log('📤 [WIDGET] Premier message utilisateur:', isFirstUserMessage, '(total user messages:', userMessageCount, ')')

    const response = await sendApiMessage(messageContent, isFirstUserMessage)

    console.log('📥 [WIDGET] Réponse API complète:', response)

    if (response && response.success && response.data) {
      conversationId.value = response.data.conversationId

      // ✅ CORRECTION : Vérifier que response.data.message existe
      if (response.data.message) {
        const aiMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: response.data.message,
          timestamp: new Date()
        }
        messages.value.push(aiMessage)

        console.log('✅ [WIDGET] Réponse IA reçue et affichée:', response.data.message.substring(0, 100))
      } else {
        console.error('❌ [WIDGET] Pas de message dans la réponse API:', response.data)
        throw new Error('Réponse API invalide: pas de message')
      }
    } else {
      console.error('❌ [WIDGET] Réponse API invalide:', response)
      throw new Error(response?.error || 'Erreur API inconnue')
    }

  } catch (error: unknown) {
    console.error('❌ [WIDGET] Erreur complète envoi message:', {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })

    // ✅ Fallback intelligent avec le message original de l'utilisateur
    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: getIntelligentResponse(messageContent),
      timestamp: new Date()
    }
    messages.value.push(aiMessage)

  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()

    // ✅ Sauvegarder conversation
    if (typeof window !== 'undefined' && (window as any).ChatSeller) {
      (window as any).ChatSeller.saveConversation(messages.value, conversationId.value)
    }
  }
}

const handleVoiceMessage = () => {
  console.log('🎤 Message vocal demandé')
  alert('Fonctionnalité vocale bientôt disponible !')
}

const resetChat = () => {
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    (window as any).ChatSeller.resetConversation()
  }

  messages.value = []
  conversationId.value = null
  initConversation()
  console.log('🔄 Chat réinitialisé')
}

const closeChat = () => {
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    (window as any).ChatSeller.closeChat()
  }
}

// ✅ API CALL CORRIGÉE AVEC GESTION CORS ET LOGS DÉTAILLÉS
const sendApiMessage = async (message: string, isFirstUserMessage: boolean = false) => {
  const apiUrl = configData.value.apiUrl || 'https://chatseller-api-production.up.railway.app'
  const endpoint = `${apiUrl}/api/v1/public/chat`

  console.log('📤 [API CALL] Configuration complète:', {
    endpoint,
    shopId: configData.value.shopId,
    agentId: configData.value.agentConfig?.id,
    agentName: configData.value.agentConfig?.name,
    isFirstUserMessage,
    conversationId: conversationId.value
  })

  const payload = {
    shopId: configData.value.shopId || 'demo',
    message,
    conversationId: conversationId.value,
    productInfo: productInfo.value ? {
      id: productInfo.value.id,
      name: productInfo.value.name,
      price: productInfo.value.price,
      url: productInfo.value.url
    } : null,
    visitorId: `visitor_${Date.now()}`,
    isFirstMessage: false // ✅ CORRECTION : Toujours false car on gère l'accueil côté Widget
  }

  console.log('📤 [API CALL] Payload complet:', JSON.stringify(payload, null, 2))

  try {
    console.log('🌐 [API CALL] Début appel API vers:', endpoint)

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Message-Count': messages.value.filter(m => m.role === 'assistant').length.toString(),
        'X-Is-First-User-Message': isFirstUserMessage.toString()
      },
      body: JSON.stringify(payload),
      mode: 'cors',
      credentials: 'omit'
    })

    console.log('📥 [API CALL] Statut réponse:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [API CALL] Erreur HTTP détaillée:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText.substring(0, 500)
      })
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ [API CALL] Réponse API reçue:', {
      success: result.success,
      hasData: !!result.data,
      hasMessage: !!result.data?.message,
      messagePreview: result.data?.message?.substring(0, 100),
      conversationId: result.data?.conversationId
    })

    return result
  } catch (error) {
    console.error('❌ [WIDGET API] Network Error complète:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : 'Unknown'
    })
    throw error
  }
}

const getIntelligentResponse = (message: string): string => {
  const msg = message.toLowerCase()
  const productName = productInfo.value?.name || 'ce produit'
  
  if (msg.includes('acheter') || msg.includes('commander')) {
    return `Parfait ! Je vais vous aider à commander **${productName}**. 🎉

**Combien d'exemplaires** souhaitez-vous ?`
  }
  
  if (msg.includes('prix')) {
    return `Je vérifie le prix de **${productName}** pour vous... Un instant ! ⏳`
  }
  
  return `Merci pour votre question ! 😊 Je vous mets en relation avec notre équipe pour les informations plus précises sur **${productName}**.`
}

const formatMessage = (content: string) => {
  let formatted = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer" style="color: ' + primaryColor.value + '; text-decoration: underline; font-weight: 500;">$1</a>'
  )
  
  return formatted
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fr', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fr', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  const color = primaryColor.value.replace('#', '')
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${color}&color=fff&size=128`
}

const adjustColor = (color: string, percent: number): string => {
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
  } catch (error: unknown) {
    console.warn('⚠️ Erreur ajustement couleur:', error)
    return color
  }
}

const hexToRgb = (hex: string): string => {
  try {
    const color = hex.replace('#', '')
    const r = parseInt(color.substr(0, 2), 16)
    const g = parseInt(color.substr(2, 2), 16)
    const b = parseInt(color.substr(4, 2), 16)
    return `${r}, ${g}, ${b}`
  } catch (error: unknown) {
    console.warn('⚠️ Erreur conversion hex vers rgb:', error)
    return '139, 92, 246'
  }
}

const scrollToBottom = () => {
  const container = isMobile.value ? mobileMessagesContainer.value : messagesContainer.value
  const endRef = isMobile.value ? mobileMessagesEndRef.value : messagesEndRef.value
  
  if (endRef) {
    endRef.scrollIntoView({ behavior: 'smooth' })
  }
}

// ✅ RESTAURÉ : GÉNÉRATEUR CLÉ CONVERSATION
const generateConversationKey = (): string => {
  const shopId = configData.value.shopId
  const productId = configData.value.productId || 'general'
  const productName = configData.value.productName || 'general'
  
  // Clé basée sur shopId + produit (ID ou nom normalisé)
  const normalizedProduct = productId !== 'general' 
    ? productId 
    : productName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50)
  
  return `${shopId}-${normalizedProduct}`
}

// ✅ RESTAURÉ : SAUVEGARDE CONVERSATION
const saveConversation = (messages: any[], conversationId: string | null) => {
  try {
    if (!currentConversationKey) {
      currentConversationKey = generateConversationKey()
    }

    const conversationData = {
      messages,
      conversationId,
      timestamp: new Date().toISOString(),
      shopId: configData.value.shopId,
      productInfo: {
        id: configData.value.productId,
        name: configData.value.productName,
        price: configData.value.productPrice,
        url: configData.value.productUrl || window.location.href
      },
      userAgent: navigator.userAgent,
      lastActivity: Date.now()
    }
    
    // ✅ SAUVEGARDE LOCALE ET NAVIGATEUR
    conversationHistory.set(currentConversationKey, conversationData)
    
    // ✅ SAUVEGARDE LOCALSTORAGE AVEC NETTOYAGE AUTO
    try {
      const storageKey = `chatseller-conv-${currentConversationKey}`
      localStorage.setItem(storageKey, JSON.stringify(conversationData))
      
      // ✅ NETTOYAGE CONVERSATIONS ANCIENNES (>7 jours)
      cleanupOldConversations()
      
      console.log('💾 [PERSISTENCE] Conversation sauvegardée:', {
        key: currentConversationKey,
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

// ✅ RESTAURÉ : CHARGEMENT CONVERSATION
const loadConversation = (): any => {
  try {
    const requestedKey = generateConversationKey()
    console.log('📂 [PERSISTENCE] Recherche conversation:', requestedKey)

    // ✅ PRIORITÉ 1 : Conversation en mémoire
    if (conversationHistory.has(requestedKey)) {
      const memoryConv = conversationHistory.get(requestedKey)
      if (isConversationValid(memoryConv)) {
        currentConversationKey = requestedKey
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
        if (isConversationValid(data)) {
          conversationHistory.set(requestedKey, data)
          currentConversationKey = requestedKey
          console.log('📂 [PERSISTENCE] Conversation restaurée depuis localStorage')
          return data
        }
      }
    } catch (storageError) {
      console.warn('⚠️ [PERSISTENCE] Erreur lecture localStorage:', storageError)
    }

    // ✅ PRIORITÉ 3 : Recherche conversation similaire (même shop, produit différent)
    const similarConv = findSimilarConversation()
    if (similarConv) {
      console.log('📂 [PERSISTENCE] Conversation similaire trouvée, création nouvelle session')
      // Ne pas restaurer mais notifier qu'il y a un historique
      return {
        isNewProductConversation: true,
        previousProduct: similarConv.productInfo?.name,
        suggestedMessage: `Je vois que nous avons déjà échangé au sujet de "${similarConv.productInfo?.name}". Aujourd'hui vous regardez "${configData.value.productName}". Comment puis-je vous aider ?`
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
const isConversationValid = (conversation: any): boolean => {
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
const findSimilarConversation = (): any => {
  try {
    const currentShop = configData.value.shopId
    
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
const cleanupOldConversations = (): void => {
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
    conversationHistory.forEach((value, key) => {
      const age = currentTime - (value.lastActivity || 0)
      if (age > maxAge) {
        conversationHistory.delete(key)
      }
    })
    
    if (keysToRemove.length > 0) {
      console.log(`🧹 [CLEANUP] ${keysToRemove.length} conversations anciennes nettoyées`)
    }
    
  } catch (error) {
    console.warn('⚠️ [CLEANUP] Erreur nettoyage:', error)
  }
}

// ✅ RESTAURÉ : RESET CONVERSATION
const resetConversation = () => {
  try {
    if (currentConversationKey) {
      // Supprimer de localStorage
      const storageKey = `chatseller-conv-${currentConversationKey}`
      localStorage.removeItem(storageKey)
      
      // Supprimer de mémoire
      conversationHistory.delete(currentConversationKey)
      
      console.log('🔄 [RESET] Conversation réinitialisée:', currentConversationKey)
    }
    
    // Réinitialiser état
    currentConversationKey = null
    
  } catch (error) {
    console.warn('⚠️ [RESET] Erreur reset conversation:', error)
  }
}

watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
  
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    (window as any).ChatSeller.saveConversation(messages.value, conversationId.value)
  }
}, { deep: true })


onMounted(() => {
  console.log('🎨 [WIDGET VUE] Composant monté avec couleur:', primaryColor.value)
  console.log('🎨 [WIDGET VUE] Configuration agent:', {
    name: configData.value.agentConfig?.name,
    title: configData.value.agentConfig?.title,
    welcomeMessage: configData.value.agentConfig?.welcomeMessage ? 'OUI' : 'NON',
    productInfo: productInfo.value?.name || 'AUCUN'
  })
  
  // ✅ CORRECTION MAJEURE : Initialiser conversation via API
  nextTick(() => {
    initConversation()
    console.log('✅ [WIDGET VUE] Initialisation conversation déclenchée')
  })
  
  // ✅ GESTION MOBILE VIEWPORT AMÉLIORÉE
  if (isMobile.value && typeof window !== 'undefined') {
    console.log('📱 [MOBILE] Configuration viewport améliorée...')
    
    // ✅ MÉTAVIEWPORT DYNAMIQUE
    let metaViewport = document.querySelector('meta[name="viewport"]')
    if (!metaViewport) {
      metaViewport = document.createElement('meta')
      metaViewport.setAttribute('name', 'viewport')
      document.head.appendChild(metaViewport)
    }
    metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover')
    
    // ✅ CSS MOBILE AMÉLIORÉ
    const mobileStyle = document.createElement('style')
    mobileStyle.id = 'chatseller-mobile-enhanced'
    mobileStyle.textContent = `
      /* ✅ MOBILE AMÉLIORÉ AVEC GESTION CLAVIER */
      html.cs-modal-open,
      body.cs-modal-open {
        overflow: hidden !important;
        position: fixed !important;
        width: 100vw !important;
        height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      .cs-chat-modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        overscroll-behavior: none !important;
      }
      
      @media (max-width: 767px) {
        .cs-chat-container-mobile {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          height: 100dvh !important;
          border-radius: 0 !important;
          overflow: hidden !important;
        }
        
        /* ✅ GESTION CLAVIER AMÉLIORÉE */
        .cs-chat-container-mobile.keyboard-visible {
          height: 100vh !important;
        }
        
        /* ✅ SAFE AREA IPHONE */
        @supports (padding: max(0px)) {
          .cs-mobile-header {
            padding-top: calc(env(safe-area-inset-top) + 16px) !important;
          }
          
          .cs-mobile-input-section:not(.keyboard-visible) {
            padding-bottom: calc(env(safe-area-inset-bottom) + 16px) !important;
          }
        }
      }
    `
    document.head.appendChild(mobileStyle)
    
    // ✅ CLASSES BODY
    document.documentElement.classList.add('cs-modal-open')
    document.body.classList.add('cs-modal-open')
    
    console.log('✅ [MOBILE] Configuration améliorée terminée')
    
    // ✅ NETTOYAGE AU DÉMONTAGE
    return () => {
      document.documentElement.classList.remove('cs-modal-open')
      document.body.classList.remove('cs-modal-open')
      const mobileStyleEl = document.getElementById('chatseller-mobile-enhanced')
      if (mobileStyleEl) {
        mobileStyleEl.remove()
      }
    }
  }
})
</script>

<style scoped>
/* ✅ ANIMATIONS CSS DANS LE COMPONENT */
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
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

@keyframes cs-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cs-typing-dot:nth-child(1) { animation-delay: 0s; }
.cs-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.cs-typing-dot:nth-child(3) { animation-delay: 0.4s; }

.cs-mobile-dot:nth-child(1) { animation-delay: 0s; }
.cs-mobile-dot:nth-child(2) { animation-delay: 0.2s; }
.cs-mobile-dot:nth-child(3) { animation-delay: 0.4s; }
</style>