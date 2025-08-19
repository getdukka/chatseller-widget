<template>
  <div class="cs-chatseller-widget">
    <!-- ✅ MODAL OVERLAY AVEC GESTION MOBILE/DESKTOP -->
    <Transition name="cs-modal">
      <div
        v-if="isOpen"
        class="cs-chat-modal-overlay"
        :class="{ 'cs-mobile': isMobile }"
        @click.self="closeChatOnOverlay"
      >
        <!-- ✅ INTERFACE DESKTOP -->
        <div 
          v-if="!isMobile"
          class="cs-chat-container-desktop"
          :style="containerStyles"
        >
          
          <!-- ✅ HEADER DESKTOP -->
          <div class="cs-desktop-header" :style="headerStyles">
            <div class="cs-agent-info">
              <div class="cs-agent-avatar">
                <img
                  :src="agentAvatar"
                  :alt="agentName"
                  class="cs-avatar-image"
                  @error="handleAvatarError"
                >
                <div class="cs-status-indicator" :style="{ backgroundColor: primaryColor }"></div>
              </div>
              <div class="cs-agent-details">
                <h3 class="cs-agent-name">{{ agentName }}</h3>
                <p class="cs-agent-title">{{ agentTitle }}</p>
                <div class="cs-status-badge">
                  <span class="cs-status-dot" :style="{ backgroundColor: primaryColor }"></span>
                  En ligne maintenant
                </div>
              </div>
            </div>
            
            <button @click="closeChat" class="cs-close-button">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- ✅ SECTION PRODUIT -->
          <div
            v-if="productInfo"
            class="cs-product-section"
            :style="productSectionStyles"
          >
            <div class="cs-product-details">
              <h4 class="cs-product-name">{{ productInfo.name }}</h4>
              <p v-if="productInfo.price" class="cs-product-price" :style="{ color: primaryColor }">
                {{ formatPrice(productInfo.price) }}
              </p>
            </div>
          </div>

          <!-- ✅ ZONE DE CHAT -->
          <div ref="messagesContainer" class="cs-messages-area-desktop">
            <div class="cs-messages-list">
              <div
                v-for="message in messages"
                :key="message.id"
                class="cs-message-item"
                :class="message.role === 'user' ? 'cs-user-message' : 'cs-assistant-message'"
              >
                
                <!-- Message assistant -->
                <div v-if="message.role === 'assistant'" class="cs-assistant-bubble">
                  <div class="cs-message-avatar">
                    <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                  </div>
                  <div class="cs-message-content">
                    <div class="cs-message-text" v-html="formatMessage(message.content)"></div>
                    <div class="cs-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>

                <!-- Message utilisateur -->
                <div v-else class="cs-user-bubble">
                  <div class="cs-message-content">
                    <div class="cs-message-text">{{ message.content }}</div>
                    <div class="cs-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                  <div class="cs-user-avatar" :style="{ backgroundColor: primaryColor }">
                    <span>{{ getUserInitial() }}</span>
                  </div>
                </div>
              </div>

              <!-- Indicateur de frappe -->
              <div v-if="isTyping" class="cs-message-item cs-assistant-message">
                <div class="cs-assistant-bubble">
                  <div class="cs-message-avatar">
                    <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                  </div>
                  <div class="cs-typing-content">
                    <div class="cs-typing-indicator">
                      <div class="cs-typing-dot" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-typing-dot" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-typing-dot" :style="{ backgroundColor: primaryColor }"></div>
                    </div>
                    <div class="cs-typing-text">{{ agentName }} écrit...</div>
                  </div>
                </div>
              </div>

              <div ref="messagesEndRef" />
            </div>
          </div>

          <!-- ✅ RÉPONSES PRÉDÉFINIES -->
          <div v-if="showQuickReplies" class="cs-quick-replies-desktop">
            <div class="cs-replies-grid">
              <button
                v-for="reply in quickReplies"
                :key="reply.id"
                @click="sendQuickReply(reply.text)"
                class="cs-quick-reply-btn"
                :style="quickReplyStyles"
              >
                <span class="cs-reply-icon">{{ reply.icon }}</span>
                <span class="cs-reply-text">{{ reply.text }}</span>
              </button>
            </div>
          </div>

          <!-- ✅ FOOTER INPUT -->
          <div class="cs-input-section-desktop">
            <div class="cs-input-container">
              <div class="cs-input-wrapper">
                <input
                  v-model="currentMessage"
                  @keypress.enter="sendMessage"
                  :placeholder="inputPlaceholder"
                  class="cs-message-input"
                  :disabled="isTyping || isLoading"
                />
                
                <button class="cs-voice-button" :style="{ color: primaryColor }">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </button>
              </div>
              
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping || isLoading"
                class="cs-send-button"
                :style="sendButtonStyles"
              >
                <svg v-if="!isTyping" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <svg v-else class="cs-loading-icon" width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
            
            <div class="cs-footer-info">
              <span>Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong></span>
              <span class="cs-security">🔒 Conversation sécurisée</span>
            </div>
          </div>
        </div>

        <!-- ✅ INTERFACE MOBILE -->
        <div 
          v-else
          class="cs-chat-container-mobile"
        >
          
          <!-- Header Mobile -->
          <div class="cs-mobile-header" :style="headerStyles">
            <div class="cs-mobile-agent-info">
              <div class="cs-mobile-avatar">
                <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                <div class="cs-mobile-status" :style="{ backgroundColor: primaryColor }"></div>
              </div>
              <div class="cs-mobile-details">
                <h3 class="cs-mobile-name">{{ agentName }}</h3>
                <p class="cs-mobile-title">{{ agentTitle }}</p>
              </div>
            </div>
            
            <button @click="closeChat" class="cs-mobile-close">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- Section produit mobile -->
          <div v-if="productInfo" class="cs-mobile-product" :style="productSectionStyles">
            <h4 class="cs-mobile-product-name">{{ productInfo.name }}</h4>
            <p v-if="productInfo.price" class="cs-mobile-product-price" :style="{ color: primaryColor }">
              {{ formatPrice(productInfo.price) }}
            </p>
          </div>

          <!-- Messages mobile -->
          <div ref="mobileMessagesContainer" class="cs-messages-area-mobile">
            <div class="cs-mobile-messages-list">
              <div
                v-for="message in messages"
                :key="message.id"
                class="cs-mobile-message"
                :class="message.role === 'user' ? 'cs-mobile-user' : 'cs-mobile-assistant'"
              >
                
                <div v-if="message.role === 'assistant'" class="cs-mobile-assistant-bubble">
                  <div class="cs-mobile-message-avatar">
                    <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                  </div>
                  <div class="cs-mobile-bubble-content">
                    <div class="cs-mobile-message-text" v-html="formatMessage(message.content)"></div>
                    <div class="cs-mobile-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>

                <div v-else class="cs-mobile-user-bubble">
                  <div class="cs-mobile-bubble-content">
                    <div class="cs-mobile-message-text">{{ message.content }}</div>
                    <div class="cs-mobile-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>
              </div>

              <!-- Typing mobile -->
              <div v-if="isTyping" class="cs-mobile-message cs-mobile-assistant">
                <div class="cs-mobile-assistant-bubble">
                  <div class="cs-mobile-message-avatar">
                    <img :src="agentAvatar" :alt="agentName" @error="handleAvatarError">
                  </div>
                  <div class="cs-mobile-typing">
                    <div class="cs-mobile-typing-dots">
                      <div class="cs-mobile-dot" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-mobile-dot" :style="{ backgroundColor: primaryColor }"></div>
                      <div class="cs-mobile-dot" :style="{ backgroundColor: primaryColor }"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div ref="mobileMessagesEndRef" />
            </div>
          </div>

          <!-- Réponses rapides mobile -->
          <div v-if="showQuickReplies" class="cs-quick-replies-mobile">
            <div class="cs-mobile-replies-grid">
              <button
                v-for="reply in quickReplies"
                :key="reply.id"
                @click="sendQuickReply(reply.text)"
                class="cs-mobile-quick-reply"
                :style="{ borderColor: primaryColor, color: primaryColor }"
              >
                {{ reply.icon }} {{ reply.text }}
              </button>
            </div>
          </div>

          <!-- Input mobile -->
          <div class="cs-mobile-input-section">
            <div class="cs-mobile-input-container">
              <input
                v-model="currentMessage"
                @keypress.enter="sendMessage"
                :placeholder="inputPlaceholder"
                class="cs-mobile-message-input"
                :disabled="isTyping || isLoading"
              />
              <button class="cs-mobile-voice" :style="{ color: primaryColor }">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                </svg>
              </button>
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping"
                class="cs-mobile-send"
                :style="{ backgroundColor: primaryColor }"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
            </div>
            
            <div class="cs-mobile-footer">
              <span>Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong> • 🔒 Sécurisé</span>
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

