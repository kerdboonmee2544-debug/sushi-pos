<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
const { data: orders, refresh: refreshOrders, status } = await useFetch<any[]>('/api/orders', { default: () => [] })
const { user } = useUserSession()
const busy = ref('')
const statusLabels = { pending: 'รอทำ', preparing: 'กำลังทำ', completed: 'เสร็จแล้ว' } as const
function refresh(_event?: PointerEvent) { return refreshOrders() }
function localDateTime(value: string) {
  const thaiTime = value.endsWith('Z') ? value.replace(/Z$/, '+07:00') : value
  return new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(thaiTime))
}
async function setStatus(id: string, nextStatus: 'pending' | 'preparing' | 'completed') {
  busy.value = id
  try { await $fetch(`/api/orders/${id}/status`, { method: 'PATCH', body: { status: nextStatus } }); await refresh() }
  finally { busy.value = '' }
}
async function cancelOrder(id: string) {
  if (!confirm('ยืนยันการยกเลิกออเดอร์และคืนสต็อก?')) return
  busy.value = id
  try { await $fetch(`/api/orders/${id}/cancel`, { method: 'POST' }); await refresh() }
  finally { busy.value = '' }
}
</script>
<template><div><AppNav/><main class="admin-page">
  <div class="page-title"><div><p class="eyebrow">Kitchen display</p><h1>ออเดอร์เข้าครัว</h1></div><button class="secondary" @click="refresh">รีเฟรช</button></div>
  <p v-if="status === 'pending'">กำลังโหลด...</p><p v-else-if="!orders.length" class="empty">ไม่มีออเดอร์ที่กำลังดำเนินการ</p>
  <div class="order-board"><article v-for="order in orders" :key="order.id" class="order-ticket" :class="`order-${order.status}`">
    <div><strong>{{ order.orderNumber }}</strong><span class="status-pill" :class="`status-${order.status}`">{{ statusLabels[order.status as keyof typeof statusLabels] }}</span></div>
    <p v-if="order.customerReference" class="table-reference">{{ order.customerReference }}</p>
    <ul class="order-items"><li v-for="item in order.items" :key="item.id"><strong>{{ item.quantity }} ×</strong> {{ item.productName }}</li></ul>
    <p>{{ localDateTime(order.createdAt) }}</p><strong>{{ Number(order.total).toLocaleString() }} ฿</strong>
    <div class="actions"><select v-if="user?.role !== 'cashier'" :value="order.status" :disabled="busy === order.id" @change="setStatus(order.id, ($event.target as HTMLSelectElement).value as any)"><option value="pending">รอทำ</option><option value="preparing">กำลังทำ</option><option value="completed">เสร็จแล้ว</option></select><span v-else class="view-only-note">ดูสถานะเท่านั้น</span><button v-if="['manager','admin'].includes(user?.role || '')" class="danger" :disabled="busy === order.id" @click="cancelOrder(order.id)">ยกเลิกออเดอร์</button></div>
  </article></div>
</main></div></template>
