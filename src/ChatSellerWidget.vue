<template>
  <div class="cs-chatseller-widget">
    <!-- ✅ BOUTON WIDGET (Non-flottant, intégré dans la page) -->
    <Transition name="cs-fade">
      <button
        v-if="!isOpen"
        @click="openChat"
        :style="{ 
          backgroundColor: config.primaryColor || '#007AFF',
          ...(config.theme === 'brand_adaptive' ? adaptiveStyles : {})
        }"
        class="cs-chat-trigger-button"
        :class="getTriggerButtonClasses()"
      >
        <svg class="cs-w-5 cs-h-5 cs-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.906-1.479L3 21l2.521-5.094A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"></path>
        </svg>
        {{ config.buttonText || 'Parler à un conseiller' }}
        
        <!-- Badge notification optionnel -->
        <span 
          v-if="hasUnreadMessages"
          class="cs-absolute cs--top-1 cs--right-1 cs-w-3 cs-h-3 cs-bg-red-500 cs-rounded-full cs-animate-pulse"
        ></span>
      </button>
    </Transition>

    <!-- ✅ MODAL CHAT MODERNE - ÉLARGI À 450PX -->
    <Transition name="cs-modal">
      <div
        v-if="isOpen"
        class="cs-chat-modal-overlay"
        :class="{ 'cs-mobile': isMobile }"
        @click.self="closeChatOnOverlay"
      >
        <div 
          class="cs-chat-container cs-modern-chat"
          :class="getChatContainerClasses()"
          :style="{ 
            borderColor: config.primaryColor || '#007AFF',
            ...(config.theme === 'brand_adaptive' ? adaptiveStyles : {})
          }"
        >
          
          <!-- ✅ HEADER CHAT MODERNE AVEC GRADIENT -->
          <div 
            class="cs-chat-header cs-modern-header"
            :style="{ 
              background: `linear-gradient(135deg, ${config.primaryColor || '#007AFF'} 0%, ${adjustColor(config.primaryColor || '#007AFF', -20)} 100%)`
            }"
          >
            <div class="cs-flex cs-items-center cs-space-x-3">
              <div class="cs-relative">
                <img
                  :src="agentAvatar"
                  :alt="agentName"
                  class="cs-w-12 cs-h-12 cs-rounded-full cs-border-3 cs-border-white cs-border-opacity-30 cs-shadow-lg"
                  @error="handleAvatarError"
                >
                <div class="cs-absolute cs-bottom-0 cs-right-0 cs-w-4 cs-h-4 cs-bg-green-400 cs-rounded-full cs-border-2 cs-border-white cs-animate-pulse"></div>
              </div>
              <div>
                <h3 class="cs-font-semibold cs-text-white cs-text-lg cs-tracking-tight">{{ agentName }}</h3>
                <p class="cs-text-sm cs-text-white cs-text-opacity-90 cs-flex cs-items-center">
                  <span class="cs-text-xs cs-bg-green-400 cs-text-green-900 cs-px-2 cs-py-0.5 cs-rounded-full cs-font-medium cs-mr-2">
                    En ligne
                  </span>
                  {{ agentTitle }}
                </p>
              </div>
            </div>
            
            <button
              @click="closeChat"
              class="cs-text-white cs-text-opacity-80 hover:cs-text-opacity-100 cs-p-2 cs-rounded-full hover:cs-bg-white hover:cs-bg-opacity-10 cs-transition-all cs-group"
            >
              <svg class="cs-w-6 cs-h-6 cs-group-hover:cs-rotate-90 cs-transition-transform cs-duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <!-- ✅ CONTEXTE PRODUIT MODERNE (si détecté) -->
          <div
            v-if="productInfo"
            class="cs-product-context cs-modern-context"
          >
            <div class="cs-flex cs-items-center cs-space-x-4">
              <div class="cs-flex cs-items-center cs-space-x-2">
                <div class="cs-w-3 cs-h-3 cs-bg-green-500 cs-rounded-full cs-animate-pulse"></div>
                <div class="cs-text-xs cs-font-medium cs-text-green-700 cs-bg-green-50 cs-px-2 cs-py-1 cs-rounded-full">
                  {{ t('viewing_product') }}
                </div>
              </div>
              <div class="cs-flex-1 cs-min-w-0">
                <p class="cs-text-sm cs-font-semibold cs-text-gray-900 cs-truncate">{{ productInfo.name }}</p>
                <p v-if="productInfo.price" class="cs-text-sm cs-text-gray-600">
                  {{ formatPrice(productInfo.price) }}
                </p>
              </div>
            </div>
          </div>

          <!-- ✅ CONTAINER MESSAGES ÉLARGI -->
          <div
            ref="messagesContainer"
            class="cs-messages-container cs-modern-messages"
            :class="getMessagesContainerClasses()"
          >
            
            <!-- Message de bienvenue avec design moderne -->
            <div v-if="messages.length === 0 && !isLoading" class="cs-message cs-assistant-message">
              <div class="cs-flex cs-items-start cs-space-x-3">
                <div class="cs-relative">
                  <img
                    :src="agentAvatar"
                    :alt="agentName"
                    class="cs-w-10 cs-h-10 cs-rounded-full cs-flex-shrink-0 cs-border-2 cs-border-gray-100"
                    @error="handleAvatarError"
                  >
                  <div class="cs-absolute cs-bottom-0 cs-right-0 cs-w-3 cs-h-3 cs-bg-green-400 cs-rounded-full cs-border cs-border-white"></div>
                </div>
                <div class="cs-message-content cs-max-w-sm">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-2">
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ agentName }}</span>
                    <span class="cs-text-xs cs-text-gray-500 cs-bg-gray-100 cs-px-2 cs-py-0.5 cs-rounded-full">{{ formatTime(new Date()) }}</span>
                  </div>
                  <div 
                    class="cs-message-bubble cs-modern-bubble cs-bg-gradient-to-br cs-from-gray-50 cs-to-gray-100 cs-text-gray-800 cs-p-4 cs-rounded-2xl cs-rounded-tl-md cs-shadow-sm cs-border cs-border-gray-200"
                  >
                    <p class="cs-text-sm cs-leading-relaxed" v-html="formatMessage(welcomeMessage)"></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Messages de conversation modernes -->
            <div
              v-for="message in messages"
              :key="message.id"
              class="cs-message"
              :class="message.role === 'user' ? 'cs-user-message' : 'cs-assistant-message'"
            >
              <!-- Message assistant moderne -->
              <div
                v-if="message.role === 'assistant'"
                class="cs-flex cs-items-start cs-space-x-3"
              >
                <div class="cs-relative">
                  <img
                    :src="agentAvatar"
                    :alt="agentName"
                    class="cs-w-10 cs-h-10 cs-rounded-full cs-flex-shrink-0 cs-border-2 cs-border-gray-100"
                    @error="handleAvatarError"
                  >
                  <div class="cs-absolute cs-bottom-0 cs-right-0 cs-w-3 cs-h-3 cs-bg-green-400 cs-rounded-full cs-border cs-border-white"></div>
                </div>
                <div class="cs-message-content cs-max-w-sm">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-2">
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ agentName }}</span>
                    <span class="cs-text-xs cs-text-gray-500 cs-bg-gray-100 cs-px-2 cs-py-0.5 cs-rounded-full">{{ formatTime(message.timestamp) }}</span>
                  </div>
                  <div 
                    class="cs-message-bubble cs-modern-bubble cs-bg-gradient-to-br cs-from-gray-50 cs-to-gray-100 cs-text-gray-800 cs-p-4 cs-rounded-2xl cs-rounded-tl-md cs-shadow-sm cs-border cs-border-gray-200"
                  >
                    <p class="cs-text-sm cs-leading-relaxed" v-html="formatMessage(message.content)"></p>
                  </div>
                </div>
              </div>

              <!-- Message utilisateur moderne -->
              <div
                v-else
                class="cs-flex cs-items-start cs-space-x-3 cs-justify-end"
              >
                <div class="cs-message-content cs-text-right cs-max-w-sm">
                  <div class="cs-flex cs-items-center cs-space-x-2 cs-mb-2 cs-justify-end">
                    <span class="cs-text-xs cs-text-gray-500 cs-bg-gray-100 cs-px-2 cs-py-0.5 cs-rounded-full">{{ formatTime(message.timestamp) }}</span>
                    <span class="cs-font-semibold cs-text-sm cs-text-gray-900">{{ t('you') }}</span>
                  </div>
                  <div 
                    class="cs-message-bubble cs-modern-bubble cs-text-white cs-p-4 cs-rounded-2xl cs-rounded-tr-md cs-shadow-sm cs-backdrop-blur-sm"
                    :style="{ 
                      background: `linear-gradient(135deg, ${config.primaryColor || '#007AFF'} 0%, ${adjustColor(config.primaryColor || '#007AFF', -15)} 100%)`
                    }"
                  >
                    <p class="cs-text-sm cs-leading-relaxed">{{ message.content }}</p>
                  </div>
                </div>
                <div class="cs-w-10 cs-h-10 cs-bg-gradient-to-br cs-from-gray-400 cs-to-gray-500 cs-rounded-full cs-flex cs-items-center cs-justify-center cs-flex-shrink-0 cs-shadow-sm">
                  <span class="cs-text-white cs-text-sm cs-font-semibold">{{ t('you_initial') }}</span>
                </div>
              </div>
            </div>

            <!-- Indicateur de frappe moderne -->
            <div v-if="isTyping" class="cs-message cs-assistant-message">
              <div class="cs-flex cs-items-start cs-space-x-3">
                <div class="cs-relative">
                  <img
                    :src="agentAvatar"
                    :alt="agentName"
                    class="cs-w-10 cs-h-10 cs-rounded-full cs-flex-shrink-0 cs-border-2 cs-border-gray-100"
                    @error="handleAvatarError"
                  >
                  <div class="cs-absolute cs-bottom-0 cs-right-0 cs-w-3 cs-h-3 cs-bg-green-400 cs-rounded-full cs-border cs-border-white cs-animate-pulse"></div>
                </div>
                <div class="cs-typing-indicator cs-modern-typing cs-bg-gradient-to-r cs-from-gray-100 cs-to-gray-50 cs-p-4 cs-rounded-2xl cs-rounded-tl-md cs-shadow-sm cs-border cs-border-gray-200">
                  <div class="cs-flex cs-items-center cs-space-x-1">
                    <span class="cs-text-xs cs-text-gray-500 cs-mr-2">{{ agentName }} est en train d'écrire</span>
                    <div class="cs-flex cs-space-x-1">
                      <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0s"></div>
                      <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0.2s"></div>
                      <div class="cs-w-2 cs-h-2 cs-bg-gray-400 cs-rounded-full cs-animate-bounce" style="animation-delay: 0.4s"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Message d'erreur moderne -->
            <div v-if="errorMessage" class="cs-message cs-error-message">
              <div class="cs-bg-red-50 cs-border cs-border-red-200 cs-rounded-2xl cs-p-4 cs-max-w-sm cs-mx-auto cs-shadow-sm">
                <div class="cs-flex cs-items-start">
                  <div class="cs-w-8 cs-h-8 cs-bg-red-100 cs-rounded-full cs-flex cs-items-center cs-justify-center cs-flex-shrink-0">
                    <svg class="cs-w-4 cs-h-4 cs-text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                    </svg>
                  </div>
                  <div class="cs-ml-3">
                    <p class="cs-text-sm cs-text-red-800 cs-font-medium">{{ errorMessage }}</p>
                    <button 
                      v-if="lastFailedMessage"
                      @click="retryLastMessage"
                      class="cs-text-xs cs-text-red-600 cs-underline cs-mt-2 hover:cs-text-red-800 cs-transition-colors cs-font-medium"
                    >
                      {{ t('retry') }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div ref="messagesEndRef" />
          </div>

          <!-- ✅ ACTIONS RAPIDES MODERNES -->
          <div
            v-if="showQuickActions"
            class="cs-quick-actions cs-modern-actions"
          >
            <div class="cs-mb-3">
              <p class="cs-text-xs cs-text-gray-600 cs-text-center cs-font-medium">{{ t('quick_actions') }}</p>
            </div>
            <div class="cs-grid cs-grid-cols-1 cs-gap-3">
              <button
                @click="sendQuickMessage(quickActions.buyNow)"
                class="cs-w-full cs-text-white cs-p-4 cs-rounded-xl cs-text-sm cs-font-semibold cs-transition-all hover:cs-opacity-90 cs-flex cs-items-center cs-justify-center cs-shadow-sm hover:cs-shadow-md cs-transform hover:cs--translate-y-0.5"
                :style="{ 
                  background: `linear-gradient(135deg, ${config.primaryColor || '#007AFF'} 0%, ${adjustColor(config.primaryColor || '#007AFF', -15)} 100%)`
                }"
              >
                <svg class="cs-w-5 cs-h-5 cs-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                </svg>
                {{ quickActions.buyNow }}
              </button>
              
              <div class="cs-grid cs-grid-cols-2 cs-gap-3">
                <button
                  @click="sendQuickMessage(quickActions.haveQuestions)"
                  class="cs-border-2 cs-text-gray-700 cs-p-3 cs-rounded-xl cs-text-sm cs-font-medium cs-transition-all hover:cs-bg-gray-50 cs-shadow-sm hover:cs-shadow-md cs-transform hover:cs--translate-y-0.5"
                  :style="{ 
                    borderColor: config.primaryColor || '#007AFF', 
                    color: config.primaryColor || '#007AFF' 
                  }"
                >
                  <svg class="cs-w-4 cs-h-4 cs-mx-auto cs-mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ quickActions.haveQuestions }}
                </button>
                
                <button
                  @click="sendQuickMessage(quickActions.wantToKnowMore)"
                  class="cs-border-2 cs-text-gray-700 cs-p-3 cs-rounded-xl cs-text-sm cs-font-medium cs-transition-all hover:cs-bg-gray-50 cs-shadow-sm hover:cs-shadow-md cs-transform hover:cs--translate-y-0.5"
                  :style="{ 
                    borderColor: config.primaryColor || '#007AFF', 
                    color: config.primaryColor || '#007AFF' 
                  }"
                >
                  <svg class="cs-w-4 cs-h-4 cs-mx-auto cs-mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {{ quickActions.wantToKnowMore }}
                </button>
              </div>
            </div>
          </div>

          <!-- ✅ FORMULAIRE DE COMMANDE CONVERSATIONNEL MODERNE -->
          <div
            v-if="isInOrderFlow && currentOrderStep"
            class="cs-order-form cs-modern-order"
          >
            <div class="cs-mb-4">
              <div class="cs-flex cs-items-center cs-space-x-3 cs-mb-2">
                <div 
                  class="cs-w-4 cs-h-4 cs-rounded-full cs-animate-pulse"
                  :style="{ backgroundColor: config.primaryColor || '#007AFF' }"
                ></div>
                <span class="cs-text-sm cs-font-semibold cs-text-gray-900">{{ t('order_in_progress') }}</span>
                <div class="cs-flex-1 cs-h-px cs-bg-gray-200"></div>
              </div>
              <p class="cs-text-xs cs-text-gray-600 cs-bg-blue-50 cs-px-3 cs-py-1 cs-rounded-lg cs-inline-block">{{ getOrderStepDescription(currentOrderStep) }}</p>
            </div>
            
            <!-- Résumé de commande moderne -->
            <div v-if="currentOrderStep === 'confirmation' && orderSummary" class="cs-mb-4">
              <div class="cs-bg-white cs-p-4 cs-rounded-xl cs-border-2 cs-border-gray-100 cs-shadow-sm">
                <div class="cs-text-sm cs-leading-relaxed" v-html="formatMessage(orderSummary)"></div>
              </div>
              <div class="cs-flex cs-space-x-3 cs-mt-4">
                <button
                  @click="confirmOrder"
                  :disabled="isProcessingOrder"
                  class="cs-flex-1 cs-bg-green-600 cs-text-white cs-p-4 cs-rounded-xl cs-text-sm cs-font-semibold cs-transition-all hover:cs-bg-green-700 disabled:cs-opacity-50 cs-flex cs-items-center cs-justify-center cs-shadow-sm hover:cs-shadow-md cs-transform hover:cs--translate-y-0.5"
                >
                  <svg v-if="!isProcessingOrder" class="cs-w-5 cs-h-5 cs-mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <svg v-else class="cs-w-5 cs-h-5 cs-mr-2 cs-animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  {{ isProcessingOrder ? t('processing') : t('confirm_order') }}
                </button>
                <button
                  @click="cancelOrder"
                  class="cs-px-6 cs-py-4 cs-border-2 cs-border-gray-300 cs-rounded-xl cs-text-sm cs-text-gray-700 cs-transition-all hover:cs-bg-gray-50 cs-font-medium cs-shadow-sm"
                >
                  {{ t('cancel') }}
                </button>
              </div>
            </div>
          </div>

          <!-- ✅ INPUT MESSAGE MODERNE -->
          <div class="cs-message-input cs-modern-input">
            <div class="cs-flex cs-items-end cs-space-x-3">
              <div class="cs-flex-1">
                <input
                  v-model="currentMessage"
                  @keypress.enter="sendMessage"
                  :placeholder="inputPlaceholder"
                  class="cs-w-full cs-p-4 cs-border-2 cs-border-gray-200 cs-rounded-xl cs-text-sm focus:cs-outline-none focus:cs-ring-2 focus:cs-border-transparent cs-transition-all cs-resize-none cs-bg-white cs-shadow-sm focus:cs-shadow-md"
                  :style="{ 
                    '--tw-ring-color': config.primaryColor || '#007AFF'
                  }"
                  :disabled="isTyping || isLoading || isProcessingOrder"
                >
              </div>
              <button
                @click="sendMessage"
                :disabled="!currentMessage.trim() || isTyping || isLoading || isProcessingOrder"
                class="cs-p-4 cs-text-white cs-rounded-xl cs-transition-all disabled:cs-opacity-50 cs-flex cs-items-center cs-justify-center cs-min-w-14 cs-shadow-sm hover:cs-shadow-md cs-transform hover:cs--translate-y-0.5"
                :style="{ 
                  background: `linear-gradient(135deg, ${config.primaryColor || '#007AFF'} 0%, ${adjustColor(config.primaryColor || '#007AFF', -15)} 100%)`
                }"
              >
                <svg v-if="!isTyping" class="cs-w-5 cs-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                </svg>
                <svg v-else class="cs-w-5 cs-h-5 cs-animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>
            <p class="cs-text-xs cs-text-gray-500 cs-mt-3 cs-text-center cs-bg-gray-50 cs-px-3 cs-py-2 cs-rounded-lg">
              {{ t('powered_by') }} <strong class="cs-font-semibold" :style="{ color: config.primaryColor || '#007AFF' }">ChatSeller</strong> • {{ t('ai_assistant') }}
            </p>
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

