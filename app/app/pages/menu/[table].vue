<script setup lang="ts">
const route = useRoute()
const tableNumber = computed(() => Number(route.params.table))
const shopId = computed(() => String(route.query.shop || ''))
const { data, status, refresh } = await useFetch<any>('/api/public/menu', { query: { shop: shopId }, default: () => ({ shopName: 'ร้านอาหาร', products: [] }) })
const category = ref('')
const cart = ref<Array<{ productId: string, name: string, price: number, quantity: number, stock: number }>>([])
const sending = ref(false)
const message = ref('')
const success = ref<any>(null)
const preferredCategories = ['ดงบุริ', 'แกงกะหรี่ญี่ปุ่น', 'เส้น', 'ของกินเล่น', 'ข้าวปั้น', 'ซูชิ']
const categories = computed<string[]>(() => {
  const available = new Set<string>(data.value.products.map((product: any) => String(product.category || 'อื่น ๆ')))
  const ordered = preferredCategories.filter(item => available.has(item))
  const extras = [...available].filter(item => !preferredCategories.includes(item)).sort((a, b) => a.localeCompare(b, 'th'))
  return [...ordered, ...extras]
})
const products = computed(() => data.value.products.filter((product: any) => (product.category || 'อื่น ๆ') === category.value))
const categoryIcons: Record<string, string> = { 'ดงบุริ': '🍚', 'แกงกะหรี่ญี่ปุ่น': '🍛', 'เส้น': '🍜', 'ของกินเล่น': '🥟', 'ข้าวปั้น': '🍙', 'ซูชิ': '🍣' }
const categoryDescriptions: Record<string, string> = {
  'ดงบุริ': 'ข้าวหน้าญี่ปุ่นหลากหลายเมนู',
  'แกงกะหรี่ญี่ปุ่น': 'แกงกะหรี่เข้มข้นพร้อมเครื่องแน่น ๆ',
  'เส้น': 'เมนูเส้นญี่ปุ่นร้อน ๆ และผัดหอม ๆ',
  'ของกินเล่น': 'ของทานเล่นสไตล์ญี่ปุ่น',
  'ข้าวปั้น': 'ข้าวปั้นหลากหลายหน้า พร้อมเสิร์ฟ',
  'ซูชิ': 'ซูชิคำพอดี สดใหม่ทุกจาน'
}
function productCount(item: string) { return data.value.products.filter((product: any) => (product.category || 'อื่น ๆ') === item).length }
const total = computed(() => cart.value.reduce((sum, item) => sum + item.price * item.quantity, 0))
function add(product: any) {
  const item = cart.value.find(row => row.productId === product.id)
  if (item) { if (item.quantity < item.stock) item.quantity++ }
  else cart.value.push({ productId: product.id, name: product.name, price: Number(product.price), quantity: 1, stock: product.stock })
}
function change(id: string, amount: number) {
  const item = cart.value.find(row => row.productId === id)
  if (!item) return
  item.quantity = Math.min(item.stock, item.quantity + amount)
  if (item.quantity <= 0) cart.value = cart.value.filter(row => row.productId !== id)
}
async function order() {
  if (!cart.value.length || !Number.isInteger(tableNumber.value) || !shopId.value) return
  sending.value = true; message.value = ''
  try {
    success.value = await $fetch('/api/public/orders', { method: 'POST', body: { shopId: shopId.value, tableNumber: tableNumber.value, items: cart.value.map(item => ({ productId: item.productId, quantity: item.quantity })) } })
    cart.value = []; await refresh()
  } catch (error: any) { message.value = error?.data?.statusMessage || 'ส่งออเดอร์ไม่สำเร็จ กรุณาแจ้งพนักงาน' }
  finally { sending.value = false }
}
</script>
<template><main class="customer-menu">
  <header class="customer-header"><div><p>🍣 {{ data.shopName }}</p><h1>สั่งอาหาร — โต๊ะ {{ tableNumber }}</h1></div><strong>{{ cart.length }} รายการ</strong></header>
  <p v-if="!shopId || !Number.isInteger(tableNumber)" class="customer-error">QR ไม่ถูกต้อง กรุณาสแกนใหม่หรือแจ้งพนักงาน</p>
  <template v-else>
    <section v-if="!category" class="customer-category-home"><div class="customer-category-heading"><p>เมนูอาหารญี่ปุ่น</p><h2>เลือกหมวดหมู่</h2></div><div class="menu-category-grid customer-category-grid"><button v-for="item in categories" :key="item" class="menu-category-card" @click="category = item"><span class="menu-category-icon">{{ categoryIcons[item] || '🍱' }}</span><span><strong>{{ item }}</strong><small>{{ categoryDescriptions[item] || 'เลือกดูรายการอาหาร' }}</small><b>{{ productCount(item) }} เมนู</b></span><i>›</i></button></div></section>
    <template v-else><div class="customer-category-toolbar"><button class="category-back" @click="category = ''">← หมวดหมู่</button><h2>{{ category }}</h2></div>
    <p v-if="status === 'pending'">กำลังโหลดเมนู...</p><section class="customer-products"><article v-for="product in products" :key="product.id"><div class="customer-product-image"><img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"><span v-else>{{ categoryIcons[product.category] || '🍱' }}</span></div><div><small>{{ product.category }}</small><h2>{{ product.name }}</h2><p>{{ product.description }}</p><footer><strong>{{ Number(product.price).toLocaleString() }} ฿</strong><button @click="add(product)">เพิ่ม</button></footer></div></article></section></template>
    <aside class="customer-cart"><h2>รายการโต๊ะ {{ tableNumber }}</h2><p v-if="!cart.length" class="empty">ยังไม่ได้เลือกอาหาร</p><div v-for="item in cart" :key="item.productId" class="customer-cart-row"><span><strong>{{ item.name }}</strong><small>{{ item.price.toLocaleString() }} ฿</small></span><span class="quantity"><button @click="change(item.productId,-1)">−</button><b>{{ item.quantity }}</b><button @click="change(item.productId,1)">+</button></span></div><div class="customer-total"><span>รวม</span><strong>{{ total.toLocaleString() }} ฿</strong></div><button class="customer-submit" :disabled="sending || !cart.length" @click="order">{{ sending ? 'กำลังส่ง...' : 'ยืนยันส่งเข้าครัว' }}</button><p v-if="message" class="error">{{ message }}</p></aside>
  </template>
  <div v-if="success" class="order-success"><div><span>✓</span><h2>ส่งออเดอร์เข้าครัวแล้ว</h2><p>โต๊ะ {{ success.tableNumber }}</p><strong>{{ success.orderNumber }}</strong><button @click="success = null">สั่งเพิ่ม</button></div></div>
</main></template>
