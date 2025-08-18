<template>
  <div class="cs-chatseller-widget">
    <!-- ✅ BOUTON WIDGET AVEC COULEURS DYNAMIQUES -->
    <Transition name="cs-fade">
      <button
        v-if="!isOpen"
        @click="openChat"
        :style="brandButtonStyles"
        class="cs-chat-trigger-button cs-brand-style"
        :class="getTriggerButtonClasses()"
      >
        <div class="cs-button-content">
          <svg class="cs-chat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
          </svg>
          <span class="cs-button-text">{{ config.buttonText || 'Parler à un conseiller' }}</span>
        </div>
        
        <!-- Badge notification -->
        <span 
          v-if="hasUnreadMessages"
          class="cs-notification-badge"
        ></span>
      </button>
    </Transition>

    <!-- ✅ MODAL CHAT AVEC DESIGN ADAPTATIF DESKTOP/MOBILE -->
    <Transition name="cs-modal">
      <div
        v-if="isOpen"
        class="cs-chat-modal-overlay"
        :class="{ 'cs-mobile': isMobile }"
        @click.self="closeChatOnOverlay"
      >
        <!-- Interface Mobile (style WhatsApp avec couleurs de marque) -->
        <div 
          v-if="isMobile"
          class="cs-chat-container cs-mobile-container"
          :style="brandContainerStyles"
        >
          
          <!-- Header Mobile -->
          <div class="cs-chat-header cs-mobile-header" :style="brandHeaderStyles">
            <div class="cs-header-content">
              <div class="cs-agent-info">
                <div class="cs-agent-avatar-container">
                  <img
                    :src="agentAvatar"
                    :alt="agentName"
                    class="cs-agent-avatar"
                    @error="handleAvatarError"
                  >
                  <div class="cs-online-indicator" :style="{ backgroundColor: primaryColor }"></div>
                </div>
                <div class="cs-agent-details">
                  <h3 class="cs-agent-name">{{ agentName }}</h3>
                  <p class="cs-agent-status">
                    <span class="cs-status-dot" :style="{ backgroundColor: primaryColor }"></span>
                    En ligne • {{ agentTitle }}
                  </p>
                </div>
              </div>
              
              <button @click="closeChat" class="cs-close-button">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Contexte produit Mobile -->
          <div
            v-if="productInfo"
            class="cs-product-context cs-mobile-product"
            :style="brandProductContextStyles"
          >
            <div class="cs-product-card">
              <div class="cs-product-indicator">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                <span>Produit consulté</span>
              </div>
              <div class="cs-product-details">
                <h4 class="cs-product-name">{{ productInfo.name }}</h4>
                <p v-if="productInfo.price" class="cs-product-price" :style="{ color: primaryColor }">
                  {{ formatPrice(productInfo.price) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Messages Mobile -->
          <div ref="messagesContainer" class="cs-messages-container cs-mobile-messages">
            <div
              v-for="message in messages"
              :key="message.id"
              class="cs-message-wrapper"
              :class="message.role === 'user' ? 'cs-user-wrapper' : 'cs-assistant-wrapper'"
            >
              
              <!-- Message assistant -->
              <div v-if="message.role === 'assistant'" class="cs-message cs-assistant-message">
                <div class="cs-message-avatar">
                  <img :src="agentAvatar" :alt="agentName" class="cs-avatar-small" @error="handleAvatarError">
                </div>
                <div class="cs-message-content">
                  <div class="cs-message-bubble cs-assistant-bubble">
                    <div class="cs-message-text" v-html="formatMessage(message.content)"></div>
                    <div class="cs-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
              </div>

              <!-- Message utilisateur -->
              <div v-else class="cs-message cs-user-message">
                <div class="cs-message-content">
                  <div class="cs-message-bubble cs-user-bubble" :style="brandUserBubbleStyles">
                    <div class="cs-message-text">{{ message.content }}</div>
                    <div class="cs-message-time">
                      {{ formatTime(message.timestamp) }}
                      <svg class="cs-message-check" width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div v-if="isTyping" class="cs-message-wrapper cs-assistant-wrapper">
              <div class="cs-message cs-assistant-message">
                <div class="cs-message-avatar">
                  <img :src="agentAvatar" :alt="agentName" class="cs-avatar-small" @error="handleAvatarError">
                </div>
                <div class="cs-message-content">
                  <div class="cs-typing-bubble">
                    <div class="cs-typing-indicator">
                      <div class="cs-typing-dot"></div>
                      <div class="cs-typing-dot"></div>
                      <div class="cs-typing-dot"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref="messagesEndRef" />
          </div>

          <!-- Actions rapides Mobile -->
          <div v-if="showQuickActions" class="cs-quick-actions cs-mobile-actions">
            <div class="cs-actions-grid">
              <button @click="sendQuickMessage(quickActions.buyNow)" class="cs-quick-action cs-primary-action" :style="brandPrimaryActionStyles">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                {{ quickActions.buyNow }}
              </button>
              
              <button @click="sendQuickMessage(quickActions.haveQuestions)" class="cs-quick-action cs-secondary-action" :style="brandSecondaryActionStyles">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ quickActions.haveQuestions }}
              </button>
              
              <button @click="sendQuickMessage(quickActions.wantToKnowMore)" class="cs-quick-action cs-secondary-action" :style="brandSecondaryActionStyles">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {{ quickActions.wantToKnowMore }}
              </button>
            </div>
          </div>

          <!-- Input Mobile -->
          <div class="cs-message-input cs-mobile-input">
            <div class="cs-input-container">
              <div class="cs-input-wrapper">
                <input v-model="currentMessage" @keypress.enter="sendMessage" :placeholder="inputPlaceholder" class="cs-message-field" :disabled="isTyping || isLoading">
              </div>
              <button @click="sendMessage" :disabled="!currentMessage.trim() || isTyping || isLoading" class="cs-send-button" :style="brandSendButtonStyles">
                <svg v-if="!isTyping" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <svg v-else class="cs-loading-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
            
            <div class="cs-footer">
              <p>Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong> • Assistant IA</p>
            </div>
          </div>
        </div>

        <!-- ✅ INTERFACE DESKTOP INNOVANTE -->
        <div 
          v-else
          class="cs-chat-container cs-desktop-container"
          :style="brandDesktopStyles"
        >
          
          <!-- Header Desktop Moderne -->
          <div class="cs-desktop-header" :style="brandDesktopHeaderStyles">
            <div class="cs-header-glassmorphism">
              <div class="cs-agent-presentation">
                <div class="cs-agent-avatar-large">
                  <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                  <div class="cs-status-ring" :style="{ borderColor: primaryColor }">
                    <div class="cs-status-core" :style="{ backgroundColor: primaryColor }"></div>
                  </div>
                </div>
                <div class="cs-agent-intro">
                  <h2 class="cs-agent-title">{{ agentName }}</h2>
                  <p class="cs-agent-subtitle">{{ agentTitle }}</p>
                  <div class="cs-status-badge" :style="brandStatusBadgeStyles">
                    <span class="cs-status-pulse" :style="{ backgroundColor: primaryColor }"></span>
                    Disponible maintenant
                  </div>
                </div>
              </div>
              
              <button @click="closeChat" class="cs-close-button-desktop">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Contexte produit Desktop -->
          <div v-if="productInfo" class="cs-product-showcase" :style="brandProductShowcaseStyles">
            <div class="cs-product-highlight">
              <div class="cs-product-badge" :style="{ backgroundColor: primaryColor }">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Produit en consultation
              </div>
              <div class="cs-product-info">
                <h3 class="cs-product-title">{{ productInfo.name }}</h3>
                <p v-if="productInfo.price" class="cs-product-price-large" :style="{ color: primaryColor }">
                  {{ formatPrice(productInfo.price) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Messages Desktop avec layout amélioré -->
          <div ref="messagesContainer" class="cs-messages-container cs-desktop-messages">
            <div
              v-for="message in messages"
              :key="message.id"
              class="cs-message-item"
              :class="message.role === 'user' ? 'cs-user-item' : 'cs-assistant-item'"
            >
              
              <!-- Message assistant Desktop -->
              <div v-if="message.role === 'assistant'" class="cs-desktop-message cs-assistant-desktop">
                <div class="cs-message-avatar-desktop">
                  <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                </div>
                <div class="cs-message-content-desktop">
                  <div class="cs-message-header-desktop">
                    <span class="cs-sender-name">{{ agentName }}</span>
                    <span class="cs-message-timestamp">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="cs-message-bubble-desktop cs-assistant-bubble-desktop">
                    <div class="cs-message-text-desktop" v-html="formatMessage(message.content)"></div>
                  </div>
                </div>
              </div>

              <!-- Message utilisateur Desktop -->
              <div v-else class="cs-desktop-message cs-user-desktop">
                <div class="cs-message-content-desktop">
                  <div class="cs-message-header-desktop">
                    <span class="cs-message-timestamp">{{ formatTime(message.timestamp) }}</span>
                    <span class="cs-sender-name">Vous</span>
                  </div>
                  <div class="cs-message-bubble-desktop cs-user-bubble-desktop" :style="brandUserBubbleDesktopStyles">
                    <div class="cs-message-text-desktop">{{ message.content }}</div>
                  </div>
                </div>
                <div class="cs-user-avatar-desktop" :style="{ backgroundColor: primaryColor }">
                  <span>{{ agentName.charAt(0).toUpperCase() }}</span>
                </div>
              </div>
            </div>

            <!-- Typing indicator Desktop -->
            <div v-if="isTyping" class="cs-message-item cs-assistant-item">
              <div class="cs-desktop-message cs-assistant-desktop">
                <div class="cs-message-avatar-desktop">
                  <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                </div>
                <div class="cs-message-content-desktop">
                  <div class="cs-message-header-desktop">
                    <span class="cs-sender-name">{{ agentName }}</span>
                    <span class="cs-typing-text">est en train d'écrire...</span>
                  </div>
                  <div class="cs-typing-bubble-desktop">
                    <div class="cs-typing-indicator-desktop">
                      <div class="cs-typing-dot-desktop" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-typing-dot-desktop" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-typing-dot-desktop" :style="{ backgroundColor: primaryColor }"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div ref="messagesEndRef" />
          </div>

          <!-- Actions rapides Desktop -->
          <div v-if="showQuickActions" class="cs-quick-actions cs-desktop-actions">
            <div class="cs-actions-title">
              <h4>Comment puis-je vous aider ?</h4>
              <p>Choisissez une option ou tapez votre question</p>
            </div>
            <div class="cs-actions-grid-desktop">
              <button @click="sendQuickMessage(quickActions.buyNow)" class="cs-action-card cs-primary-card" :style="brandPrimaryCardStyles">
                <div class="cs-card-icon" :style="{ backgroundColor: primaryColor }">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
                <div class="cs-card-content">
                  <h5>Acheter maintenant</h5>
                  <p>Je suis prêt(e) à finaliser ma commande</p>
                </div>
              </button>
              
              <button @click="sendQuickMessage(quickActions.haveQuestions)" class="cs-action-card cs-secondary-card">
                <div class="cs-card-icon cs-secondary-icon" :style="{ backgroundColor: lighterPrimaryColor }">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="cs-card-content">
                  <h5>Poser une question</h5>
                  <p>J'ai des questions sur ce produit</p>
                </div>
              </button>
              
              <button @click="sendQuickMessage(quickActions.wantToKnowMore)" class="cs-action-card cs-secondary-card">
                <div class="cs-card-icon cs-secondary-icon" :style="{ backgroundColor: lighterPrimaryColor }">
                  <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div class="cs-card-content">
                  <h5>En savoir plus</h5>
                  <p>Découvrir les détails et avantages</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Input Desktop sophistiqué -->
          <div class="cs-message-input cs-desktop-input">
            <div class="cs-input-sophisticated">
              <div class="cs-input-group">
                <div class="cs-input-field-container">
                  <input 
                    v-model="currentMessage" 
                    @keypress.enter="sendMessage" 
                    :placeholder="inputPlaceholder" 
                    class="cs-message-field-desktop" 
                    :disabled="isTyping || isLoading"
                  >
                  <div class="cs-input-enhancement" :style="{ borderColor: primaryColor }"></div>
                </div>
                <button 
                  @click="sendMessage" 
                  :disabled="!currentMessage.trim() || isTyping || isLoading" 
                  class="cs-send-button-desktop" 
                  :style="brandSendButtonDesktopStyles"
                >
                  <svg v-if="!isTyping" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  <svg v-else class="cs-loading-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </button>
              </div>
              <div class="cs-input-footer">
                <div class="cs-footer-left">
                  <span class="cs-footer-branding">Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong></span>
                </div>
                <div class="cs-footer-right">
                  <span class="cs-privacy">🔒 Conversation sécurisée</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { ChatSellerConfig } from './embed'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface Translations {
  [lang: string]: {
    [key: string]: string
  }
}

// Props
const props = defineProps<{
  config: ChatSellerConfig
}>()

// State
const isOpen = ref(false)
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const isLoading = ref(false)
const conversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement>()
const messagesEndRef = ref<HTMLElement>()
const errorMessage = ref<string | null>(null)
const lastFailedMessage = ref<string | null>(null)
const hasUnreadMessages = ref(false)

// Translations
const translations: Translations = {
  fr: {
    you: 'Vous',
    viewing_product: 'Produit consulté',
    wantToBuyNow: "Je veux l'acheter maintenant",
    haveQuestions: "J'ai des questions",
    wantToKnowMore: "Je veux en savoir plus",
    typeMessage: "Tapez votre message...",
    defaultWelcome: "Bonjour ! Je suis votre assistant d'achat. Comment puis-je vous aider ?",
    retry: "Réessayer"
  }
}

const t = (key: string): string => {
  const lang = props.config.language || 'fr'
  const langTranslations = translations[lang]
  const frTranslations = translations.fr
  
  return (langTranslations && langTranslations[key]) || 
         (frTranslations && frTranslations[key]) || 
         key
}

// ✅ COULEURS DYNAMIQUES BASÉES SUR LA CONFIGURATION
const primaryColor = computed(() => props.config.primaryColor || '#E91E63')

const lighterPrimaryColor = computed(() => {
  return adjustColor(primaryColor.value, 20)
})

const darkerPrimaryColor = computed(() => {
  return adjustColor(primaryColor.value, -20)
})

// ✅ STYLES DYNAMIQUES POUR TOUS LES ÉLÉMENTS
const brandButtonStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${darkerPrimaryColor.value} 100%)`,
  borderColor: primaryColor.value
}))

const brandHeaderStyles = computed(() => ({
  background: `linear-gradient(135deg, ${darkerPrimaryColor.value} 0%, ${adjustColor(primaryColor.value, -30)} 100%)`
}))

const brandContainerStyles = computed(() => ({
  background: '#f0f0f0'
}))

const brandProductContextStyles = computed(() => ({
  background: `linear-gradient(135deg, ${adjustColor(primaryColor.value, 40)} 0%, ${adjustColor(primaryColor.value, 30)} 100%)`
}))

const brandUserBubbleStyles = computed(() => ({
  background: `linear-gradient(135deg, ${adjustColor(primaryColor.value, 30)} 0%, ${adjustColor(primaryColor.value, 20)} 100%)`,
  border: `1px solid ${adjustColor(primaryColor.value, 10)}`
}))

const brandPrimaryActionStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${darkerPrimaryColor.value} 100%)`
}))

