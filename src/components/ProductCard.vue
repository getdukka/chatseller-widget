<template>
  <div
    style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;margin:8px 0;font-family:inherit;"
  >
    <!-- Image -->
    <div style="position:relative;width:100%;height:180px;background:linear-gradient(135deg,#f5f7fa 0%,#e9ecef 100%);overflow:hidden;max-height:180px;flex-shrink:0;">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        style="width:100%;height:100%;object-fit:cover;max-width:100%;max-height:180px;display:block;"
        @error="handleImageError"
      />
      <div v-else style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:#9ca3af;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="64" height="64" style="width:64px;height:64px;opacity:0.5;flex-shrink:0;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    </div>

    <!-- Détails -->
    <div style="padding:16px;">
      <h3 style="font-size:16px;font-weight:600;color:#1f2937;margin:0 0 8px 0;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
        {{ product.name }}
      </h3>

      <p v-if="product.description" style="font-size:13px;color:#6b7280;margin:0 0 8px 0;line-height:1.5;">
        {{ truncatedDescription }}
      </p>

      <p v-if="product.reason" style="font-size:13px;color:#374151;margin:0 0 16px 0;line-height:1.5;padding:10px 12px;background:#f0fdf4;border-left:3px solid #10b981;border-radius:4px;font-style:italic;">
        {{ product.reason }}
      </p>

      <!-- Footer : prix + boutons -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <span style="font-size:17px;font-weight:700;color:#059669;white-space:nowrap;">
          {{ formattedPrice }}
        </span>

        <div style="display:flex;gap:8px;align-items:center;flex-shrink:0;">
          <a
            v-if="product.url"
            :href="product.url"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-flex;align-items:center;gap:6px;padding:9px 16px;background:linear-gradient(135deg,#10b981 0%,#059669 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 2px 4px rgba(16,185,129,0.25);line-height:1;"
            @click="handleClick"
          >
            Voir
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14" style="width:14px;height:14px;flex-shrink:0;">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>

          <button
            style="display:inline-flex;align-items:center;padding:9px 16px;background:transparent;color:#10b981;border:2px solid #10b981;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;line-height:1;"
            @click.prevent="handleOrder"
          >
            Commander
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface ProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    reason?: string
    price: number
    image_url?: string
    url?: string
  }
}

const props = defineProps<ProductCardProps>()

const emit = defineEmits<{
  click: [productId: string]
  order: [product: ProductCardProps['product']]
}>()

const truncatedDescription = computed(() => {
  if (!props.product.description) return ''
  const maxLength = 100
  if (props.product.description.length <= maxLength) return props.product.description
  return props.product.description.substring(0, maxLength) + '...'
})

const formattedPrice = computed(() => {
  const price = props.product.price
  if (typeof price !== 'number') return 'Prix non disponible'
  return `${price.toLocaleString('fr-FR')} FCFA`
})

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const placeholder = img.parentElement?.querySelector('div')
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex'
  }
}

const handleClick = () => {
  emit('click', props.product.id)
}

const handleOrder = () => {
  emit('order', props.product)
}
</script>
