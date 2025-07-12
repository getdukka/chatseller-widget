<template>
  <div class="cs-chatseller-widget">
    <!-- Chat Button (when closed) -->
    <Transition name="cs-fade">
      <button
        v-if="!isOpen"
        @click="openChat"
        :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
        class="cs-chat-button cs-fixed cs-w-14 cs-h-14 cs-rounded-full cs-shadow-lg cs-flex cs-items-center cs-justify-center cs-text-white cs-transition-all cs-duration-300 hover:cs-scale-110"
      >
        <svg class="cs-w-6 cs-h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
        </svg>
      </button>
    </Transition>

    <!-- Chat Interface -->
    <Transition name="cs-slide-up">
      <div
        v-if="isOpen"
        class="cs-chat-interface cs-fixed cs-bg-white cs-shadow-2xl cs-rounded-lg cs-overflow-hidden"
        :class="chatInterfaceClasses"
      >
        <!-- Header -->
        <div 
          class="cs-chat-header cs-p-4 cs-text-white cs-flex cs-items-center cs-justify-between"
          :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
        >
          <div class="cs-flex cs-items-center cs-space-x-3">
            <img
              :src="agentAvatar"
              :alt="agentName"
              class="cs-w-8 cs-h-8 cs-rounded-full cs-border-2 cs-border-white"
            >
            <div>
              <h3 class="cs-font-semibold cs-text-sm">{{ agentName }}</h3>
              <p class="cs-text-xs cs-opacity-90">{{ assistantTitle }}</p>
            </div>
          </div>
          <button
            @click="closeChat"
            class="cs-text-white hover:cs-bg-white hover:cs-bg-opacity-20 cs-p-1 cs-rounded-full cs-transition-colors"
          >
            <svg class="cs-w-5 cs-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Product Context (if available) -->
        <div
          v-if="config.productName"
          class="cs-product-context cs-p-3 cs-bg-gray-50 cs-border-b cs-border-gray-200"
        >
          <div class="cs-flex cs-items-center cs-space-x-2">
            <div class="cs-w-2 cs-h-2 cs-bg-green-500 cs-rounded-full"></div>
            <span class="cs-text-sm cs-text-gray-600">{{ config.productName }}</span>
            <span v-if="config.productPrice" class="cs-text-sm cs-font-semibold cs-text-gray-800">
              {{ formatPrice(config.productPrice) }}
            </span>
          </div>
        </div>

        <!-- Messages Container -->
        <div
          ref="messagesContainer"
          class="cs-messages-container cs-flex-1 cs-p-4 cs-space-y-4 cs-overflow-y-auto cs-max-h-96"
        >
          <!-- Welcome Message -->
          <div v-if="messages.length === 0" class="cs-message cs-assistant-message">
            <div class="cs-flex cs-items-start cs-space-x-3">
              <img
                :src="agentAvatar"
                :alt="agentName"
                class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
              >
              <div class="cs-message-content">
                <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1">
                  <span class="cs-font-semibold cs-text-sm">{{ agentName }}</span>
                  <span class="cs-text-xs cs-text-gray-500">{{ formatTime(new Date()) }}</span>
                </div>
                <div class="cs-message-bubble cs-assistant-bubble cs-bg-gray-100 cs-text-gray-800 cs-p-3 cs-rounded-lg cs-rounded-tl-none">
                  <p class="cs-text-sm">{{ welcomeMessage }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Chat Messages -->
          <div
            v-for="message in messages"
            :key="message.id"
            class="cs-message"
            :class="message.role === 'user' ? 'cs-user-message' : 'cs-assistant-message'"
          >
            <div
              v-if="message.role === 'assistant'"
              class="cs-flex cs-items-start cs-space-x-3"
            >
              <img
                :src="agentAvatar"
                :alt="agentName"
                class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
              >
              <div class="cs-message-content">
                <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1">
                  <span class="cs-font-semibold cs-text-sm">{{ agentName }}</span>
                  <span class="cs-text-xs cs-text-gray-500">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="cs-message-bubble cs-assistant-bubble cs-bg-gray-100 cs-text-gray-800 cs-p-3 cs-rounded-lg cs-rounded-tl-none">
                  <p class="cs-text-sm" v-html="formatMessage(message.content)"></p>
                </div>
              </div>
            </div>

            <div
              v-else
              class="cs-flex cs-items-start cs-space-x-3 cs-justify-end"
            >
              <div class="cs-message-content cs-text-right">
                <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-1 cs-justify-end">
                  <span class="cs-text-xs cs-text-gray-500">{{ formatTime(message.timestamp) }}</span>
                  <span class="cs-font-semibold cs-text-sm">{{ t('you') }}</span>
                </div>
                <div 
                  class="cs-message-bubble cs-user-bubble cs-text-white cs-p-3 cs-rounded-lg cs-rounded-tr-none"
                  :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
                >
                  <p class="cs-text-sm">{{ message.content }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Typing Indicator -->
          <div v-if="isTyping" class="cs-message cs-assistant-message">
            <div class="cs-flex cs-items-start cs-space-x-3">
              <img
                :src="agentAvatar"
                :alt="agentName"
                class="cs-w-8 cs-h-8 cs-rounded-full cs-flex-shrink-0"
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
        </div>

        <!-- Quick Actions (when no messages) -->
        <div
          v-if="messages.length === 0 && !isTyping"
          class="cs-quick-actions cs-p-4 cs-space-y-2 cs-border-t cs-border-gray-200"
        >
          <button
            @click="sendQuickMessage(quickActions.buyNow)"
            :style="{ backgroundColor: config.primaryColor || '#ec4899' }"
            class="cs-w-full cs-text-white cs-p-3 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-opacity hover:cs-opacity-90"
          >
            {{ quickActions.buyNow }}
          </button>
          
          <button
            @click="sendQuickMessage(quickActions.haveQuestions)"
            class="cs-w-full cs-border-2 cs-text-gray-700 cs-p-3 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-colors hover:cs-bg-gray-50"
            :style="{ borderColor: config.primaryColor || '#ec4899', color: config.primaryColor || '#ec4899' }"
          >
            {{ quickActions.haveQuestions }}
          </button>
          
          <button
            @click="sendQuickMessage(quickActions.wantToKnowMore)"
            class="cs-w-full cs-border-2 cs-text-gray-700 cs-p-3 cs-rounded-lg cs-text-sm cs-font-medium cs-transition-colors hover:cs-bg-gray-50"
            :style="{ borderColor: config.primaryColor || '#ec4899', color: config.primaryColor || '#ec4899' }"
          >
            {{ quickActions.wantToKnowMore }}
          </button>
        </div>

        <!-- Message Input -->
        <div class="cs-message-input cs-p-4 cs-border-t cs-border-gray-200 cs-bg-white">
          <div class="cs-flex cs-items-end cs-space-x-2">
            <div class="cs-flex-1">
              <input
                v-model="currentMessage"
                @keypress.enter="sendMessage"
                :placeholder="inputPlaceholder"
                class="cs-w-full cs-p-3 cs-border cs-border-gray-300 cs-rounded-lg cs-text-sm cs-resize-none focus:cs-outline-none focus:cs-border-blue-500"
                :disabled="isTyping"
              >
            </div>
            <button
              @click="sendMessage"
              :disabled="!currentMessage.trim() || isTyping"
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
const conversationId = ref<string | null>(null)
const messagesContainer = ref<HTMLElement>()

// Translations
const translations: Translations = {
  fr: {
    assistantTitle: "Assistante d'achat",
    you: 'Vous',
    wantToBuyNow: "Je veux l'acheter maintenant",
    haveQuestions: "J'ai des questions à poser",
    wantToKnowMore: "Je veux en savoir plus",
    typeMessage: "Tapez votre message...",
    defaultWelcome: "Bonjour ! Je suis votre assistante d'achat. Comment puis-je vous aider ?"
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

// Translation function with proper type safety
const t = (key: string): string => {
  const lang = props.config.language || 'fr'
  const langTranslations = translations[lang]
  const frTranslations = translations.fr
  
  // Return the translation or fallback to French or the key itself
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

const chatInterfaceClasses = computed(() => ({
  'cs-w-80 cs-h-96': !isMobile.value,
  'cs-w-screen cs-h-screen cs-top-0 cs-left-0': isMobile.value
}))

const agentName = computed(() => {
  return props.config.agentConfig?.name || 'Rose'
})

const agentAvatar = computed(() => {
  return props.config.agentConfig?.avatar || `https://ui-avatars.com/api/?name=${agentName.value}&background=${(props.config.primaryColor || '#ec4899').replace('#', '')}&color=fff`
})

const welcomeMessage = computed(() => {
  return props.config.agentConfig?.welcomeMessage || t('defaultWelcome')
})

// Used computed properties that were causing the errors
const assistantTitle = computed(() => t('assistantTitle'))
const inputPlaceholder = computed(() => t('typeMessage'))
const quickActions = computed(() => ({
  buyNow: t('wantToBuyNow'),
  haveQuestions: t('haveQuestions'),
  wantToKnowMore: t('wantToKnowMore')
}))

// Methods
const openChat = async () => {
  isOpen.value = true
  
  // Track analytics
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_opened', {
      productId: props.config.productId,
      productName: props.config.productName
    })
  }

  // Create conversation if not exists
  if (!conversationId.value) {
    await createConversation()
  }
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

const createConversation = async () => {
  try {
    const apiUrl = props.config.apiUrl || 'https://api.chatseller.app'
    const response = await fetch(`${apiUrl}/api/v1/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        shopId: props.config.shopId,
        visitorId: getVisitorId(),
        productId: props.config.productId,
        productName: props.config.productName,
        productPrice: props.config.productPrice,
        productUrl: props.config.productUrl
      })
    })

    if (response.ok) {
      const conversation = await response.json()
      conversationId.value = conversation.id
    }
  } catch (error) {
    console.error('Failed to create conversation:', error)
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || isTyping.value) return

  const messageContent = currentMessage.value.trim()
  currentMessage.value = ''

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

  // Simulate AI response (replace with real API call)
  setTimeout(() => {
    const aiMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: getAIResponse(messageContent),
      timestamp: new Date()
    }
    messages.value.push(aiMessage)
    isTyping.value = false
    
    nextTick().then(() => {
      scrollToBottom()
    })
  }, 1500)

  // Track analytics
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('message_sent', {
      conversationId: conversationId.value,
      messageType: 'user',
      messageLength: messageContent.length
    })
  }
}

const sendQuickMessage = (message: string) => {
  currentMessage.value = message
  sendMessage()
}

const getAIResponse = (userMessage: string): string => {
  // Placeholder AI responses based on keywords
  const message = userMessage.toLowerCase()
  
  if (message.includes('acheter') || message.includes('buy')) {
    return "Excellent ! Je vais vous aider à finaliser votre commande. Puis-je avoir votre nom et prénom pour commencer ?"
  }
  
  if (message.includes('question') || message.includes('help')) {
    return "Bien sûr ! Je suis là pour répondre à toutes vos questions. Que souhaitez-vous savoir exactement ?"
  }
  
  if (message.includes('prix') || message.includes('price')) {
    return `Le prix de ce produit est de ${formatPrice(props.config.productPrice || 0)}. Voulez-vous que je vous aide à passer commande ?`
  }
  
  return "Merci pour votre message ! Un de nos conseillers va examiner votre demande et vous répondre dans les plus brefs délais."
}

const formatMessage = (content: string) => {
  // Basic formatting for links, bold text, etc.
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

const getVisitorId = () => {
  // Generate or retrieve visitor ID
  if (typeof window === 'undefined') return 'unknown'
  
  let visitorId = localStorage.getItem('chatseller_visitor_id')
  if (!visitorId) {
    visitorId = uuidv4()
    localStorage.setItem('chatseller_visitor_id', visitorId)
  }
  return visitorId
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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
      productName: props.config.productName
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

/* Scrollbar */
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
</style>