// ✅ PROPS CORRIGÉES AVEC VALEURS PAR DÉFAUT
interface Props {
  config?: {
    shopId?: string
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
      name: 'Assistant',
      title: 'Conseiller commercial'
    },
    primaryColor: '#3B82F6',
    buttonText: 'Parler à un conseiller',
    language: 'fr'
  })
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface QuickReply {
  id: string
  text: string
  icon: string
}

// State
const isOpen = ref(true)
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const isLoading = ref(false)
const conversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement>()
const mobileMessagesContainer = ref<HTMLElement>()
const messagesEndRef = ref<HTMLElement>()
const mobileMessagesEndRef = ref<HTMLElement>()

// ✅ COMPUTED AVEC SÉCURITÉ
const configData = computed(() => props.config || {})

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const agentName = computed(() => {
  return configData.value.agentConfig?.name || 'Assistant'
})

const agentTitle = computed(() => {
  return configData.value.agentConfig?.title || 'Conseiller commercial'
})

const agentAvatar = computed(() => {
  if (configData.value.agentConfig?.avatar) {
    return configData.value.agentConfig.avatar
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${primaryColor.value.replace('#', '')}&color=fff&size=128`
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

const primaryColor = computed(() => configData.value.primaryColor || '#3B82F6')

const showQuickReplies = computed(() => {
  return messages.value.length <= 1 && !isTyping.value
})

const inputPlaceholder = computed(() => {
  return 'Tapez votre message...'
})

// ✅ RÉPONSES PRÉDÉFINIES CONTEXTUELLES
const quickReplies = computed<QuickReply[]>(() => {
  const baseReplies = [
    { id: 'buy', text: 'Je veux l\'acheter maintenant', icon: '🛒' },
    { id: 'questions', text: 'J\'ai des questions', icon: '❓' },
    { id: 'info', text: 'Je veux en savoir plus', icon: '💡' }
  ]

  if (productInfo.value) {
    return [
      { id: 'buy', text: 'Je veux l\'acheter maintenant', icon: '🛒' },
      { id: 'questions', text: 'J\'ai des questions sur ce produit', icon: '❓' },
      { id: 'details', text: 'Quels sont les détails ?', icon: '📋' }
    ]
  }

  return baseReplies
})

// Styles computed
const containerStyles = computed(() => ({
  backgroundColor: 'white',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
}))

const headerStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${adjustColor(primaryColor.value, -20)} 100%)`
}))

