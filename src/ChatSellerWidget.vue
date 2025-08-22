<template>
  <div class="cs-chatseller-widget">
    <!-- ✅ MODAL OVERLAY RESPONSIVE -->
    <Transition name="cs-modal">
      <div
        v-if="isOpen"
        class="cs-chat-modal-overlay"
        :class="{ 'cs-mobile': isMobile }"
        @click.self="closeChatOnOverlay"
      >
        <!-- ✅ INTERFACE DESKTOP MODERNE -->
        <div 
          v-if="!isMobile"
          class="cs-chat-container-desktop"
          :style="containerStyles"
        >
          
          <!-- ✅ HEADER CONFORME CAPTURES 5 & 6 AVEC TITRE DYNAMIQUE -->
          <div class="cs-desktop-header" :style="headerStyles">
            <div class="cs-agent-info">
              <div class="cs-agent-avatar">
                <img
                  :src="agentAvatar"
                  :alt="agentFullName"
                  class="cs-avatar-image"
                  @error="handleAvatarError"
                >
                <div class="cs-status-indicator" :style="{ backgroundColor: '#00D26A' }"></div>
              </div>
              <div class="cs-agent-details">
                <!-- ✅ CORRECTION MAJEURE : Titre dynamique avec nom + titre -->
                <h3 class="cs-agent-name">{{ agentFullName }}</h3>
                <p class="cs-agent-status">
                  <span class="cs-status-dot" :style="{ backgroundColor: '#00D26A' }"></span>
                  En ligne
                  <span v-if="productInfo" class="cs-product-info-header">
                    • {{ productInfo.name }}{{ productInfo.price ? ` • ${formatPrice(productInfo.price)}` : '' }}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="cs-header-actions">
              <!-- ✅ NOUVEAU : Bouton reset conversation -->
              <button @click="resetConversation" class="cs-action-button" title="Recommencer la conversation">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
              <button @click="closeChat" class="cs-close-button">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- ✅ ZONE DE CHAT MODERNE -->
          <div ref="messagesContainer" class="cs-messages-area-desktop">
            <div class="cs-messages-list">
              
              <!-- Messages -->
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
                    <div class="cs-message-text cs-assistant-text" v-html="formatMessage(message.content)"></div>
                    <div class="cs-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>

                <!-- Message utilisateur -->
                <div v-else class="cs-user-bubble">
                  <div class="cs-message-content">
                    <div class="cs-message-text cs-user-text">{{ message.content }}</div>
                    <div class="cs-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                  <div class="cs-user-avatar">V</div>
                </div>
              </div>

              <!-- Indicateur de frappe moderne -->
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
                  </div>
                </div>
              </div>

              <div ref="messagesEndRef" />
            </div>
          </div>

          <!-- ✅ INPUT MODERNE CONFORME CAPTURES 5 & 6 -->
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
                
                <button
                  @click="handleVoiceMessage"
                  class="cs-voice-button"
                  title="Message vocal"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                </button>
                
                <button
                  @click="sendMessage"
                  :disabled="!currentMessage.trim() || isTyping || isLoading"
                  class="cs-send-button"
                  :style="sendButtonStyles"
                >
                  <svg v-if="!isTyping" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                  </svg>
                  <div v-else class="cs-loading-spinner" :style="{ borderTopColor: primaryColor }"></div>
                </button>
              </div>
            </div>
            
            <!-- ✅ FOOTER CONFORME CAPTURES 5 & 6 -->
            <div class="cs-footer-info">
              <span class="cs-powered-by">Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong></span>
              <span class="cs-security">🔒 Conversations sécurisées</span>
            </div>
          </div>
        </div>

        <!-- ✅ INTERFACE MOBILE PLEIN ÉCRAN CONFORME CAPTURE 6 -->
        <div 
          v-else
          class="cs-chat-container-mobile"
        >
          
          <!-- Header Mobile -->
          <div class="cs-mobile-header" :style="headerStyles">
            <div class="cs-mobile-agent-info">
              <div class="cs-mobile-avatar">
                <img :src="agentAvatar" :alt="agentFullName" @error="handleAvatarError">
                <div class="cs-mobile-status" :style="{ backgroundColor: '#00D26A' }"></div>
              </div>
              <div class="cs-mobile-details">
                <!-- ✅ CORRECTION MAJEURE : Titre dynamique mobile -->
                <h3 class="cs-mobile-name">{{ agentFullName }}</h3>
                <p class="cs-mobile-status-text">
                  En ligne
                  <span v-if="productInfo" class="cs-mobile-product-info">
                    • {{ productInfo.name }}
                  </span>
                </p>
              </div>
            </div>
            
            <div class="cs-mobile-actions">
              <button @click="resetConversation" class="cs-mobile-reset" title="Recommencer">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
              <button @click="closeChat" class="cs-mobile-close">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
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
                    <div class="cs-mobile-message-text cs-mobile-assistant-text" v-html="formatMessage(message.content)"></div>
                    <div class="cs-mobile-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                </div>

                <div v-else class="cs-mobile-user-bubble">
                  <div class="cs-mobile-bubble-content">
                    <div class="cs-mobile-message-text cs-mobile-user-text">{{ message.content }}</div>
                    <div class="cs-mobile-message-time">{{ formatTime(message.timestamp) }}</div>
                  </div>
                  <div class="cs-mobile-user-avatar">V</div>
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
              
              <button
                @click="handleVoiceMessage"
                class="cs-mobile-voice"
                title="Message vocal"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
              </button>
              
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping"
                class="cs-mobile-send"
                :style="{ backgroundColor: primaryColor }"
              >
                <svg v-if="!isTyping" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <div v-else class="cs-mobile-loading-spinner" :style="{ borderTopColor: 'white' }"></div>
              </button>
            </div>
            
            <!-- ✅ FOOTER MOBILE CONFORME CAPTURE 6 -->
            <div class="cs-mobile-footer">
              <span class="cs-mobile-powered">Propulsé par <strong :style="{ color: primaryColor }">ChatSeller</strong></span>
              <span class="cs-mobile-security">🔒 Sécurisé</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'

