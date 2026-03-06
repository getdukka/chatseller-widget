<template>
  <div
    :style="{
      background: '#ffffff',
      borderRadius: '10px',
      margin: '8px 12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      cursor: 'pointer',
      borderLeft: `4px solid ${primaryColor}`,
      fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
    }"
    @click="toggleExpanded"
  >
    <!-- Résumé panier -->
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;">
      <!-- Icône panier + badge -->
      <div style="position:relative;flex-shrink:0;">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#374151"
          stroke-width="2"
          width="22"
          height="22"
          style="width:22px;height:22px;display:block;flex-shrink:0;"
        >
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        <span
          :style="{
            position: 'absolute',
            top: '-6px',
            right: '-8px',
            background: primaryColor,
            color: 'white',
            fontSize: '10px',
            fontWeight: '700',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'inherit'
          }"
        >{{ totalItems }}</span>
      </div>

      <!-- Infos panier -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
        <span style="font-size:12px;font-weight:600;color:#374151;font-family:inherit;">
          Ma commande ({{ totalItems }} article{{ totalItems > 1 ? 's' : '' }})
        </span>
        <span :style="{ fontSize: '14px', fontWeight: '700', color: primaryColor, fontFamily: 'inherit' }">
          {{ formattedTotal }} FCFA
        </span>
      </div>

      <!-- Bouton Finaliser -->
      <button
        :style="{
          padding: '8px 16px',
          border: 'none',
          borderRadius: '8px',
          background: primaryColor,
          color: 'white',
          fontSize: '13px',
          fontWeight: '600',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          flexShrink: '0',
          lineHeight: '1'
        }"
        @click.stop="$emit('checkout')"
      >
        Finaliser
      </button>
    </div>

    <!-- Liste des articles (expanded) -->
    <div
      v-if="expanded"
      style="border-top:1px solid #f3f4f6;padding:8px 14px;display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;"
    >
      <div
        v-for="(item, index) in items"
        :key="item.id || index"
        style="display:flex;align-items:center;gap:10px;padding:4px 0;"
      >
        <img
          v-if="item.image_url"
          :src="item.image_url"
          :alt="item.name"
          width="36"
          height="36"
          style="width:36px;height:36px;border-radius:6px;object-fit:cover;flex-shrink:0;"
        />
        <div
          v-else
          style="width:36px;height:36px;border-radius:6px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;color:#9ca3af;flex-shrink:0;"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="16"
            height="16"
            style="width:16px;height:16px;flex-shrink:0;"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          </svg>
        </div>

        <div style="flex:1;display:flex;flex-direction:column;min-width:0;">
          <span style="font-size:12px;font-weight:600;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-family:inherit;">
            {{ item.name }}
          </span>
          <span style="font-size:11px;color:#6b7280;font-family:inherit;">
            {{ item.quantity }} × {{ item.price.toLocaleString('fr-FR') }} FCFA
          </span>
        </div>

        <button
          style="background:none;border:none;padding:4px;cursor:pointer;color:#9ca3af;border-radius:4px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
          @click.stop="$emit('remove', index)"
          title="Retirer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            width="14"
            height="14"
            style="width:14px;height:14px;flex-shrink:0;"
          >
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
</script>