// ✅ NOUVEAU STATE : Gestion des commandes
const isInOrderFlow = ref(false)
const currentOrderStep = ref<string | null>(null)
const orderData = ref<any>({})
const orderSummary = ref<string | null>(null)
const isProcessingOrder = ref(false)

// ✅ ADAPTIVE STYLES (pour theme brand_adaptive)
const adaptiveStyles = ref<any>({})

// Translations
const translations: Translations = {
  fr: {
    online: "En ligne",
    you: 'Vous',
    you_initial: 'V',
    viewing_product: 'Produit consulté',
    quick_actions: 'Actions rapides',
    wantToBuyNow: "Je veux l'acheter maintenant",
    haveQuestions: "J'ai des questions",
    wantToKnowMore: "Je veux en savoir plus",
    typeMessage: "Tapez votre message...",
    defaultWelcome: "Bonjour ! Je suis votre assistant d'achat. Comment puis-je vous aider ?",
    retry: "Réessayer",
    order_in_progress: "Commande en cours",
    processing: "Traitement...",
    confirm_order: "Confirmer la commande",
    cancel: "Annuler",
    powered_by: "Propulsé par",
    ai_assistant: "Assistant IA"
  },
  en: {
    online: "Online",
    you: 'You',
    you_initial: 'Y',
    viewing_product: 'Viewing product',
    quick_actions: 'Quick actions',
    wantToBuyNow: "I want to buy it now",
    haveQuestions: "I have questions",
    wantToKnowMore: "I want to know more",
    typeMessage: "Type your message...",
    defaultWelcome: "Hello! I'm your shopping assistant. How can I help you?",
    retry: "Retry",
    order_in_progress: "Order in progress",
    processing: "Processing...",
    confirm_order: "Confirm order",
    cancel: "Cancel",
    powered_by: "Powered by",
    ai_assistant: "AI Assistant"
  },
  wo: {
    online: "Fi nekk",
    you: 'Yow',
    you_initial: 'Y',
    viewing_product: 'Produit yi nga tàng',
    quick_actions: 'Jëf yu gaaw',
    wantToBuyNow: "Bëgg naa ko jënd",
    haveQuestions: "Am naa làkk",
    wantToKnowMore: "Bëgg naa gëm ci",
    typeMessage: "Bind sa mbind...",
    defaultWelcome: "Salaam! Maa ngi njëkk bu ñëpp. Na nga maa jëf?",
    retry: "Jël",
    order_in_progress: "Jënd bi daw",
    processing: "Daw...",
    confirm_order: "Defar jënd",
    cancel: "Dillu",
    powered_by: "Defar na",
    ai_assistant: "Njëkk IA"
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
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=${(props.config.primaryColor || '#007AFF').replace('#', '')}&color=fff&size=128`
})

const welcomeMessage = computed(() => {
  const baseMessage = props.config.agentConfig?.welcomeMessage || t('defaultWelcome')
  
  // Personnaliser avec le produit si disponible
  if (productInfo.value?.name) {
    return `${baseMessage} Je vois que vous regardez "${productInfo.value.name}". Comment puis-je vous aider ?`
  }
  
  return baseMessage
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
  return messages.value.length === 0 && !isTyping.value && !isLoading.value && !isInOrderFlow.value
})

const inputPlaceholder = computed(() => {
  if (isInOrderFlow.value && currentOrderStep.value) {
    return getOrderStepPlaceholder(currentOrderStep.value)
  }
  return t('typeMessage')
})

const quickActions = computed(() => ({
  buyNow: t('wantToBuyNow'),
  haveQuestions: t('haveQuestions'),
  wantToKnowMore: t('wantToKnowMore')
}))

// ✅ MÉTHODES STYLES ADAPTATIFS ET COULEURS
const detectBrandColors = () => {
  if (props.config.theme !== 'brand_adaptive') return

  try {
    // Détecter les couleurs principales du site
    const primaryButtons = document.querySelectorAll('button[class*="primary"], .btn-primary, [class*="cta"]')
    
    if (primaryButtons.length > 0) {
      const buttonStyles = window.getComputedStyle(primaryButtons[0] as Element)
      const detectedColor = buttonStyles.backgroundColor
      
      if (detectedColor && detectedColor !== 'rgba(0, 0, 0, 0)') {
        adaptiveStyles.value = {
          backgroundColor: detectedColor
        }
      }
    }
  } catch (error) {
    console.warn('Could not detect brand colors:', error)
  }
}

const adjustColor = (color: string, percent: number): string => {
  // Convertir hex vers RGB puis ajuster luminosité
  const hex = color.replace('#', '')
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
  
  return `rgb(${newR}, ${newG}, ${newB})`
}

// Styles CSS classes
const getTriggerButtonClasses = () => {
  let classes = 'cs-w-full cs-flex cs-items-center cs-justify-center cs-text-white cs-font-semibold cs-transition-all cs-duration-200 hover:cs-opacity-90 cs-cursor-pointer cs-relative cs-shadow-lg hover:cs-shadow-xl cs-transform hover:cs--translate-y-1'
  
  // Theme-based styling
  switch (props.config.theme) {
    case 'minimal':
      classes += ' cs-py-3 cs-px-6 cs-rounded-lg cs-text-sm'
      break
    case 'brand_adaptive':
      classes += ' cs-py-4 cs-px-8 cs-rounded-xl cs-text-base cs-font-bold'
      break
    default: // modern
      classes += ' cs-py-4 cs-px-8 cs-rounded-xl cs-text-base'
  }
  
  return classes
}

const getChatContainerClasses = () => {
  let classes = 'cs-bg-white cs-flex cs-flex-col cs-overflow-hidden cs-backdrop-blur-xl'
  
  if (isMobile.value) {
    classes += ' cs-w-full cs-h-full cs-rounded-none'
  } else {
    // ✅ ÉLARGI À 450PX (au lieu de 384px)
    classes += ' cs-w-450 cs-h-[650px] cs-rounded-2xl cs-shadow-2xl cs-border'
  }
  
  // Theme-based styling
  switch (props.config.theme) {
    case 'minimal':
      classes += ' cs-shadow-lg'
      break
    case 'brand_adaptive':
      classes += ' cs-shadow-2xl'
      break
    default: // modern
      classes += ' cs-shadow-2xl'
  }
  
  return classes
}

const getMessagesContainerClasses = () => {
  return 'cs-flex-1 cs-p-6 cs-space-y-6 cs-overflow-y-auto cs-bg-gradient-to-b cs-from-gray-50 cs-to-white'
}

// const getMessageBubbleClasses = () => {
//  return 'cs-shadow-sm hover:cs-shadow-md cs-transition-shadow'
// }

// ✅ MÉTHODES COMMANDE
const getOrderStepDescription = (step: string): string => {
  const descriptions: Record<string, string> = {
    product: 'Sélection du produit et quantité',
    name: 'Informations personnelles',
    phone: 'Numéro de téléphone',
    address: 'Adresse de livraison',
    payment: 'Mode de paiement',
    confirmation: 'Confirmation de la commande'
  }
  return descriptions[step] || 'Étape de commande'
}

const getOrderStepPlaceholder = (step: string): string => {
  const placeholders: Record<string, string> = {
    product: 'Ex: 2 exemplaires',
    name: 'Votre nom complet...',
    phone: 'Votre numéro de téléphone...',
    address: 'Votre adresse de livraison...',
    payment: 'Choisissez un mode de paiement...',
    confirmation: 'Confirmez votre commande...'
  }
  return placeholders[step] || 'Tapez votre réponse...'
}

// Methods
const openChat = async () => {
  isOpen.value = true
  hasUnreadMessages.value = false
  errorMessage.value = null
  
  // Detect brand colors if adaptive theme
  if (props.config.theme === 'brand_adaptive') {
    detectBrandColors()
  }
  
  // Track analytics
  if (typeof window !== 'undefined' && (window as any).ChatSeller) {
    ;(window as any).ChatSeller.track('widget_opened', {
      productId: props.config.productId,
      productName: props.config.productName,
      agentName: agentName.value,
      theme: props.config.theme
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
    const chatSeller = (window as any).ChatSeller
    if (!chatSeller) {
      throw new Error('ChatSeller SDK not available')
    }

    // ✅ LOGIQUE DE GESTION DES COMMANDES
    if (!isInOrderFlow.value) {
      const intentResult = await chatSeller.analyzeOrderIntent?.(messageContent, conversationId.value, productInfo.value)

      if (intentResult?.success && intentResult.data?.hasOrderIntent) {
        if (intentResult.data.action === 'start_order') {
          await startOrderFlow(messageContent)
          return
        }
      }
    }

    if (isInOrderFlow.value && currentOrderStep.value) {
      await processOrderStep(messageContent)
      return
    }

    // ✅ Conversation normale avec base de connaissance
    const response = await chatSeller.sendMessage(messageContent, conversationId.value)
    
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
      
      // Track analytics
      chatSeller.track('message_received', {
        conversationId: conversationId.value,
        agentName: response.data.agent?.name || agentName.value,
        responseTime: response.data.responseTime
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

// ✅ GESTION DES COMMANDES
const startOrderFlow = async (initialMessage: string) => {
  try {
    const chatSeller = (window as any).ChatSeller
    
    const result = await chatSeller.startOrder?.(conversationId.value, productInfo.value, initialMessage)

    if (result?.success) {
      isInOrderFlow.value = true
      currentOrderStep.value = result.data.currentStep
      orderData.value = result.data.collectedData

      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
    }
  } catch (error) {
    console.error('❌ Erreur start order flow:', error)
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

const processOrderStep = async (message: string) => {
  try {
    const chatSeller = (window as any).ChatSeller
    
    const extractedData = extractDataFromMessage(message, currentOrderStep.value!)
    
    const result = await chatSeller.processOrderStep?.(conversationId.value, currentOrderStep.value!, extractedData)

    if (result?.success) {
      currentOrderStep.value = result.data.currentStep
      orderData.value = result.data.collectedData

      if (result.data.collectedData.summary) {
        orderSummary.value = result.data.collectedData.summary
      }

      const aiMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.data.message,
        timestamp: new Date()
      }
      messages.value.push(aiMessage)
    }
  } catch (error) {
    console.error('❌ Erreur process order step:', error)
  } finally {
    isTyping.value = false
    await nextTick()
    scrollToBottom()
  }
}

const extractDataFromMessage = (message: string, step: string): any => {
  switch (step) {
    case 'name':
      return { name: message.trim() }
    case 'phone':
      const phoneMatch = message.match(/(\+?[0-9\s\-\(\)]{8,})/)
      return { phone: phoneMatch?.[1]?.replace(/\s/g, '') || message.trim() }
    case 'address':
      return { address: message.trim() }
    case 'payment':
      return { paymentMethod: message.trim() }
    case 'quantity':
      const qtyMatch = message.match(/(\d+)/)
      return { quantity: qtyMatch?.[1] ? parseInt(qtyMatch[1]) : 1 }
    default:
      return { value: message.trim() }
  }
}

const confirmOrder = async () => {
  isProcessingOrder.value = true
  
  try {
    const chatSeller = (window as any).ChatSeller
    
    const result = await chatSeller.completeOrder?.(conversationId.value, orderData.value)

    if (result?.success) {
      const confirmationMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: result.data.message,
        timestamp: new Date()
      }
      messages.value.push(confirmationMessage)

      // Réinitialiser le flux de commande
      isInOrderFlow.value = false
      currentOrderStep.value = null
      orderData.value = {}
      orderSummary.value = null

      // Track conversion
      chatSeller.track('order_completed', {
        conversationId: conversationId.value,
        orderId: result.data.orderId,
        orderNumber: result.data.orderNumber
      })
    }
  } catch (error) {
    console.error('❌ Erreur confirm order:', error)
    errorMessage.value = 'Erreur lors de la finalisation de la commande'
  } finally {
    isProcessingOrder.value = false
    await nextTick()
    scrollToBottom()
  }
}

const cancelOrder = () => {
  isInOrderFlow.value = false
  currentOrderStep.value = null
  orderData.value = {}
  orderSummary.value = null

  const cancelMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: 'Commande annulée. N\'hésitez pas si vous changez d\'avis ! Comment puis-je vous aider autrement ?',
    timestamp: new Date()
  }
  messages.value.push(cancelMessage)
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
    .replace(/\n/g, '<br>')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString(props.config.language || 'fr', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price: number) => {
  const currency = 'XOF' // Par défaut pour le marché sénégalais
  
  return new Intl.NumberFormat(props.config.language || 'fr', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agentName.value)}&background=6B7280&color=fff&size=128`
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
/* ✅ CSS AVEC PRÉFIXES POUR ÉVITER LES CONFLITS */

/* Reset pour le widget seulement */
.cs-chatseller-widget,
.cs-chatseller-widget * {
  box-sizing: border-box;
}

/* ✅ LARGEUR ÉLARGIE À 450PX */
.cs-w-450 { 
  width: 28.125rem !important; /* 450px */
}

/* Transitions modernes */
.cs-fade-enter-active, .cs-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.cs-fade-enter-from, .cs-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
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

/* Widget trigger button moderne */
.cs-chat-trigger-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, var(--primary-color, #007AFF) 0%, var(--primary-dark, #0051D5) 100%);
}

.cs-chat-trigger-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
}

.cs-chat-trigger-button:active {
  transform: translateY(-1px);
}

/* Modal overlay moderne */
.cs-chat-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.cs-chat-modal-overlay.cs-mobile {
  padding: 0;
  align-items: stretch;
  justify-content: stretch;
}

/* Chat container moderne */
.cs-chat-container.cs-modern-chat {
  max-height: 90vh;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* Chat header moderne avec gradient */
.cs-chat-header.cs-modern-header {
  padding: 1.25rem;
  background: linear-gradient(135deg, #007AFF 0%, #0051D5 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.cs-chat-header.cs-modern-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

/* Product context moderne */
.cs-product-context.cs-modern-context {
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e2e8f0;
  position: relative;
}

/* Messages container moderne */
.cs-messages-container.cs-modern-messages {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
  background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%);
}

.cs-messages-container.cs-modern-messages::-webkit-scrollbar {
  width: 6px;
}
.cs-messages-container.cs-modern-messages::-webkit-scrollbar-track {
  background: #f7fafc;
  border-radius: 3px;
}
.cs-messages-container.cs-modern-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #cbd5e0, #9ca3af);
  border-radius: 3px;
}
.cs-messages-container.cs-modern-messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(to bottom, #9ca3af, #6b7280);
}

/* Message bubbles modernes */
.cs-message-bubble.cs-modern-bubble {
  word-wrap: break-word;
  max-width: 100%;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.cs-message-bubble.cs-modern-bubble::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: exclude;
  pointer-events: none;
}

/* Typing indicator moderne */
.cs-typing-indicator.cs-modern-typing {
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Quick actions modernes */
.cs-quick-actions.cs-modern-actions {
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

/* Order form moderne */
.cs-order-form.cs-modern-order {
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
}

/* Input message moderne */
.cs-message-input.cs-modern-input {
  padding: 1.25rem;
  border-top: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
}

.cs-message-input.cs-modern-input input {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 2px solid rgba(226, 232, 240, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cs-message-input.cs-modern-input input:focus {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--primary-color, #007AFF);
  box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.1);
}

/* Hover effects pour les boutons */
.cs-transform.hover\:cs--translate-y-0\.5:hover {
  transform: translateY(-2px);
}

.cs-transform.hover\:cs--translate-y-1:hover {
  transform: translateY(-4px);
}

/* Responsive adjustments */
@media (max-width: 767px) {
  .cs-chat-modal-overlay {
    padding: 0;
  }
  
  .cs-chat-container {
    width: 100% !important;
    height: 100% !important;
    border-radius: 0 !important;
    max-height: 100vh;
  }
  
  .cs-message-content {
    max-width: calc(100vw - 140px);
  }
}

/* Utility classes avec préfixes cs- étendues */
.cs-w-full { width: 100%; }
.cs-w-12 { width: 3rem; }
.cs-w-10 { width: 2.5rem; }
.cs-w-8 { width: 2rem; }
.cs-w-5 { width: 1.25rem; }
.cs-w-4 { width: 1rem; }
.cs-w-3 { width: 0.75rem; }
.cs-w-2 { width: 0.5rem; }
.cs-min-w-14 { min-width: 3.5rem; }

.cs-h-full { height: 100%; }
.cs-h-12 { height: 3rem; }
.cs-h-10 { height: 2.5rem; }
.cs-h-8 { height: 2rem; }
.cs-h-5 { height: 1.25rem; }
.cs-h-4 { height: 1rem; }
.cs-h-3 { height: 0.75rem; }
.cs-h-2 { height: 0.5rem; }
.cs-h-px { height: 1px; }

.cs-flex { display: flex; }
.cs-flex-1 { flex: 1 1 0%; }
.cs-flex-shrink-0 { flex-shrink: 0; }
.cs-items-center { align-items: center; }
.cs-items-start { align-items: flex-start; }
.cs-items-end { align-items: flex-end; }
.cs-justify-center { justify-content: center; }
.cs-justify-end { justify-content: flex-end; }
.cs-justify-between { justify-content: space-between; }
.cs-flex-col { flex-direction: column; }

.cs-grid { display: grid; }
.cs-grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.cs-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.cs-space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.5rem; }
.cs-space-x-3 > :not([hidden]) ~ :not([hidden]) { margin-left: 0.75rem; }
.cs-space-x-4 > :not([hidden]) ~ :not([hidden]) { margin-left: 1rem; }
.cs-space-y-6 > :not([hidden]) ~ :not([hidden]) { margin-top: 1.5rem; }

.cs-gap-3 { gap: 0.75rem; }

.cs-p-3 { padding: 0.75rem; }
.cs-p-4 { padding: 1rem; }
.cs-p-6 { padding: 1.5rem; }
.cs-px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.cs-px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.cs-px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.cs-px-8 { padding-left: 2rem; padding-right: 2rem; }
.cs-py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.cs-py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.cs-py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.cs-py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.cs-py-4 { padding-top: 1rem; padding-bottom: 1rem; }

.cs-m-2 { margin: 0.5rem; }
.cs-ml-3 { margin-left: 0.75rem; }
.cs-mr-2 { margin-right: 0.5rem; }
.cs-mt-2 { margin-top: 0.5rem; }
.cs-mt-3 { margin-top: 0.75rem; }
.cs-mt-4 { margin-top: 1rem; }
.cs-mb-1 { margin-bottom: 0.25rem; }
.cs-mb-2 { margin-bottom: 0.5rem; }
.cs-mb-3 { margin-bottom: 0.75rem; }
.cs-mb-4 { margin-bottom: 1rem; }
.cs-mx-auto { margin-left: auto; margin-right: auto; }

.cs-rounded-full { border-radius: 9999px; }
.cs-rounded-2xl { border-radius: 1rem; }
.cs-rounded-xl { border-radius: 0.75rem; }
.cs-rounded-lg { border-radius: 0.5rem; }
.cs-rounded-md { border-radius: 0.375rem; }
.cs-rounded-tl-md { border-top-left-radius: 0.375rem; }
.cs-rounded-tr-md { border-top-right-radius: 0.375rem; }

.cs-bg-white { background-color: white; }
.cs-bg-gray-50 { background-color: #f9fafb; }
.cs-bg-gray-100 { background-color: #f3f4f6; }
.cs-bg-gray-200 { background-color: #e5e7eb; }
.cs-bg-gray-300 { background-color: #d1d5db; }
.cs-bg-red-50 { background-color: #fef2f2; }
.cs-bg-red-100 { background-color: #fee2e2; }
.cs-bg-red-500 { background-color: #ef4444; }
.cs-bg-green-50 { background-color: #f0fdf4; }
.cs-bg-green-400 { background-color: #4ade80; }
.cs-bg-green-600 { background-color: #16a34a; }
.cs-bg-blue-50 { background-color: #eff6ff; }

/* Gradients */
.cs-bg-gradient-to-br { background-image: linear-gradient(to bottom right, var(--tw-gradient-stops)); }
.cs-bg-gradient-to-r { background-image: linear-gradient(to right, var(--tw-gradient-stops)); }
.cs-bg-gradient-to-b { background-image: linear-gradient(to bottom, var(--tw-gradient-stops)); }
.cs-from-gray-50 { --tw-gradient-from: #f9fafb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(249, 250, 251, 0)); }
.cs-from-gray-100 { --tw-gradient-from: #f3f4f6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(243, 244, 246, 0)); }
.cs-from-gray-400 { --tw-gradient-from: #9ca3af; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(156, 163, 175, 0)); }
.cs-to-gray-50 { --tw-gradient-to: #f9fafb; }
.cs-to-gray-100 { --tw-gradient-to: #f3f4f6; }
.cs-to-gray-500 { --tw-gradient-to: #6b7280; }
.cs-to-white { --tw-gradient-to: white; }

.cs-text-white { color: white; }
.cs-text-gray-500 { color: #6b7280; }
.cs-text-gray-600 { color: #4b5563; }
.cs-text-gray-700 { color: #374151; }
.cs-text-gray-800 { color: #1f2937; }
.cs-text-gray-900 { color: #111827; }
.cs-text-red-500 { color: #ef4444; }
.cs-text-red-600 { color: #dc2626; }
.cs-text-red-800 { color: #991b1b; }
.cs-text-green-700 { color: #15803d; }
.cs-text-green-900 { color: #14532d; }
.cs-text-blue-500 { color: #3b82f6; }
.cs-text-opacity-90 { color: rgba(255, 255, 255, 0.9); }

.cs-border { border-width: 1px; }
.cs-border-2 { border-width: 2px; }
.cs-border-3 { border-width: 3px; }
.cs-border-gray-100 { border-color: #f3f4f6; }
.cs-border-gray-200 { border-color: #e5e7eb; }
.cs-border-gray-300 { border-color: #d1d5db; }
.cs-border-red-200 { border-color: #fecaca; }
.cs-border-transparent { border-color: transparent; }
.cs-border-white { border-color: white; }
.cs-border-opacity-30 { border-color: rgba(255, 255, 255, 0.3); }

.cs-shadow-sm { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
.cs-shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.cs-shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
.cs-shadow-xl { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.cs-shadow-2xl { box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }

.cs-font-medium { font-weight: 500; }
.cs-font-semibold { font-weight: 600; }
.cs-font-bold { font-weight: 700; }

.cs-text-xs { font-size: 0.75rem; line-height: 1rem; }
.cs-text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.cs-text-base { font-size: 1rem; line-height: 1.5rem; }
.cs-text-lg { font-size: 1.125rem; line-height: 1.75rem; }

.cs-text-center { text-align: center; }
.cs-text-right { text-align: right; }

.cs-leading-relaxed { line-height: 1.625; }
.cs-tracking-tight { letter-spacing: -0.025em; }

.cs-underline { text-decoration: underline; }
.cs-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cs-cursor-pointer { cursor: pointer; }

.cs-transition-all { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.cs-transition-colors { transition: color 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.cs-transition-shadow { transition: box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.cs-transition-transform { transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.cs-duration-200 { transition-duration: 0.2s; }

.cs-transform { transform: var(--tw-transform); }

.cs-hover\:cs-opacity-90:hover { opacity: 0.9; }
.cs-hover\:cs-bg-gray-50:hover { background-color: #f9fafb; }
.cs-hover\:cs-bg-green-700:hover { background-color: #15803d; }
.cs-hover\:cs-text-opacity-100:hover { color: rgba(255, 255, 255, 1); }
.cs-hover\:cs-text-red-800:hover { color: #991b1b; }
.cs-hover\:cs-shadow-md:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.cs-hover\:cs-shadow-xl:hover { box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
.cs-hover\:cs-rotate-90:hover { transform: rotate(90deg); }

.cs-group:hover .cs-group-hover\:cs-rotate-90 { transform: rotate(90deg); }

.cs-disabled\:cs-opacity-50:disabled { opacity: 0.5; }

.cs-focus\:cs-outline-none:focus { outline: none; }
.cs-focus\:cs-ring-2:focus { box-shadow: 0 0 0 3px var(--tw-ring-color); }
.cs-focus\:cs-border-transparent:focus { border-color: transparent; }
.cs-focus\:cs-shadow-md:focus { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }

.cs-overflow-hidden { overflow: hidden; }
.cs-overflow-y-auto { overflow-y: auto; }

.cs-resize-none { resize: none; }

.cs-relative { position: relative; }
.cs-absolute { position: absolute; }
.cs-fixed { position: fixed; }

.cs-top-0 { top: 0; }
.cs-left-0 { left: 0; }
.cs-right-0 { right: 0; }
.cs-bottom-0 { bottom: 0; }
.cs--top-1 { top: -0.25rem; }
.cs--right-1 { right: -0.25rem; }

.cs-max-w-xs { max-width: 20rem; }
.cs-max-w-sm { max-width: 24rem; }
.cs-min-w-0 { min-width: 0; }

.cs-z-50 { z-index: 50; }

.cs-inline-block { display: inline-block; }

.cs-animate-bounce {
  animation: cs-bounce 1.4s infinite;
}

.cs-animate-pulse {
  animation: cs-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.cs-animate-spin {
  animation: cs-spin 1s linear infinite;
}

/* Animations */
@keyframes cs-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-6px);
  }
}

@keyframes cs-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes cs-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Backdrop filter support */
.cs-backdrop-blur-sm {
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
</style>