// ✅ PROPS AVEC CONFIGURATION DYNAMIQUE
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
      name: 'Anna',
      title: 'Vendeuse IA'
    },
    primaryColor: '#EC4899', // ✅ Rose par défaut comme dans les captures
    buttonText: 'Parler à la vendeuse',
    language: 'fr'
  })
})

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: string
  responseTime?: number
}

// ✅ STATE PRINCIPAL
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

// ✅ STATE POUR PERSISTANCE
const storageKey = computed(() => `chatseller_messages_${configData.value.shopId}`)
const conversationKey = computed(() => `chatseller_conversation_${configData.value.shopId}`)

// ✅ COMPUTED AVEC SÉCURITÉ
const configData = computed(() => props.config || {})

const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const agentName = computed(() => {
  return configData.value.agentConfig?.name || 'Anna'
})

const agentTitle = computed(() => {
  return configData.value.agentConfig?.title || 'Vendeuse IA'
})

// ✅ CORRECTION MAJEURE : Nom complet avec titre
const agentFullName = computed(() => {
  const name = agentName.value
  const title = agentTitle.value
  
  // Format : "Anna - Vendeuse IA" ou "Rose - Spécialiste produit"
  if (name && title && title !== 'Vendeuse IA') {
    return `${name} - ${title}`
  } else if (name) {
    return `${name} - Vendeuse IA`
  }
  return 'Anna - Vendeuse IA'
})