const productSectionStyles = computed(() => ({
  background: `linear-gradient(135deg, ${adjustColor(primaryColor.value, 90)} 0%, ${adjustColor(primaryColor.value, 80)} 100%)`,
  borderColor: adjustColor(primaryColor.value, 60)
}))

const quickReplyStyles = computed(() => ({
  borderColor: primaryColor.value,
  color: primaryColor.value
}))

const sendButtonStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${adjustColor(primaryColor.value, -15)} 100%)`
}))

// ✅ MÉTHODE AMÉLIORÉE : Envoi du message d'accueil
const sendWelcomeMessage = async () => {
  try {
    let welcomeMessage = ''
    
    // ✅ UTILISER LE WELCOMEMESSAGE DE LA CONFIG
    if (configData.value.agentConfig?.welcomeMessage) {
      welcomeMessage = configData.value.agentConfig.welcomeMessage
    } else {
      // ✅ GÉNÉRER MESSAGE CONTEXTUEL
      if (productInfo.value?.name) {
        welcomeMessage = `Bonjour ! 👋 Je suis ${agentName.value}, ${agentTitle.value}.

Je vois que vous vous intéressez à **"${productInfo.value.name}"**. C'est un excellent choix ! ✨

Comment puis-je vous aider ? 😊`
      } else {
        welcomeMessage = `Bonjour ! 👋 Je suis ${agentName.value}, ${agentTitle.value}.