const brandSecondaryActionStyles = computed(() => ({
  background: '#f8f9fa',
  color: primaryColor.value,
  border: `1px solid ${adjustColor(primaryColor.value, 40)}`
}))

const brandSendButtonStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${darkerPrimaryColor.value} 100%)`
}))

// ✅ STYLES DESKTOP INNOVANTS
const brandDesktopStyles = computed(() => ({
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  border: `1px solid ${adjustColor(primaryColor.value, 50)}`,
  boxShadow: `0 20px 80px rgba(0, 0, 0, 0.1), 0 0 0 1px ${adjustColor(primaryColor.value, 60)} inset`
}))

const brandDesktopHeaderStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value}15 0%, ${primaryColor.value}08 100%)`
}))

const brandStatusBadgeStyles = computed(() => ({
  background: `${primaryColor.value}15`,
  color: darkerPrimaryColor.value,
  border: `1px solid ${primaryColor.value}30`
}))

const brandProductShowcaseStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value}10 0%, ${primaryColor.value}05 100%)`,
  border: `1px solid ${primaryColor.value}20`
}))

const brandUserBubbleDesktopStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${darkerPrimaryColor.value} 100%)`,
  boxShadow: `0 4px 16px ${primaryColor.value}30`
}))

const brandPrimaryCardStyles = computed(() => ({
  border: `2px solid ${primaryColor.value}`,
  boxShadow: `0 8px 32px ${primaryColor.value}20`
}))

const brandSendButtonDesktopStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${darkerPrimaryColor.value} 100%)`,
  boxShadow: `0 4px 16px ${primaryColor.value}30`
}))

// Computed
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const agentName = computed(() => {
  return props.config.agentConfig?.name || 'Assistant'
})

const agentTitle = computed(() => {
  return props.config.agentConfig?.title || 'Conseiller Commercial'
})

const agentAvatar = computed(() => {
  if (props.config.agentConfig?.avatar) {
    return props.config.agentConfig.avatar
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${primaryColor.value.replace('#', '')}&color=fff&size=128`
})

const productInfo = computed(() => {
  if (props.config.productName || props.config.productPrice) {
    return {
      name: props.config.productName,
      price: props.config.productPrice,
      url: props.config.productUrl,
      id: props.config.productId
    }
  }
  return null
})

const showQuickActions = computed(() => {
  return messages.value.length === 0 && !isTyping.value && !isLoading.value
})

const inputPlaceholder = computed(() => {
  return t('typeMessage')
})

const quickActions = computed(() => ({
  buyNow: t('wantToBuyNow'),
  haveQuestions: t('haveQuestions'),
  wantToKnowMore: t('wantToKnowMore')
}))

// Utilitaires couleurs
function adjustColor(color: string, percent: number): string {
  try {
    const hex = color.replace('#', '')
    if (hex.length !== 6) return color
    
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
    
    const toHex = (n: number) => n.toString(16).padStart(2, '0')
    
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
  } catch (error) {
    return color
  }
}

