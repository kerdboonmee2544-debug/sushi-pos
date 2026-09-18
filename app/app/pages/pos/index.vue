<script setup lang="ts">
import type { ProductDto } from '#shared/types/pos'

definePageMeta({ middleware: 'auth' })
const cart = useCartStore()
const search = ref('')
const category = ref('')
const paymentMethod = ref<'cash' | 'promptpay' | 'card'>('cash')
const memberId = ref<string>('')
const promotionId = ref<string>('')
const receivedAmount = ref<number>()
const submitting = ref(false)
const message = ref('')
const receipt = ref<any>(null)
const { data: products, refresh } = await useFetch<ProductDto[]>('/api/products', { default: () => [] })
const { data: members } = await useFetch<any[]>('/api/members', { default: () => [] })
const { data: promotions } = await useFetch<any[]>('/api/promotions/active', { default: () => [] })
const preferredCategories = ['ดงบุริ', 'แกงกะหรี่ญี่ปุ่น', 'เส้น', 'ของกินเล่น', 'ข้าวปั้น', 'ซูชิ']
const categories = computed(() => {
  const available = new Set(products.value.map(product => product.category || 'อื่น ๆ'))
  const ordered = preferredCategories.filter(item => available.has(item))
  const extras = [...available].filter(item => !preferredCategories.includes(item)).sort((a, b) => a.localeCompare(b, 'th'))
  return [...ordered, ...extras]
})
const filteredProducts = computed(() => products.value.filter(product => (product.category || 'อื่น ๆ') === category.value && product.name.toLowerCase().includes(search.value.toLowerCase())))
const categoryIcons: Record<string, string> = { 'ดงบุริ': '🍚', 'แกงกะหรี่ญี่ปุ่น': '🍛', 'เส้น': '🍜', 'ของกินเล่น': '🥟', 'ข้าวปั้น': '🍙', 'ซูชิ': '🍣' }
const categoryDescriptions: Record<string, string> = {
  'ดงบุริ': 'ข้าวหน้าญี่ปุ่นหลากหลายเมนู',
  'แกงกะหรี่ญี่ปุ่น': 'แกงกะหรี่เข้มข้นพร้อมเครื่องแน่น ๆ',
  'เส้น': 'เมนูเส้นญี่ปุ่นร้อน ๆ และผัดหอม ๆ',
  'ของกินเล่น': 'ของทานเล่นสไตล์ญี่ปุ่น',
  'ข้าวปั้น': 'ข้าวปั้นหลากหลายหน้า พร้อมเสิร์ฟ',
  'ซูชิ': 'ซูชิคำพอดี สดใหม่ทุกจาน'
}
function productCount(item: string) { return products.value.filter(product => (product.category || 'อื่น ๆ') === item).length }
function selectCategory(item: string) { category.value = item; search.value = '' }
const availablePromotions = computed(() => promotions.value.filter(promotion => Number(promotion.minSpend) <= cart.subtotal))
const selectedPromotion = computed(() => availablePromotions.value.find(promotion => promotion.id === promotionId.value))
const promotionDiscount = computed(() => {
  const promotion = selectedPromotion.value
  if (!promotion) return 0
  const discount = promotion.type === 'percent'
    ? Math.round(cart.subtotal * Number(promotion.value) / 100)
    : Number(promotion.value)
  return Math.min(cart.subtotal, discount)
})
const estimatedTotal = computed(() => Math.max(0, cart.subtotal - promotionDiscount.value))

watch(availablePromotions, list => {
  if (promotionId.value && !list.some(promotion => promotion.id === promotionId.value)) promotionId.value = ''
})

function promotionLabel(promotion: any) {
  const discount = promotion.type === 'percent' ? `${Number(promotion.value)}%` : `${Number(promotion.value).toLocaleString()} ฿`
  const minimum = Number(promotion.minSpend) > 0 ? ` (ขั้นต่ำ ${Number(promotion.minSpend).toLocaleString()} ฿)` : ''
  return `${promotion.name} — ลด ${discount}${minimum}`
}

async function checkout() {
  if (!cart.items.length) return
  submitting.value = true
  message.value = ''
  try {
    const purchasedItems = cart.items.map(item => ({ ...item }))
    const result = await $fetch('/api/orders', {
      method: 'POST',
      body: {
        paymentMethod: paymentMethod.value,
        memberId: memberId.value || null,
        promotionId: promotionId.value || null,
        receivedAmount: paymentMethod.value === 'cash' ? receivedAmount.value : undefined,
        items: cart.items.map(item => ({ productId: item.productId, quantity: item.quantity }))
      }
    })
    receipt.value = { ...result, items: purchasedItems, receivedAmount: paymentMethod.value === 'cash' ? receivedAmount.value : result.total, printedAt: new Date() }
    message.value = `บันทึก ${result.orderNumber} สำเร็จ ยอด ${result.total} บาท เงินทอน ${result.change} บาท`
    cart.clear()
    promotionId.value = ''
    receivedAmount.value = undefined
    await refresh()
  } catch (error: any) {
    message.value = error?.data?.statusMessage || 'บันทึกออเดอร์ไม่สำเร็จ'
  } finally {
    submitting.value = false
  }
}

function printReceipt() { window.print() }

</script>

