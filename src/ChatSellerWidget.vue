<template>
  <div class="cs-chatseller-widget">
    <!-- ✅ BOUTON FLOTTANT DE CHAT (État fermé) -->
    <Transition name="cs-fade">
      <button
        v-if="!isOpen"
        @click="openChat"
        :style="{ 
          backgroundColor: config.primaryColor || '#ec4899',
          ...getPositionStyles()
        }"
        class="cs-chat-trigger-button cs-fixed cs-z-50 cs-w-16 cs-h-16 cs-rounded-full cs-shadow-xl cs-flex cs-items-center cs-justify-center cs-text-white cs-transition-all cs-duration-300 hover:cs-scale-110 cs-cursor-pointer"
      >
        <svg class="cs-w-6 cs-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
        </svg>
        
        <!-- Badge de notification optionnel -->
        <span 
          v-if="hasUnreadMessages"
          class="cs-absolute cs-top-0 cs-right-0 cs-w-4 cs-h-4 cs-bg-red-500 cs-rounded-full cs-text-xs cs-text-white cs-flex cs-items-center cs-justify-center"
        >
          !
        </span>
      </button>
    </Transition>

    <!-- ✅ INTERFACE DE CHAT (État ouvert) -->
    <Transition name="cs-slide-up">
      <div
        v-if="isOpen"
        class="cs-chat-modal"
        :class="chatModalClasses"
      >
        <!-- Overlay pour mobile -->
        <div 
          v-if="isMobile" 
          class="cs-fixed cs-inset-0 cs-bg-black cs-bg-opacity-50 cs-z-40"
          @click="closeChat"
        ></div>
        
        <!-- Container de chat -->
        <div 
          class="cs-chat-container cs-bg-white cs-shadow-2xl cs-flex cs-flex-col"
          :class="chatContainerClasses"
        >
          
          <!-- ✅ HEADER DU CHAT -->
          <div 
            class="cs-chat-header cs-p-4 cs-text-white cs-flex cs-items-center cs-justify-between"
            :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
          >
            <div class="cs-flex cs-items-center cs-space-x-3">
              <img
                :src="agentAvatar"
                :alt="agentName"
                class="cs-w-10 cs-h-10 cs-rounded-full cs-border-2 cs-border-white"
                @error="handleAvatarError"
              >
              <div>
                <h3 class="cs-font-semibold cs-text-base">{{ agentName }}</h3>
                <p class="cs-text-sm cs-opacity-90">{{ assistantTitle }}</p>
              </div>
            </div>
            
            <button
              @click="closeChat"
              class="cs-text-white hover:cs-bg-white hover:cs-bg-opacity-20 cs-p-2 cs-rounded-full cs-transition-colors"
            >
              <svg class="cs-w-5 cs-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- ✅ CONTEXTE PRODUIT (si disponible) -->
          <div
            v-if="config.productName"
            class="cs-product-context cs-p-4 cs-bg-gray-50 cs-border-b cs-border-gray-200"
          >
            <div class="cs-flex cs-items-center cs-space-x-3">
              <div class="cs-w-3 cs-h-3 cs-bg-green-500 cs-rounded-full"></div>
              <div class="cs-flex-1">
                <p class="cs-text-sm cs-font-medium cs-text-gray-900">{{ config.productName }}</p>
                <p v-if="config.productPrice" class="cs-text-sm cs-text-gray-600">
                  {{ formatPrice(config.productPrice) }}
                </p>
              </div>
            </div>
          </div>

          <!-- ✅ CONTAINER DE MESSAGES -->
          <div
            ref="messagesContainer"
            class="cs-messages-container cs-flex-1 cs-p-4 cs-space-y-4 cs-overflow-y-auto"
            :class="messagesContainerClasses"
          >
            
            <!-- Message de bienvenue -->
            <div v-if="messages.length === 0 && !isLoading" class="cs-message cs-assistant-message">
              <div class="cs-flex cs-items-start cs-space-x-3">
                <img
                  :src="agentAvatar"
                  :alt="agentName"
                  class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
                  @error="handleAvatarError"
                >
                <div class="cs-message-content cs-max-w-xs">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1">
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ agentName }}</span>
                    <span class="cs-text-xs cs-text-gray-500">{{ formatTime(new Date()) }}</span>
                  </div>
                  <div class="cs-message-bubble cs-bg-gray-100 cs-text-gray-800 cs-p-3 cs-rounded-lg cs-rounded-tl-none">
                    <p class="cs-text-sm">{{ welcomeMessage }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages de conversation -->
            <div
              v-for="message in messages"
              :key="message.id"
              class="cs-message"
              :class="message.role === 'user' ? 'cs-user-message' : 'cs-assistant-message'"
            >
              <!-- Message assistant -->
              <div
                v-if="message.role === 'assistant'"
                class="cs-flex cs-items-start cs-space-x-3"
              >
                <img
                  :src="agentAvatar"
                  :alt="agentName"
                  class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
                  @error="handleAvatarError"
                >
                <div class="cs-message-content cs-max-w-xs">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1">
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ agentName }}</span>
                    <span class="cs-text-xs cs-text-gray-500">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div class="cs-message-bubble cs-bg-gray-100 cs-text-gray-800 cs-p-3 cs-rounded-lg cs-rounded-tl-none">
                    <p class="cs-text-sm" v-html="formatMessage(message.content)"></p>
                  </div>
                </div>
              </div>

              <!-- Message utilisateur -->
              <div
                v-else
                class="cs-flex cs-items-start cs-space-x-3 cs-justify-end"
              >
                <div class="cs-message-content cs-text-right cs-max-w-xs">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1 cs-justify-end">
                    <span class="cs-text-xs cs-text-gray-500">{{ formatTime(message.timestamp) }}</span>
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ t('you') }}</span>
                  </div>
                  <div 
                    class="cs-message-bubble cs-text-white cs-p-3 cs-rounded-lg cs-rounded-tr-none"
                    :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
                  >
                    <p class="cs-text-sm">{{ message.content }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Indicateur de frappe -->
            <div v-if="isTyping" class="cs-message cs-assistant-message">
              <div class="cs-flex cs-items-start cs-space-x-3">
                <img
                  :src="agentAvatar"
                  :alt="agentName"
                  class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
                  @error="handleAvatarError"
                >
                <div class="cs-typing-indicator cs-bg-gray-100 cs-p-3 cs-rounded-lg cs-rounded-tl-none">
                  <div class="cs-flex cs-space-x-1">
                    <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0s"></div>
                    <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0.2s"></div>
                    <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0.4s"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message d'erreur -->
            <div v-if="errorMessage" class="cs-message cs-error-message">
              <div class="cs-bg-red-50 cs-border cs-border-red-200 cs-rounded-lg cs-p-3 cs-max-w-sm cs-mx-auto">
                <div class="cs-flex cs-items-start">
                  <svg class="cs-w-5 cs-h-5 cs-text-red-400 cs-flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                  </svg>
                  <div class="cs-ml-3">
                    <p class="cs-text-sm cs-text-red-800">{{ errorMessage }}</p>
                    <button 
                      v-if="lastFailedMessage"
                      @click="retryLastMessage"
                      class="cs-text-xs cs-text-red-600 cs-underline cs-mt-1 cs-hover:cs-text-red-800"
                    >
                      Réessayer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div ref="messagesEndRef" />
          </div>

          <!-- ✅ ACTIONS RAPIDES (pour nouveau chat) -->
          <div
            v-if="messages.length === 0 && !isTyping && !isLoading"
            class="cs-quick-actions cs-p-4 cs-space-y-2 cs-border-t cs-border-gray-200"
          >
            <button
              @click="sendQuickMessage(quickActions.buyNow)"
              :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
              class="cs-w-full cs-text-white cs-p-3 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-all hover:cs-opacity-90"
            >
              {{ quickActions.buyNow }}
            </button>
            
            <div class="cs-grid cs-grid-cols-2 cs-gap-2">
              <button
                @click="sendQuickMessage(quickActions.haveQuestions)"
                class="cs-border-2 cs-text-gray-700 cs-p-2 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-colors hover:cs-bg-gray-50"
                :style="{ borderColor: config.primaryColor || '#ec4899', color: config.primaryColor || '#ec4899' }"
              >
                {{ quickActions.haveQuestions }}
              </button>
              
              <button
                @click="sendQuickMessage(quickActions.wantToKnowMore)"
                class="cs-border-2 cs-text-gray-700 cs-p-2 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-colors hover:cs-bg-gray-50"
                :style="{ borderColor: config.primaryColor || '#ec4899', color: config.primaryColor || '#ec4899' }"
              >
                {{ quickActions.wantToKnowMore }}
              </button>
            </div>
          </div>

          <!-- ✅ INPUT DE MESSAGE -->
          <div class="cs-message-input cs-p-4 cs-border-t cs-border-gray-200 cs-bg-white">
            <div class="cs-flex cs-items-end cs-space-x-2">
              <div class="cs-flex-1">
                <input
                  v-model="currentMessage"
                  @keypress.enter="sendMessage"
                  :placeholder="inputPlaceholder"
                  class="cs-w-full cs-p-3 cs-border cs-border-gray-300 cs-rounded-lg cs-text-sm focus:cs-outline-none focus:cs-ring-2 focus:cs-ring-blue-500 focus:cs-border-blue-500"
                  :disabled="isTyping || isLoading"
                >
              </div>
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping || isLoading"
                :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
                class="cs-p-3 cs-text-white cs-rounded-lg cs-transition-opacity disabled:cs-opacity-50"
              >
                <svg class="cs-w-5 cs-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
              </button>
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
    assistantTitle: "Assistant d'achat",
    you: 'Vous',
    wantToBuyNow: "Je veux l'acheter maintenant",
    haveQuestions: "J'ai des questions",
    wantToKnowMore: "Je veux en savoir plus",
    typeMessage: "Tapez votre message...",
    defaultWelcome: "Bonjour ! Je suis votre assistant d'achat. Comment puis-je vous aider ?"
  },
  en: {
    assistantTitle: "Shopping Assistant",
    you: 'You',
    wantToBuyNow: "I want to buy it now",
    haveQuestions: "I have questions",
    wantToKnowMore: "I want to know more",
    typeMessage: "Type your message...",
    defaultWelcome: "Hello! I'm your shopping assistant. How can I help you?"
  },
  wo: {
    assistantTitle: "Njëkk wu ñëpp",
    you: 'Yow',
    wantToBuyNow: "Bëgg naa ko jënd",
    haveQuestions: "Am naa làkk",
    wantToKnowMore: "Bëgg naa gëm ci",
    typeMessage: "Bind sa mbind...",
    defaultWelcome: "Salaam! Maa ngi njëkk bu ñëpp. Na nga maa jëf?"
  }
}