Comment puis-je vous aider aujourd'hui ? 😊`
      }
    }

    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date()
    }
    messages.value.push(aiMessage)

  } catch (error: any) {
    console.error('❌ Erreur message d\'accueil:', error)
  }
}

// ✅ MÉTHODE AMÉLIORÉE : Envoi de message
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
    // ✅ APPEL API AVEC CONFIG CORRECTE
    const response = await sendApiMessage(messageContent)
    
    if (response.success) {
      conversationId.value = response.data.conversationId
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
    } else {
      throw new Error('Erreur API')
    }

  } catch (error: any) {
    console.error('❌ Erreur envoi message:', error)
    
    // ✅ RÉPONSE SIMULÉE
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
  }
}

// ✅ NOUVELLE MÉTHODE : Appel API structuré
const sendApiMessage = async (message: string) => {
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
    isFirstMessage: messages.value.length <= 2
  }

  const response = await fetch(`${configData.value.apiUrl}/public/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`)
  }

  return await response.json()
}

const sendQuickReply = (replyText: string) => {
  currentMessage.value = replyText
  sendMessage()
}

// ✅ RÉPONSE SIMULÉE INTELLIGENTE
const getIntelligentResponse = (message: string): string => {
  const msg = message.toLowerCase()
  const productName = productInfo.value?.name || 'ce produit'
  const productPrice = productInfo.value?.price
  
  if (msg.includes('acheter') || msg.includes('commander') || msg.includes('maintenant')) {
    return `Parfait ! Je vais vous aider à commander **${productName}**. 🎉

**Combien d'exemplaires** souhaitez-vous ? 

Je vous guiderai ensuite pour finaliser votre commande rapidement ! ✨`
  }
  
  if (msg.includes('question') || msg.includes('détail') || msg.includes('info')) {
    return `Bien sûr ! Je suis là pour répondre à toutes vos questions sur **${productName}**. 💡

Que souhaitez-vous savoir exactement ? 
- Les caractéristiques ?
- Les conditions de livraison ?
- Autre chose ?

N'hésitez pas ! 😊`
  }
  
  if (msg.includes('prix') || msg.includes('coût') || msg.includes('tarif')) {
    if (productPrice) {
      return `Le prix de **${productName}** est de **${productPrice} FCFA**. 💰

C'est un excellent rapport qualité-prix ! 

Souhaitez-vous passer commande ? 🛒`
    }
    return `Je vérifie le prix pour vous... Un instant ! ⏳`
  }
  
  return `Merci pour votre question ! 😊

Je vous mets en relation avec notre équipe pour vous donner les informations les plus précises sur **${productName}**.

Y a-t-il autre chose que je puisse vous aider en attendant ? 💬`
}

const closeChat = () => {
  isOpen.value = false
  // ✅ Fermer via le parent si possible
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    (window as any).ChatSeller.destroy()
  }
}

const closeChatOnOverlay = () => {
  if (!isMobile.value) {
    closeChat()
  }
}

const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
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

