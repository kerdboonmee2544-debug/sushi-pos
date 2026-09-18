import type { CartLine, ProductDto } from '#shared/types/pos'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartLine[]>([])
  const subtotal = computed(() => items.value.reduce((sum, item) => sum + item.price * item.quantity, 0))

  function add(product: ProductDto) {
    const existing = items.value.find(item => item.productId === product.id)
    if (existing) {
      if (existing.quantity < product.stock) existing.quantity++
      return
    }
    items.value.push({ productId: product.id, name: product.name, price: Number(product.price), quantity: 1, availableStock: product.stock })
  }

  function change(productId: string, delta: number) {
    const item = items.value.find(row => row.productId === productId)
    if (!item) return
    item.quantity = Math.min(item.availableStock, item.quantity + delta)
    if (item.quantity <= 0) items.value = items.value.filter(row => row.productId !== productId)
  }

  function clear() { items.value = [] }
  return { items, subtotal, add, change, clear }
})
