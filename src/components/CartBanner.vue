<template>
  <div class="cart-banner" :style="bannerStyle" @click="toggleExpanded">
    <div class="cart-summary">
      <div class="cart-icon-badge">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cart-icon">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span class="cart-badge" :style="badgeStyle">{{ totalItems }}</span>
      </div>
      <div class="cart-info">
        <span class="cart-label">Ma commande ({{ totalItems }} article{{ totalItems > 1 ? 's' : '' }})</span>
        <span class="cart-total" :style="{ color: primaryColor }">{{ formattedTotal }} FCFA</span>
      </div>
      <button class="cart-checkout-btn" :style="checkoutBtnStyle" @click.stop="$emit('checkout')">
        Finaliser
      </button>
    </div>

    <!-- Détail des items (expanded) -->
    <div v-if="expanded" class="cart-items-list">
      <div v-for="(item, index) in items" :key="item.id || index" class="cart-item">
        <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="cart-item-img" />
        <div v-else class="cart-item-img-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </div>
        <div class="cart-item-info">
          <span class="cart-item-name">{{ item.name }}</span>
          <span class="cart-item-price">{{ item.quantity }} × {{ item.price.toLocaleString('fr-FR') }} FCFA</span>
        </div>
        <button class="cart-item-remove" @click.stop="$emit('remove', index)" title="Retirer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image_url?: string
  url?: string
}

interface CartBannerProps {
  items: CartItem[]
  primaryColor?: string
}

const props = withDefaults(defineProps<CartBannerProps>(), {
  primaryColor: '#8B5CF6'
})

defineEmits<{
  checkout: []
  remove: [index: number]
}>()

const expanded = ref(false)

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const totalItems = computed(() => {
  return props.items.reduce((sum, item) => sum + item.quantity, 0)
})

const totalPrice = computed(() => {
  return props.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

const formattedTotal = computed(() => {
  return totalPrice.value.toLocaleString('fr-FR')
})

const bannerStyle = computed(() => ({
  borderLeft: `4px solid ${props.primaryColor}`
}))

const badgeStyle = computed(() => ({
  background: props.primaryColor
}))

const checkoutBtnStyle = computed(() => ({
  background: props.primaryColor
}))
</script>

<style scoped>
.cart-banner {
  background: #ffffff;
  border-radius: 10px;
  margin: 8px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.cart-banner:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
}

.cart-summary {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
}

.cart-icon-badge {
  position: relative;
  flex-shrink: 0;
}

.cart-icon {
  width: 22px;
  height: 22px;
  color: #374151;
}

.cart-badge {
  position: absolute;
  top: -6px;
  right: -8px;
  color: white;
  font-size: 10px;
  font-weight: 700;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cart-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cart-label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cart-total {
  font-size: 14px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cart-checkout-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  flex-shrink: 0;
}

.cart-checkout-btn:hover {
  opacity: 0.9;
}

.cart-items-list {
  border-top: 1px solid #f3f4f6;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.cart-item-img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}

.cart-item-img-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  flex-shrink: 0;
}

.cart-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cart-item-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cart-item-price {
  font-size: 11px;
  color: #6b7280;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cart-item-remove {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #9ca3af;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s;
  flex-shrink: 0;
}

.cart-item-remove:hover {
  color: #ef4444;
}
</style>
