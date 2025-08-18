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
        <!-- ✅ INTERFACE DESKTOP - Large et moderne -->
        <div 
          v-if="!isMobile"
          class="cs-chat-container-desktop"
          :style="containerStyles"
        >
          
          <!-- ✅ HEADER DESKTOP avec avatar, nom, titre -->
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

          <!-- ✅ SECTION PRODUIT - Nom et prix sans mention "produit consulté" -->
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

          <!-- ✅ ZONE DE CHAT - Plus grande pour desktop -->
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
                    <span>{{ agentName.charAt(0).toUpperCase() }}</span>
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

          <!-- ✅ RÉPONSES PRÉDÉFINIES - Affichées au début -->
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

          <!-- ✅ FOOTER INPUT avec micro et bouton d'envoi -->
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
                
                <!-- Bouton micro -->
                <button class="cs-voice-button" :style="{ color: primaryColor }">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/>
                  </svg>
                </button>
              </div>
              
              <!-- Bouton d'envoi -->
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
            
            <!-- Footer info -->
            <div class="cs-footer-info">
              <span>Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong></span>
              <span class="cs-security">🔒 Conversation sécurisée</span>
            </div>
          </div>
        </div>

        <!-- ✅ INTERFACE MOBILE - Plein écran -->
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

// Props
const props = defineProps<{
  config: any
}>()

// State
const isOpen = ref(true) // ✅ Ouvert par défaut pour le test
const messages = ref<Message[]>([])
const currentMessage = ref('')
const isTyping = ref(false)
const isLoading = ref(false)
const conversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement>()
const mobileMessagesContainer = ref<HTMLElement>()
const messagesEndRef = ref<HTMLElement>()
const mobileMessagesEndRef = ref<HTMLElement>()

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
  // ✅ CORRECTION: Utiliser le titre personnalisé s'il existe
  return props.config.agentConfig?.title || 'Conseiller commercial'
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

const primaryColor = computed(() => props.config.primaryColor || '#3B82F6')

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