// Methods
const getTriggerButtonClasses = () => {
  return 'cs-modern-trigger'
}

const openChat = async () => {
  if (isOpen.value) return

  isOpen.value = true
  hasUnreadMessages.value = false
  errorMessage.value = null
  
  if (messages.value.length === 0) {
    await sendWelcomeMessage()
  }
  
  await nextTick()
  scrollToBottom()
}

const sendWelcomeMessage = async () => {
  try {
    const chatSeller = (window as any).ChatSeller
    if (!chatSeller) return

    const response = await chatSeller.sendMessage('', conversationId.value, {
      isFirstMessage: true,
      productInfo: {
        id: props.config.productId,
        name: props.config.productName,
        price: props.config.productPrice,
        url: props.config.productUrl
      }
    })
    
    if (response.success) {
      conversationId.value = response.data.conversationId
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
    }

  } catch (error: any) {
    console.error('❌ Erreur envoi message d\'accueil:', error)
    
    const welcomeMessage = productInfo.value?.name 
      ? `Bonjour ! 👋 Je suis ${agentName.value}.

Je vois que vous vous intéressez à **"${productInfo.value.name}"**. C'est un excellent choix ! 💫

Comment puis-je vous aider ? 😊`
      : props.config.agentConfig?.welcomeMessage || t('defaultWelcome')
      
    const fallbackMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
    messages.value.push(fallbackMessage)
  }
}