const agentAvatar = computed(() => {
  if (configData.value.agentConfig?.avatar) {
    return configData.value.agentConfig.avatar
  }
  // ✅ Avatar avec couleur dynamique
  const color = (configData.value.primaryColor || '#EC4899').replace('#', '')
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

// ✅ COULEUR PRIMAIRE DYNAMIQUE - ROSE PAR DÉFAUT
const primaryColor = computed(() => configData.value.primaryColor || '#EC4899')

const inputPlaceholder = computed(() => {
  return `Tapez votre message...`
})

// ✅ STYLES COMPUTED DYNAMIQUES
const containerStyles = computed(() => ({
  backgroundColor: 'white',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  borderRadius: '20px',
  overflow: 'hidden'
}))

const headerStyles = computed(() => ({
  background: `linear-gradient(135deg, ${primaryColor.value} 0%, ${adjustColor(primaryColor.value, -10)} 100%)`
}))

const sendButtonStyles = computed(() => ({
  background: primaryColor.value,
  borderRadius: '50%'
}))

// ✅ PERSISTANCE LOCALSTORAGE
const saveMessagesToStorage = () => {
  if (typeof window === 'undefined') return
  
  try {
    const data = {
      messages: messages.value,
      conversationId: conversationId.value,
      timestamp: Date.now(),
      agentConfig: {
        name: agentName.value,
        title: agentTitle.value,
        avatar: agentAvatar.value
      }
    }
    localStorage.setItem(storageKey.value, JSON.stringify(data))
    localStorage.setItem(conversationKey.value, conversationId.value || '')
    console.log('💾 [Widget] Messages sauvegardés en localStorage')
  } catch (error) {
    console.warn('⚠️ [Widget] Erreur sauvegarde localStorage:', error)
  }
}

const loadMessagesFromStorage = () => {
  if (typeof window === 'undefined') return false
  
  try {
    const saved = localStorage.getItem(storageKey.value)
    const savedConvId = localStorage.getItem(conversationKey.value)
    
    if (saved) {
      const data = JSON.parse(saved)
      const age = Date.now() - (data.timestamp || 0)
      
      // Données valides pendant 24h
      if (age < 24 * 60 * 60 * 1000 && data.messages && data.messages.length > 0) {
        messages.value = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        conversationId.value = savedConvId || data.conversationId || null
        
        console.log('📥 [Widget] Messages restaurés depuis localStorage:', messages.value.length)
        return true
      } else {
        // Nettoyer les données expirées
        localStorage.removeItem(storageKey.value)
        localStorage.removeItem(conversationKey.value)
      }
    }
  } catch (error) {
    console.warn('⚠️ [Widget] Erreur lecture localStorage:', error)
  }
  
  return false
}

const clearStoredMessages = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(storageKey.value)
    localStorage.removeItem(conversationKey.value)
    console.log('🧹 [Widget] Messages localStorage nettoyés')
  } catch (error) {
    console.warn('⚠️ [Widget] Erreur nettoyage localStorage:', error)
  }
}