<template>
  <div>
    <AppNav />
    <main class="pos-layout">
      <section>
        <div v-if="!category" class="section-head"><div><p class="eyebrow">เมนูพร้อมขาย</p><h1>เลือกหมวดหมู่อาหาร</h1></div></div>
        <div v-else class="section-head"><div><button class="category-back" @click="category = ''">← กลับไปหมวดหมู่</button><h1>{{ category }}</h1></div><div class="pos-filters"><input v-model="search" class="search" placeholder="ค้นหาเมนูในหมวดนี้..."></div></div>
        <div v-if="!category" class="menu-category-grid">
          <button v-for="item in categories" :key="item" class="menu-category-card" @click="selectCategory(item)">
            <span class="menu-category-icon">{{ categoryIcons[item] || '🍱' }}</span><span><strong>{{ item }}</strong><small>{{ categoryDescriptions[item] || 'เลือกดูรายการอาหาร' }}</small><b>{{ productCount(item) }} เมนู</b></span><i>›</i>
          </button>
        </div>
        <div v-else class="product-grid">
          <article v-for="product in filteredProducts" :key="product.id" class="product-card" :class="{ 'low-stock-card': product.stock <= product.minimumStock }">
            <div class="product-image"><img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name"><span v-else>🍣</span><small v-if="product.tag">{{ product.tag }}</small><b v-if="product.stock <= product.minimumStock" class="stock-warning">⚠ ใกล้หมด</b></div>
            <div class="product-body"><h2>{{ product.name }}</h2><p>{{ product.description }}</p><div class="price-row"><strong>{{ Number(product.price).toLocaleString() }} ฿</strong><button :disabled="product.stock <= 0" @click="cart.add(product)">เพิ่ม</button></div></div>
          </article>
        </div>
      </section>
      <aside class="cart-panel">
        <div><p class="eyebrow">รายการขาย</p><h2>ตะกร้า</h2></div>
        <div v-if="!cart.items.length" class="empty">ยังไม่มีสินค้า</div>
        <div v-for="item in cart.items" :key="item.productId" class="cart-row">
          <div><strong>{{ item.name }}</strong><small>{{ item.price }} ฿ × {{ item.quantity }}</small></div>
          <div class="quantity"><button @click="cart.change(item.productId, -1)">−</button><span>{{ item.quantity }}</span><button @click="cart.change(item.productId, 1)">+</button></div>
        </div>
        <label>สมาชิก<select v-model="memberId"><option value="">ไม่ใช้สมาชิก</option><option v-for="member in members" :key="member.id" :value="member.id">{{ member.name }} — {{ member.phone }} ({{ member.discountPercent }}%)</option></select></label>
        <label>โปรโมชั่น<select v-model="promotionId"><option value="">ไม่ใช้โปรโมชั่น</option><option v-for="promotion in availablePromotions" :key="promotion.id" :value="promotion.id">{{ promotionLabel(promotion) }}</option></select></label>
        <label>วิธีชำระ<select v-model="paymentMethod"><option value="cash">เงินสด</option><option value="promptpay">พร้อมเพย์</option><option value="card">บัตร</option></select></label>
        <label v-if="paymentMethod === 'cash'">รับเงินมา<input v-model.number="receivedAmount" type="number" min="0"></label>
        <div class="total"><span>ยอดสินค้า</span><strong>{{ cart.subtotal.toLocaleString() }} ฿</strong></div>
        <div v-if="promotionDiscount" class="total"><span>ส่วนลดโปรโมชั่น</span><strong>-{{ promotionDiscount.toLocaleString() }} ฿</strong></div>
        <div v-if="promotionDiscount" class="total"><span>ยอดหลังโปรโมชั่น</span><strong>{{ estimatedTotal.toLocaleString() }} ฿</strong></div>
        <button class="checkout" :disabled="submitting || !cart.items.length" @click="checkout">{{ submitting ? 'กำลังบันทึก...' : 'ชำระเงิน' }}</button>
        <p v-if="message" class="notice">{{ message }}</p>
        <button v-if="receipt" class="secondary print-button" @click="printReceipt">🖨️ พิมพ์ใบเสร็จ</button>
      </aside>
    </main>
    <section v-if="receipt" class="receipt-print">
      <h2>🍱 ญี่ปุ่นตามสั่ง</h2><p>ใบเสร็จรับเงิน</p><p>{{ receipt.orderNumber }}</p>
      <p>{{ new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(receipt.printedAt) }}</p><hr>
      <div v-for="item in receipt.items" :key="item.productId" class="receipt-row"><span>{{item.name}} × {{item.quantity}}</span><span>{{(item.price*item.quantity).toLocaleString()}}</span></div><hr>
      <div class="receipt-row"><span>ยอดสินค้า</span><span>{{Number(receipt.subtotal).toLocaleString()}} ฿</span></div>
      <div v-if="receipt.promotionDiscount" class="receipt-row"><span>ส่วนลดโปรโมชัน{{ receipt.promotionName ? ` (${receipt.promotionName})` : '' }}</span><span>-{{Number(receipt.promotionDiscount).toLocaleString()}} ฿</span></div>
      <div v-if="receipt.memberDiscount" class="receipt-row"><span>ส่วนลดสมาชิก</span><span>-{{Number(receipt.memberDiscount).toLocaleString()}} ฿</span></div>
      <div class="receipt-row receipt-total"><strong>ยอดสุทธิ</strong><strong>{{Number(receipt.total).toLocaleString()}} ฿</strong></div>
      <div class="receipt-row"><span>รับเงิน</span><span>{{Number(receipt.receivedAmount).toLocaleString()}} ฿</span></div>
      <div class="receipt-row"><span>เงินทอน</span><span>{{Number(receipt.change).toLocaleString()}} ฿</span></div><p class="receipt-thanks">ขอบคุณที่ใช้บริการ</p>
    </section>
  </div>
</template>