const closeChat = () => {
  isOpen.value = false
}

const closeChatOnOverlay = () => {
  if (!isMobile.value) {
    closeChat()
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value || isLoading.value) return

  const messageContent = currentMessage.value.trim()
  currentMessage.value = ''
  errorMessage.value = null

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
    const chatSeller = (window as any).ChatSeller
    if (!chatSeller) {
      throw new Error('ChatSeller SDK not available')
    }

    const response = await chatSeller.sendMessage(messageContent, conversationId.value, {
      productInfo: {
        id: props.config.productId,
        name: props.config.productName,
        price: props.config.productPrice,
        url: props.config.productUrl
      }
    })
    
    if (response.success) {
      if (response.data.conversationId) {
        conversationId.value = response.data.conversationId
      }

      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
      
    } else {
      throw new Error(response.error || 'Erreur lors de l\'envoi du message')
    }

  } catch (error: any) {
    console.error('❌ Erreur envoi message:', error)
    
    errorMessage.value = 'Désolé, une erreur est survenue. Veuillez réessayer.'
    lastFailedMessage.value = messageContent
    
    const fallbackMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: props.config.agentConfig?.fallbackMessage || 'Je transmets votre question à notre équipe, un conseiller vous recontactera bientôt.',
      timestamp: new Date()
    }
    messages.value.push(fallbackMessage)
    
  } finally {
    isTyping.value = false
    
    await nextTick()
    scrollToBottom()
  }
}

