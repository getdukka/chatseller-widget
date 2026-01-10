<template>
  <div class="product-card">
    <div class="product-image-container">
      <img
        v-if="product.image_url"
        :src="product.image_url"
        :alt="product.name"
        class="product-image"
        @error="handleImageError"
      />
      <div v-else class="product-image-placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
      </div>
    </div>

    <div class="product-details">
      <h3 class="product-name">{{ product.name }}</h3>

      <p v-if="product.description" class="product-description">
        {{ truncatedDescription }}
      </p>

      <p v-if="product.reason" class="product-reason">
        {{ product.reason }}
      </p>

      <div class="product-footer">
        <div class="product-price">
          {{ formattedPrice }}
        </div>

        <a
          v-if="product.url"
          :href="product.url"
          target="_blank"
          rel="noopener noreferrer"
          class="product-cta"
          @click="handleClick"
        >
          Voir le produit
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="external-icon">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </a>
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
}>()

// Tronquer la description si trop longue
const truncatedDescription = computed(() => {
  if (!props.product.description) return ''
  const maxLength = 120
  if (props.product.description.length <= maxLength) {
    return props.product.description
  }
  return props.product.description.substring(0, maxLength) + '...'
})

// Formater le prix
const formattedPrice = computed(() => {
  const price = props.product.price
  if (typeof price !== 'number') return 'Prix non disponible'

  // Déterminer la devise (FCFA pour l'Afrique, EUR sinon)
  // Pour MVP, on utilise FCFA par défaut
  return `${price.toLocaleString('fr-FR')} FCFA`
})

// Gérer les erreurs d'image
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const placeholder = img.parentElement?.querySelector('.product-image-placeholder')
  if (placeholder) {
    (placeholder as HTMLElement).style.display = 'flex'
  }
}

// Gérer le clic sur le CTA
const handleClick = () => {
  emit('click', props.product.id)
  console.log('🛒 Clic produit:', props.product.name)
}
</script>

<style scoped>
.product-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  max-width: 100%;
  margin: 8px 0;
}

.product-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.product-image-container {
  position: relative;
  width: 100%;
  height: 180px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #9ca3af;
}

.product-image-placeholder svg {
  width: 64px;
  height: 64px;
  opacity: 0.5;
}

.product-details {
  padding: 16px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-description {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.product-reason {
  font-size: 14px;
  color: #374151;
  margin: 0 0 16px 0;
  line-height: 1.5;
  padding: 12px;
  background: #f9fafb;
  border-left: 3px solid #10b981;
  border-radius: 4px;
  font-style: italic;
}

.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.product-price {
  font-size: 18px;
  font-weight: 700;
  color: #059669;
  white-space: nowrap;
}

.product-cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.product-cta:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transform: translateY(-1px);
}

.product-cta:active {
  transform: translateY(0);
}

.external-icon {
  width: 16px;
  height: 16px;
  stroke-width: 2.5;
}

/* Responsive */
@media (max-width: 480px) {
  .product-image-container {
    height: 160px;
  }

  .product-details {
    padding: 12px;
  }

  .product-name {
    font-size: 15px;
  }

  .product-description {
    font-size: 12px;
  }

  .product-reason {
    font-size: 13px;
    padding: 10px;
  }

  .product-price {
    font-size: 16px;
  }

  .product-cta {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