// ✅ MESSAGE D'ACCUEIL CONTEXTUEL AVEC TITRE DYNAMIQUE
const sendWelcomeMessage = async () => {
  try {
    let welcomeMessage = ''
    
    if (configData.value.agentConfig?.welcomeMessage) {
      welcomeMessage = configData.value.agentConfig.welcomeMessage
    } else {
      if (productInfo.value?.name) {
        welcomeMessage = `Bonjour ! 👋 Je suis ${agentFullName.value}.

Je vois que vous vous intéressez à **${productInfo.value.name}**. Comment puis-je vous aider aujourd'hui ? 😊`
      } else {
        welcomeMessage = `Bonjour ! 👋 Je suis ${agentFullName.value}.

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
    saveMessagesToStorage()

  } catch (error: any) {
    console.error('❌ Erreur message d\'accueil:', error)
  }
}

// ✅ ENVOI DE MESSAGE AMÉLIORÉ
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
  saveMessagesToStorage()

  isTyping.value = true
  await nextTick()
  scrollToBottom()

  try {
    console.log('📤 [WIDGET] Envoi message à l\'API publique...')
    const response = await sendApiMessage(messageContent)
    
    console.log('📥 [WIDGET] Réponse API reçue:', response)
    
    if (response.success) {
      conversationId.value = response.data.conversationId
      
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
        provider: response.data.provider || 'openai',
        responseTime: response.data.responseTime || 0
      }
      messages.value.push(aiMessage)
      saveMessagesToStorage()
      
      console.log('✅ [WIDGET] Message IA ajouté à la liste')
    } else {
      throw new Error(response.error || 'Erreur API inconnue')
    }

  } catch (error: any) {
    console.error('❌ [WIDGET] Erreur envoi message:', error)
    
    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: getIntelligentResponse(messageContent),
      timestamp: new Date(),
      provider: 'fallback'
    }
    messages.value.push(aiMessage)
    saveMessagesToStorage()
    
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

// ✅ NOUVELLE FONCTION : Reset conversation
const resetConversation = () => {
  messages.value = []
  conversationId.value = null
  clearStoredMessages()
  sendWelcomeMessage()
  console.log('🔄 [Widget] Conversation réinitialisée')
}

// ✅ NOUVELLE FONCTION : Gestion messages vocaux
const handleVoiceMessage = () => {
  // Placeholder pour la fonctionnalité vocale future
  console.log('🎤 Message vocal demandé')
  // TODO: Implémenter l'enregistrement vocal
  alert('Fonctionnalité vocale bientôt disponible !')
}

// ✅ APPEL API CORRIGÉ AVEC RETRY
const sendApiMessage = async (message: string, retryCount = 0): Promise<any> => {
  const apiUrl = configData.value.apiUrl || 'https://chatseller-api-production.up.railway.app'
  const endpoint = `${apiUrl}/api/v1/public/chat`  // ✅ CORRIGÉ: Route publique
  
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

  console.log(`📤 [WIDGET API] Tentative ${retryCount + 1}/3 - URL:`, endpoint)
  console.log('📤 [WIDGET API] Payload:', payload)

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📥 [WIDGET API] Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [WIDGET API] Error Body:', errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('📥 [WIDGET API] Success Result:', result)

    return result
  } catch (error: any) {
    console.error(`❌ [WIDGET API] Tentative ${retryCount + 1} échouée:`, error)
    
    // Retry logic (max 3 tentatives)
    if (retryCount < 2) {
      console.log(`🔄 [WIDGET API] Retry dans ${(retryCount + 1) * 1000}ms...`)
      await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 1000))
      return sendApiMessage(message, retryCount + 1)
    }
    
    throw error
  }
}

// ✅ HELPER FUNCTIONS
const getIntelligentResponse = (message: string): string => {
  const msg = message.toLowerCase()
  const productName = productInfo.value?.name || 'ce produit'
  const fullName = agentFullName.value
  
  if (msg.includes('acheter') || msg.includes('commander')) {
    return `Parfait ! Je vais vous aider à commander **${productName}**. 🎉

**Combien d'exemplaires** souhaitez-vous ?`
  }
  
  if (msg.includes('prix')) {
    return `Je vérifie le prix de **${productName}** pour vous... Un instant ! ⏳`
  }
  
  if (msg.includes('bonjour') || msg.includes('salut')) {
    return `Bonjour ! 👋 Je suis ${fullName}.

${productInfo.value?.name ? `Je vois que vous vous intéressez à **"${productInfo.value.name}"**.` : ''}

Comment puis-je vous aider ? 😊`
  }
  
  return `Merci pour votre question ! 😊 En tant que ${agentTitle.value}, je vous mets en relation avec notre équipe pour les informations plus précises sur **${productName}**.`
}

const closeChat = () => {
  isOpen.value = false
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    (window as any).ChatSeller.destroy()
  }
}

const closeChatOnOverlay = () => {
  if (!isMobile.value) {
    closeChat()
  }
}

// ✅ FORMATAGE MESSAGE AVEC LIENS CLIQUABLES AMÉLIORÉ
const formatMessage = (content: string) => {
  let formatted = content
    // Préserver les emojis AVANT tout autre traitement
    .replace(/([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu, '<span class="emoji">$1</span>')
    
    // Gestion des markdown
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-700">$1</em>')
    
    // Gestion des liens
    .replace(/(https?:\/\/[^\s]+)/g, `<a href="$1" target="_blank" rel="noopener noreferrer" style="color: ${primaryColor.value}; text-decoration: underline;">$1</a>`)
    
    // Gestion des sauts de ligne
    .replace(/\n\n/g, '<br><br class="my-2">')
    .replace(/\n/g, '<br class="my-1">')
    
    // Amélioration des listes
    .replace(/^\- (.*)/gm, `<span class="block ml-2 relative"><span class="absolute -ml-2" style="color: ${primaryColor.value}">•</span>$1</span>`)
    
    // Amélioration des prix
    .replace(/(\d+(?:[.,]\d{2})?\s*(?:FCFA|€|USD|\$))/g, '<span class="font-semibold text-green-600 bg-green-50 px-1 rounded">$1</span>')
    
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

// ✅ WATCHERS
watch(messages, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

// ✅ AUTO-SAVE MESSAGES
watch(messages, saveMessagesToStorage, { deep: true })

// ✅ LIFECYCLE
onMounted(() => {
  console.log('🎨 [WIDGET VUE] Composant monté avec config:', configData.value)
  console.log('👤 [WIDGET VUE] Agent complet:', agentFullName.value)
  
  // Essayer de restaurer les messages
  const restored = loadMessagesFromStorage()
  
  if (!restored) {
    // Envoyer le message d'accueil seulement si pas de restoration
    sendWelcomeMessage()
  } else {
    console.log('📥 [WIDGET VUE] Messages restaurés, pas de message d\'accueil')
  }
})

onUnmounted(() => {
  // Sauvegarder une dernière fois avant destruction
  saveMessagesToStorage()
})
</script>

<style scoped>
/* ✅ CSS MINIMAL - COMPLÉMENTAIRE AU CSS GLOBAL */
/* Le CSS principal est dans widget-isolated.css */

/* ✅ STYLES SPÉCIFIQUES POUR LES NOUVELLES FONCTIONNALITÉS */

/* Header Actions */
.cs-header-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.cs-action-button {
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  color: white !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.cs-action-button:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Product Info in Header */
.cs-product-info-header {
  font-weight: 500 !important;
  opacity: 0.95 !important;
}

/* Voice Button */
.cs-voice-button, .cs-mobile-voice {
  background: transparent !important;
  border: none !important;
  color: #9ca3af !important;
  cursor: pointer !important;
  padding: 8px !important;
  border-radius: 50% !important;
  transition: all 0.2s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.cs-voice-button:hover, .cs-mobile-voice:hover {
  color: #6b7280 !important;
  background: rgba(0, 0, 0, 0.05) !important;
}

/* User Avatar */
.cs-user-avatar, .cs-mobile-user-avatar {
  width: 32px !important;
  height: 32px !important;
  border-radius: 50% !important;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: white !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  flex-shrink: 0 !important;
}

/* Mobile Actions */
.cs-mobile-actions {
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.cs-mobile-reset {
  background: rgba(255, 255, 255, 0.1) !important;
  border: none !important;
  color: white !important;
  width: 28px !important;
  height: 28px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.2s ease !important;
}

.cs-mobile-reset:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

/* Mobile Footer Layout */
.cs-mobile-footer {
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  font-size: 10px !important;
  color: #9ca3af !important;
  margin-top: 8px !important;
}

.cs-mobile-powered {
  font-size: 10px !important;
  color: #9ca3af !important;
}

.cs-mobile-security {
  font-size: 10px !important;
  color: #9ca3af !important;
}

/* Liens cliquables */
.cs-message-text a {
  color: inherit !important;
  text-decoration: underline !important;
  font-weight: 500 !important;
}

.cs-message-text a:hover {
  opacity: 0.8 !important;
}

/* Corrections spécifiques Vue uniquement */
.cs-chatseller-widget {
  font-family: inherit;
  position: relative;
}

/* Animation spécifique Vue */
.cs-modal-enter-active, .cs-modal-leave-active {
  transition: opacity 0.3s ease;
}

.cs-modal-enter-from, .cs-modal-leave-to {
  opacity: 0;
}

/* Message formatting spécifique Vue */
.message-formatted {
  line-height: 1.6 !important;
  word-break: break-word !important;
}

.message-formatted strong {
  font-weight: 600 !important;
  color: #1f2937 !important;
}

.message-formatted em {
  font-style: italic !important;
  color: #4b5563 !important;
}

/* Loading animation spécifique Vue */
@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

.cs-typing-dot {
  animation: typing 1.4s infinite;
}

.cs-typing-dot:nth-child(1) { animation-delay: 0s; }
.cs-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.cs-typing-dot:nth-child(3) { animation-delay: 0.4s; }

/* ✅ ANIMATIONS DE CHARGEMENT */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.cs-loading-spinner, .cs-mobile-loading-spinner {
  animation: spin 1s linear infinite;
}
</style>