const sendQuickMessage = (message: string) => {
  currentMessage.value = message
  sendMessage()
}

const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="cs-bold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="cs-italic">$1</em>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="cs-link">$1</a>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
    .replace(/(\d+(?:[.,]\d{2})?\s*(?:FCFA|€|USD|\$))/g, '<span class="cs-price">$1</span>')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString(props.config.language || 'fr', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  const currency = 'XOF'
  
  return new Intl.NumberFormat(props.config.language || 'fr', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${primaryColor.value.replace('#', '')}&color=fff&size=128`
}

const scrollToBottom = () => {
  if (messagesEndRef.value) {
    messagesEndRef.value.scrollIntoView({ behavior: 'smooth' })
  }
}

// Watch for new messages to auto-scroll
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

onMounted(() => {
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_loaded', {
      productId: props.config.productId,
      productName: props.config.productName,
      agentConfigured: !!props.config.agentConfig
    })
  }
})
</script>

<style scoped>
/* ✅ BASE STYLES AVEC COULEURS DYNAMIQUES */
.cs-chatseller-widget,
.cs-chatseller-widget * {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ✅ STYLES COMMUNS */
.cs-chat-trigger-button {
  width: 100%;
  color: white;
  border: none;
  border-radius: 12px;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
}

.cs-chat-trigger-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.cs-button-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-chat-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2.5;
}

.cs-notification-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  background: #ff3b30;
  border-radius: 50%;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

/* Modal overlay */
.cs-chat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.cs-chat-modal-overlay.cs-mobile {
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
}

/* ✅ MOBILE CONTAINER (style WhatsApp avec couleurs dynamiques) */
.cs-mobile-container {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

@media (min-width: 768px) {
  .cs-mobile-container {
    width: 480px;
    height: 700px;
    max-height: 90vh;
    border-radius: 16px;
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
  }
}

.cs-mobile-header {
  color: white;
  padding: 16px 20px;
  flex-shrink: 0;
}

.cs-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-agent-avatar-container {
  position: relative;
}

.cs-agent-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.cs-online-indicator {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-radius: 50%;
}

.cs-agent-details {
  flex: 1;
}

.cs-agent-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.2;
}

.cs-agent-status {
  margin: 2px 0 0 0;
  font-size: 13px;
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: 4px;
}

.cs-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.cs-close-button {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.cs-close-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Mobile product context */
.cs-mobile-product {
  border-bottom: 1px solid #e0e0e0;
  padding: 12px 20px;
  flex-shrink: 0;
}

.cs-product-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-product-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4a5568;
  font-size: 12px;
  font-weight: 500;
}

.cs-product-details {
  flex: 1;
}

.cs-product-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
}

.cs-product-price {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
}

/* Mobile messages */
.cs-mobile-messages {
  flex: 1;
  background: #e5ddd5;
  background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23f5f5f5' fill-opacity='0.1'%3E%3Cpath d='M20 20c0 6.627-5.373 12-12 12s-12-5.373-12-12 5.373-12 12-12 12 5.373 12 12zm-14-.828c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8c0 4.418-3.582 8-8 8zm4-8c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4z'/%3E%3C/g%3E%3C/svg%3E");
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-message-wrapper {
  display: flex;
  max-width: 100%;
}

.cs-assistant-wrapper {
  justify-content: flex-start;
}

.cs-user-wrapper {
  justify-content: flex-end;
}

.cs-message {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.cs-user-message {
  flex-direction: row-reverse;
}

.cs-message-avatar {
  flex-shrink: 0;
}

.cs-avatar-small {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.cs-message-content {
  flex: 1;
  min-width: 0;
}

.cs-message-bubble {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  word-wrap: break-word;
  position: relative;
  max-width: 100%;
}

.cs-assistant-bubble {
  background: white;
  color: #303030;
  border-radius: 8px 8px 8px 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-user-bubble {
  color: white;
  border-radius: 8px 8px 2px 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-message-text {
  margin-bottom: 4px;
}

.cs-message-time {
  font-size: 11px;
  color: #667781;
  text-align: right;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 2px;
}

.cs-message-check {
  width: 12px;
  height: 12px;
  color: #4fc3f7;
}

/* Typing indicator */
.cs-typing-bubble {
  background: white;
  padding: 12px 16px;
  border-radius: 8px 8px 8px 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.cs-typing-dot {
  width: 8px;
  height: 8px;
  background: #667781;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.cs-typing-dot:nth-child(1) { animation-delay: 0s; }
.cs-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.cs-typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* Mobile actions */
.cs-mobile-actions {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px 20px;
  flex-shrink: 0;
}

.cs-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.cs-quick-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cs-primary-action {
  color: white;
}

.cs-primary-action:hover {
  opacity: 0.9;
}

.cs-secondary-action:hover {
  background: #e0e0e0;
}

/* Mobile input */
.cs-mobile-input {
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.cs-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cs-input-wrapper {
  flex: 1;
}

.cs-message-field {
  width: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}

.cs-message-field:disabled {
  background: #f5f5f5;
  color: #999;
}

.cs-send-button {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cs-send-button:hover:not(:disabled) {
  transform: scale(1.05);
}

.cs-send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cs-loading-icon {
  animation: spin 1s linear infinite;
}

.cs-footer {
  text-align: center;
}

.cs-footer p {
  margin: 0;
  font-size: 11px;
  color: #667781;
}

/* ✅ DESKTOP CONTAINER INNOVANT */
.cs-desktop-container {
  width: 520px;
  height: 720px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Desktop header avec glassmorphism */
.cs-desktop-header {
  padding: 24px;
  flex-shrink: 0;
  position: relative;
}

.cs-header-glassmorphism {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cs-agent-presentation {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cs-agent-avatar-large {
  position: relative;
  width: 64px;
  height: 64px;
}

.cs-agent-avatar-large img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.cs-status-ring {
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border: 2px solid;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.cs-status-core {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 18px;
  height: 18px;
  border: 3px solid white;
  border-radius: 50%;
}

.cs-agent-intro {
  flex: 1;
}

.cs-agent-title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
}

.cs-agent-subtitle {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.cs-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.cs-status-pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.cs-close-button-desktop {
  background: rgba(0, 0, 0, 0.05);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #666;
}

.cs-close-button-desktop:hover {
  background: rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

/* Desktop product showcase */
.cs-product-showcase {
  margin: 0 24px;
  border-radius: 12px;
  padding: 16px;
  flex-shrink: 0;
}

.cs-product-highlight {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-product-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  color: white;
  font-size: 12px;
  font-weight: 600;
}

.cs-product-info {
  flex: 1;
  text-align: right;
}

.cs-product-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.cs-product-price-large {
  margin: 4px 0 0 0;
  font-size: 18px;
  font-weight: 700;
}

/* Desktop messages */
.cs-desktop-messages {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 50%);
}

.cs-message-item {
  display: flex;
  max-width: 100%;
}

.cs-assistant-item {
  justify-content: flex-start;
}

.cs-user-item {
  justify-content: flex-end;
}

.cs-desktop-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 80%;
}

.cs-user-desktop {
  flex-direction: row-reverse;
}

.cs-message-avatar-desktop {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.cs-message-avatar-desktop img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-user-avatar-desktop {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.cs-message-content-desktop {
  flex: 1;
  min-width: 0;
}

.cs-message-header-desktop {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.cs-user-desktop .cs-message-header-desktop {
  justify-content: flex-end;
}

.cs-sender-name {
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.cs-message-timestamp {
  font-size: 11px;
  color: #999;
}

.cs-typing-text {
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.cs-message-bubble-desktop {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  position: relative;
}

.cs-assistant-bubble-desktop {
  background: white;
  border: 1px solid #e2e8f0;
  color: #374151;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cs-user-bubble-desktop {
  color: white;
  border-bottom-right-radius: 4px;
}

.cs-message-text-desktop {
  word-wrap: break-word;
}

.cs-typing-bubble-desktop {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 12px 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cs-typing-indicator-desktop {
  display: flex;
  gap: 4px;
  align-items: center;
}

.cs-typing-dot-desktop {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.cs-typing-dot-desktop:nth-child(1) { animation-delay: 0s; }
.cs-typing-dot-desktop:nth-child(2) { animation-delay: 0.2s; }
.cs-typing-dot-desktop:nth-child(3) { animation-delay: 0.4s; }

/* Desktop actions */
.cs-desktop-actions {
  padding: 24px;
  flex-shrink: 0;
  background: linear-gradient(to top, #ffffff 0%, #f8fafc 100%);
}

.cs-actions-title {
  text-align: center;
  margin-bottom: 20px;
}

.cs-actions-title h4 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.cs-actions-title p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.cs-actions-grid-desktop {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.cs-action-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.cs-action-card:hover {
  transform: translateY(-2px);
}

.cs-primary-card:hover {
  transform: translateY(-4px);
}

.cs-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.cs-secondary-icon {
  color: white;
}

.cs-card-content {
  flex: 1;
}

.cs-card-content h5 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.cs-card-content p {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

/* Desktop input */
.cs-desktop-input {
  padding: 24px;
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.cs-input-sophisticated {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-input-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-input-field-container {
  flex: 1;
  position: relative;
}

.cs-message-field-desktop {
  width: 100%;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.cs-message-field-desktop:focus {
  background: white;
  border-color: currentColor;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
}

.cs-input-enhancement {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  border-radius: 1px;
  transform: translateX(-50%);
  transition: width 0.3s ease;
}

.cs-message-field-desktop:focus + .cs-input-enhancement {
  width: 100%;
}

.cs-send-button-desktop {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.cs-send-button-desktop:hover:not(:disabled) {
  transform: translateY(-2px);
}

.cs-send-button-desktop:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.cs-input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-footer-branding {
  font-size: 11px;
  color: #999;
}

.cs-privacy {
  font-size: 10px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Formatage des messages */
.cs-bold {
  font-weight: 600;
  color: inherit;
}

.cs-italic {
  font-style: italic;
  opacity: 0.9;
}

.cs-link {
  color: #1976d2;
  text-decoration: underline;
}

.cs-price {
  background: rgba(0, 150, 0, 0.1);
  color: #009600;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

/* Animations */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-10px); }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Transitions Vue.js */
.cs-fade-enter-active, .cs-fade-leave-active {
  transition: all 0.3s ease;
}
.cs-fade-enter-from, .cs-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.cs-modal-enter-active {
  transition: all 0.4s ease;
}
.cs-modal-leave-active {
  transition: all 0.3s ease;
}
.cs-modal-enter-from {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
.cs-modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(-20px);
}

/* Responsive */
@media (max-width: 640px) {
  .cs-message-field {
    font-size: 16px; /* Éviter le zoom sur iOS */
  }
}

/* Scrollbar */
.cs-desktop-messages::-webkit-scrollbar,
.cs-mobile-messages::-webkit-scrollbar {
  width: 6px;
}

.cs-desktop-messages::-webkit-scrollbar-track,
.cs-mobile-messages::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.cs-desktop-messages::-webkit-scrollbar-thumb,
.cs-mobile-messages::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

.cs-desktop-messages::-webkit-scrollbar-thumb:hover,
.cs-mobile-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.5);
}
</style>