// Methods
const sendWelcomeMessage = async () => {
  try {
    // ✅ GÉNÉRER MESSAGE D'ACCUEIL CONTEXTUEL AUTOMATIQUE
    let welcomeMessage = ''
    
    if (productInfo.value?.name) {
      welcomeMessage = `Bonjour ! 👋 Je suis ${agentName.value}, ${agentTitle.value}.

Je vois que vous vous intéressez à **"${productInfo.value.name}"**. C'est un excellent choix ! ✨

Comment puis-je vous aider ? 😊`
    } else {
      welcomeMessage = `Bonjour ! 👋 Je suis ${agentName.value}, ${agentTitle.value}.

Comment puis-je vous aider aujourd'hui ? 😊`
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
    // ✅ APPEL À L'API RÉELLE (sera corrigé dans la prochaine étape)
    const chatSeller = (window as any).ChatSeller
    if (chatSeller) {
      const response = await chatSeller.sendMessage(messageContent, conversationId.value, {
        productInfo: productInfo.value
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
      } else {
        throw new Error('Erreur API')
      }
    } else {
      // Fallback temporaire
      throw new Error('SDK non disponible')
    }

  } catch (error: any) {
    console.error('❌ Erreur envoi message:', error)
    
    // ✅ RÉPONSE SIMULÉE INTELLIGENTE
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

const sendQuickReply = (replyText: string) => {
  currentMessage.value = replyText
  sendMessage()
}

// ✅ RÉPONSE SIMULÉE INTELLIGENTE EN ATTENDANT L'IA
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
  
  // Réponse générique engageante
  return `Merci pour votre question ! 😊

Je vous mets en relation avec notre équipe pour vous donner les informations les plus précises sur **${productName}**.

Y a-t-il autre chose que je puisse vous aider en attendant ? 💬`
}

const closeChat = () => {
  isOpen.value = false
  // Emit event to parent
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
  // ✅ ENVOYER MESSAGE D'ACCUEIL AUTOMATIQUEMENT
  sendWelcomeMessage()
})
</script>

<style scoped>
/* ✅ BASE STYLES ISOLÉS */
.cs-chatseller-widget,
.cs-chatseller-widget * {
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* ✅ MODAL OVERLAY */
.cs-chat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
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

/* ✅ CONTAINER DESKTOP - Plus large */
.cs-chat-container-desktop {
  width: 520px; /* ✅ Plus large que 480px */
  height: 680px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* ✅ HEADER DESKTOP */
.cs-desktop-header {
  padding: 24px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cs-agent-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cs-agent-avatar {
  position: relative;
  width: 56px;
  height: 56px;
}

.cs-avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.cs-status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 16px;
  height: 16px;
  border: 3px solid white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.cs-agent-details {
  flex: 1;
}

.cs-agent-name {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: white;
  letter-spacing: -0.02em;
}

.cs-agent-title {
  margin: 4px 0 8px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.cs-status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cs-close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

/* ✅ SECTION PRODUIT */
.cs-product-section {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.cs-product-details {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cs-product-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  flex: 1;
}

.cs-product-price {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  margin-left: 16px;
}

/* ✅ ZONE DE CHAT DESKTOP - Plus grande */
.cs-messages-area-desktop {
  flex: 1;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
  overflow-y: auto;
  padding: 24px;
}

.cs-messages-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.cs-message-item {
  display: flex;
  max-width: 100%;
}

.cs-assistant-message {
  justify-content: flex-start;
}

.cs-user-message {
  justify-content: flex-end;
}

.cs-assistant-bubble {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
}

.cs-user-bubble {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  max-width: 85%;
  flex-direction: row-reverse;
}

.cs-message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.cs-message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-user-avatar {
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

.cs-message-content {
  flex: 1;
  min-width: 0;
}

.cs-message-text {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  margin-bottom: 4px;
}

.cs-user-message .cs-message-text {
  background: linear-gradient(135deg, var(--primary-color, #3B82F6) 0%, var(--primary-dark, #2563EB) 100%);
  color: white;
  border: none;
}

.cs-message-time {
  font-size: 11px;
  color: #9ca3af;
  padding: 0 4px;
}

/* ✅ TYPING INDICATOR */
.cs-typing-content {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.cs-typing-indicator {
  display: flex;
  gap: 4px;
}

.cs-typing-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.cs-typing-dot:nth-child(1) { animation-delay: 0s; }
.cs-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.cs-typing-dot:nth-child(3) { animation-delay: 0.4s; }

.cs-typing-text {
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

/* ✅ RÉPONSES RAPIDES DESKTOP */
.cs-quick-replies-desktop {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
}

.cs-replies-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.cs-quick-reply-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 2px solid;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.cs-quick-reply-btn:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.cs-reply-icon {
  font-size: 16px;
}

/* ✅ INPUT SECTION DESKTOP */
.cs-input-section-desktop {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
}

.cs-input-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.cs-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 16px;
  transition: all 0.2s;
}

.cs-input-wrapper:focus-within {
  background: white;
  border-color: var(--primary-color, #3B82F6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.cs-message-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 14px 0;
  font-size: 14px;
  color: #374151;
}

.cs-voice-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.cs-voice-button:hover {
  background: rgba(59, 130, 246, 0.1);
}

.cs-send-button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 12px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cs-send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
}

.cs-send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cs-footer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: #9ca3af;
}

.cs-security {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ✅ MOBILE STYLES */
.cs-chat-container-mobile {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cs-mobile-header {
  padding: 16px 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.cs-mobile-agent-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cs-mobile-avatar {
  position: relative;
  width: 44px;
  height: 44px;
}

.cs-mobile-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.cs-mobile-status {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 14px;
  height: 14px;
  border: 2px solid white;
  border-radius: 50%;
}

.cs-mobile-details {
  flex: 1;
}

.cs-mobile-name {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.cs-mobile-title {
  margin: 2px 0 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
}

.cs-mobile-close {
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
}

.cs-mobile-product {
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.cs-mobile-product-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.cs-mobile-product-price {
  margin: 4px 0 0 0;
  font-size: 16px;
  font-weight: 700;
}

.cs-messages-area-mobile {
  flex: 1;
  background: #e5ddd5;
  overflow-y: auto;
  padding: 20px;
}

.cs-mobile-messages-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cs-mobile-message {
  display: flex;
  max-width: 100%;
}

.cs-mobile-assistant {
  justify-content: flex-start;
}

.cs-mobile-user {
  justify-content: flex-end;
}

.cs-mobile-assistant-bubble {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}

.cs-mobile-user-bubble {
  max-width: 85%;
}

.cs-mobile-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.cs-mobile-message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cs-mobile-bubble-content {
  background: white;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-mobile-user .cs-mobile-bubble-content {
  background: linear-gradient(135deg, var(--primary-color, #3B82F6) 0%, var(--primary-dark, #2563EB) 100%);
  color: white;
  border-radius: 8px 8px 2px 8px;
}

.cs-mobile-assistant .cs-mobile-bubble-content {
  border-radius: 8px 8px 8px 2px;
}

.cs-mobile-message-text {
  margin-bottom: 4px;
}

.cs-mobile-message-time {
  font-size: 11px;
  color: #667781;
  text-align: right;
}

.cs-mobile-typing {
  background: white;
  border-radius: 8px 8px 8px 2px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.cs-mobile-typing-dots {
  display: flex;
  gap: 4px;
}

.cs-mobile-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: typing 1.4s infinite;
}

.cs-quick-replies-mobile {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 16px 20px;
  flex-shrink: 0;
}

.cs-mobile-replies-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.cs-mobile-quick-reply {
  padding: 12px 16px;
  border: 1px solid;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  transition: all 0.2s;
}

.cs-mobile-input-section {
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  flex-shrink: 0;
}

.cs-mobile-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.cs-mobile-message-input {
  flex: 1;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 14px;
  outline: none;
}

.cs-mobile-voice,
.cs-mobile-send {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.cs-mobile-voice {
  background: #f8f9fa;
}

.cs-mobile-send {
  color: white;
}

.cs-mobile-footer {
  text-align: center;
  font-size: 11px;
  color: #667781;
}

/* ✅ ANIMATIONS */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.cs-loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ✅ TRANSITIONS */
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

/* ✅ SCROLLBAR */
.cs-messages-area-desktop::-webkit-scrollbar,
.cs-messages-area-mobile::-webkit-scrollbar {
  width: 6px;
}

.cs-messages-area-desktop::-webkit-scrollbar-track,
.cs-messages-area-mobile::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.cs-messages-area-desktop::-webkit-scrollbar-thumb,
.cs-messages-area-mobile::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 3px;
}

/* ✅ RESPONSIVE */
@media (max-width: 640px) {
  .cs-chat-container-desktop {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>