const getUserInitial = () => {
  return 'V' // V pour Visiteur
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${primaryColor.value.replace('#', '')}&color=fff&size=128`
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
  } catch (error) {
    return color
  }
}

const scrollToBottom = () => {
  const container = isMobile.value ? mobileMessagesContainer.value : messagesContainer.value
  const endRef = isMobile.value ? mobileMessagesEndRef.value : messagesEndRef.value
  
  if (endRef) {
    endRef.scrollIntoView({ behavior: 'smooth' })
  }
}

// Watch messages pour auto-scroll
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

onMounted(() => {
  console.log('🎨 Composant Vue monté avec config:', configData.value)
  sendWelcomeMessage()
})
</script>

<style scoped>
/* ✅ RESET ET ISOLATION ABSOLUE POUR SHOPIFY */
.cs-chatseller-widget,
.cs-chatseller-widget *,
.cs-chatseller-widget *::before,
.cs-chatseller-widget *::after {
  all: unset !important;
  box-sizing: border-box !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
  line-height: normal !important;
}

/* ✅ CONTENEUR PRINCIPAL */
.cs-chatseller-widget {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 2147483647 !important;
  font-size: 14px !important;
  color: #374151 !important;
  font-weight: normal !important;
  text-align: left !important;
}

/* ✅ OVERLAY MODAL */
.cs-chat-modal-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  background: rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(8px) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 16px !important;
}

.cs-chat-modal-overlay.cs-mobile {
  padding: 0 !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}

/* ✅ CONTAINER DESKTOP */
.cs-chat-container-desktop {
  width: 520px !important;
  height: 680px !important;
  max-height: 90vh !important;
  background: white !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  position: relative !important;
}

/* ✅ CONTAINER MOBILE */
.cs-chat-container-mobile {
  width: 100% !important;
  height: 100% !important;
  background: white !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* ✅ HEADER DESKTOP */
.cs-desktop-header {
  padding: 24px !important;
  color: white !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-shrink: 0 !important;
  background: linear-gradient(135deg, #E91E63 0%, #C2185B 100%) !important;
}

.cs-mobile-header {
  padding: 16px 20px !important;
  color: white !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  flex-shrink: 0 !important;
  background: linear-gradient(135deg, #E91E63 0%, #C2185B 100%) !important;
}

/* ✅ SECTION PRODUIT */
.cs-product-section,
.cs-mobile-product {
  padding: 16px 20px !important;
  background: linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%) !important;
  border-bottom: 1px solid #e2e8f0 !important;
  flex-shrink: 0 !important;
}

/* ✅ AREA MESSAGES */
.cs-messages-area-desktop {
  flex: 1 !important;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%) !important;
  overflow-y: auto !important;
  padding: 24px !important;
}

.cs-messages-area-mobile {
  flex: 1 !important;
  background: #f5f5f5 !important;
  overflow-y: auto !important;
  padding: 20px !important;
}

/* ✅ LISTE DES MESSAGES */
.cs-messages-list,
.cs-mobile-messages-list {
  display: flex !important;
  flex-direction: column !important;
  gap: 20px !important;
  min-height: 100% !important;
}

/* ✅ MESSAGE ITEMS */
.cs-message-item,
.cs-mobile-message {
  display: flex !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
}

.cs-assistant-message,
.cs-mobile-assistant {
  justify-content: flex-start !important;
}

.cs-user-message,
.cs-mobile-user {
  justify-content: flex-end !important;
}

/* ✅ BULLES DE MESSAGE */
.cs-assistant-bubble,
.cs-mobile-assistant-bubble {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  max-width: 85% !important;
}

.cs-user-bubble,
.cs-mobile-user-bubble {
  display: flex !important;
  align-items: flex-start !important;
  gap: 12px !important;
  max-width: 85% !important;
  flex-direction: row-reverse !important;
}

/* ✅ AVATARS */
.cs-message-avatar,
.cs-mobile-message-avatar {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  overflow: hidden !important;
  flex-shrink: 0 !important;
}

.cs-message-avatar img,
.cs-mobile-message-avatar img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}

.cs-user-avatar {
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  background: #E91E63 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: white !important;
  font-weight: 600 !important;
  font-size: 16px !important;
  flex-shrink: 0 !important;
}

/* ✅ CONTENU DES MESSAGES */
.cs-message-content,
.cs-mobile-bubble-content {
  flex: 1 !important;
  min-width: 0 !important;
}

.cs-message-text,
.cs-mobile-message-text {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  padding: 12px 16px !important;
  font-size: 14px !important;
  line-height: 1.5 !important;
  word-wrap: break-word !important;
  margin-bottom: 4px !important;
  color: #374151 !important;
}

.cs-user-message .cs-message-text,
.cs-mobile-user .cs-mobile-message-text {
  background: linear-gradient(135deg, #E91E63 0%, #C2185B 100%) !important;
  color: white !important;
  border: none !important;
}

.cs-message-time,
.cs-mobile-message-time {
  font-size: 11px !important;
  color: #9ca3af !important;
  padding: 0 4px !important;
}

/* ✅ TYPING INDICATOR */
.cs-typing-content,
.cs-mobile-typing {
  background: white !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 16px !important;
  padding: 12px 16px !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.cs-typing-indicator,
.cs-mobile-typing-dots {
  display: flex !important;
  gap: 4px !important;
}

.cs-typing-dot,
.cs-mobile-dot {
  width: 8px !important;
  height: 8px !important;
  background: #E91E63 !important;
  border-radius: 50% !important;
  animation: typing 1.4s infinite !important;
}

.cs-typing-dot:nth-child(1) { animation-delay: 0s !important; }
.cs-typing-dot:nth-child(2) { animation-delay: 0.2s !important; }
.cs-typing-dot:nth-child(3) { animation-delay: 0.4s !important; }

/* ✅ SECTION INPUT */
.cs-input-section-desktop,
.cs-mobile-input-section {
  padding: 20px !important;
  border-top: 1px solid #e2e8f0 !important;
  background: white !important;
  flex-shrink: 0 !important;
}

.cs-input-container,
.cs-mobile-input-container {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
  margin-bottom: 12px !important;
}

.cs-input-wrapper {
  flex: 1 !important;
  display: flex !important;
  align-items: center !important;
  background: #f8fafc !important;
  border: 2px solid #e2e8f0 !important;
  border-radius: 12px !important;
  padding: 0 16px !important;
  transition: all 0.2s !important;
}

.cs-input-wrapper:focus-within {
  background: white !important;
  border-color: #E91E63 !important;
  box-shadow: 0 0 0 3px rgba(233, 30, 99, 0.1) !important;
}

.cs-message-input,
.cs-mobile-message-input {
  flex: 1 !important;
  background: transparent !important;
  border: none !important;
  outline: none !important;
  padding: 14px 0 !important;
  font-size: 14px !important;
  color: #374151 !important;
  font-family: inherit !important;
}

.cs-send-button,
.cs-mobile-send {
  width: 48px !important;
  height: 48px !important;
  background: linear-gradient(135deg, #E91E63 0%, #C2185B 100%) !important;
  border: none !important;
  border-radius: 12px !important;
  color: white !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
  flex-shrink: 0 !important;
}

.cs-send-button:hover:not(:disabled),
.cs-mobile-send:hover:not(:disabled) {
  transform: translateY(-2px) !important;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
}

.cs-send-button:disabled,
.cs-mobile-send:disabled {
  opacity: 0.5 !important;
  cursor: not-allowed !important;
}

/* ✅ BOUTON CLOSE */
.cs-close-button,
.cs-mobile-close {
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  color: white !important;
  width: 40px !important;
  height: 40px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s !important;
}

.cs-close-button:hover,
.cs-mobile-close:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  transform: rotate(90deg) !important;
}

/* ✅ SCROLLBAR */
.cs-messages-area-desktop::-webkit-scrollbar,
.cs-messages-area-mobile::-webkit-scrollbar {
  width: 6px !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-track,
.cs-messages-area-mobile::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1) !important;
}

.cs-messages-area-desktop::-webkit-scrollbar-thumb,
.cs-messages-area-mobile::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3) !important;
  border-radius: 3px !important;
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
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.cs-modal-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.cs-modal-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cs-modal-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(20px);
}

.cs-modal-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-20px);
}
</style>