// Translation function
const t = (key: string): string => {
  const lang = props.config.language || 'fr'
  const langTranslations = translations[lang]
  const frTranslations = translations.fr
  
  return (langTranslations && langTranslations[key]) || 
         (frTranslations && frTranslations[key]) || 
         key
}

// Computed
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

const chatModalClasses = computed(() => ({
  'cs-fixed cs-inset-0 cs-z-50': true,
  'cs-flex cs-items-end cs-justify-end cs-p-4': !isMobile.value,
  'cs-flex cs-items-center cs-justify-center': isMobile.value
}))

const chatContainerClasses = computed(() => ({
  'cs-w-96 cs-h-[500px] cs-rounded-lg': !isMobile.value,
  'cs-w-full cs-h-full cs-max-w-sm cs-z-50': isMobile.value
}))

const messagesContainerClasses = computed(() => ({
  'cs-max-h-96': !isMobile.value,
  'cs-flex-1': isMobile.value
}))

const agentName = computed(() => {
  return props.config.agentConfig?.name || 'Assistant'
})

const agentAvatar = computed(() => {
  if (props.config.agentConfig?.avatar) {
    return props.config.agentConfig.avatar
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${(props.config.primaryColor || '#ec4899').replace('#', '')}&color=fff`
})

const welcomeMessage = computed(() => {
  return props.config.agentConfig?.welcomeMessage || t('defaultWelcome')
})

const assistantTitle = computed(() => t('assistantTitle'))
const inputPlaceholder = computed(() => t('typeMessage'))
const quickActions = computed(() => ({
  buyNow: t('wantToBuyNow'),
  haveQuestions: t('haveQuestions'),
  wantToKnowMore: t('wantToKnowMore')
}))

// Methods
const getPositionStyles = () => {
  const { position } = props.config
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

const openChat = async () => {
  isOpen.value = true
  hasUnreadMessages.value = false
  errorMessage.value = null
  
  // Track analytics
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_opened', {
      productId: props.config.productId,
      productName: props.config.productName,
      agentName: agentName.value
    })
  }

  // Scroll to bottom after opening
  await nextTick()
  scrollToBottom()
}

const closeChat = () => {
  isOpen.value = false
  
  // Track analytics
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_closed', {
      conversationId: conversationId.value,
      messageCount: messages.value.length
    })
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value || isLoading.value) return

  const messageContent = currentMessage.value.trim()
  currentMessage.value = ''
  errorMessage.value = null

  // Add user message
  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    content: messageContent,
    timestamp: new Date()
  }
  messages.value.push(userMessage)

  // Show typing indicator
  isTyping.value = true

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  try {
    // ✅ UTILISER LA VRAIE API
    const chatSeller = (window as any).ChatSeller
    if (!chatSeller) {
      throw new Error('ChatSeller SDK not available')
    }

    const response = await chatSeller.sendMessage(messageContent, conversationId.value)
    
    if (response.success) {
      // Mettre à jour l'ID de conversation
      if (response.data.conversationId) {
        conversationId.value = response.data.conversationId
      }

      // Ajouter la réponse de l'IA
      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
      
      // Track analytics
      chatSeller.track('message_received', {
        conversationId: conversationId.value,
        agentName: response.data.agent?.name || agentName.value
      })
      
    } else {
      throw new Error(response.error || 'Erreur lors de l\'envoi du message')
    }

  } catch (error: any) {
    console.error('❌ Erreur envoi message:', error)
    
    errorMessage.value = 'Désolé, une erreur est survenue. Veuillez réessayer.'
    lastFailedMessage.value = messageContent
    
    // Ajouter un message de fallback
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

const retryLastMessage = () => {
  if (lastFailedMessage.value) {
    currentMessage.value = lastFailedMessage.value
    errorMessage.value = null
    lastFailedMessage.value = null
    sendMessage()
  }
}

const formatMessage = (content: string) => {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="cs-text-blue-500 cs-underline">$1</a>')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString(props.config.language || 'fr', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat(props.config.language || 'fr', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(price)
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=6B7280&color=fff`
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

// Lifecycle
onMounted(() => {
  // Track widget load
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_loaded', {
      productId: props.config.productId,
      productName: props.config.productName,
      agentConfigured: !!props.config.agentConfig,
      shopConfigLoaded: (window as any).ChatSeller.isConfigLoaded
    })
  }
})
</script>

<style scoped>
/* Transitions */
.cs-fade-enter-active, .cs-fade-leave-active {
  transition: opacity 0.3s ease;
}
.cs-fade-enter-from, .cs-fade-leave-to {
  opacity: 0;
}

.cs-slide-up-enter-active {
  transition: all 0.3s ease-out;
}
.cs-slide-up-leave-active {
  transition: all 0.3s ease-in;
}
.cs-slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}
.cs-slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Chat trigger button */
.cs-chat-trigger-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cs-chat-trigger-button:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
}

/* Scrollbar styling */
.cs-messages-container::-webkit-scrollbar {
  width: 4px;
}
.cs-messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.cs-messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}
.cs-messages-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

/* Animation des points de frappe */
@keyframes cs-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.cs-animate-bounce {
  animation: cs-bounce 1.4s infinite;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .cs-chat-trigger-button {
    width: 60px;
    height: 60px;
  }
  
  .cs-message-content {
    max-width: calc(100vw - 120px);
  }
}
</style>