<script setup lang="ts">
import QRCode from 'qrcode'
definePageMeta({ middleware: 'auth' })
const { user } = useUserSession()
const tableCount = ref(10)
const origin = ref('')
const codes = ref<Array<{ table: number, url: string, image: string }>>([])
async function generate() {
  if (!origin.value || !user.value?.shopId) return
  codes.value = await Promise.all(Array.from({ length: Math.max(1, Math.min(100, tableCount.value)) }, async (_, index) => {
    const table = index + 1
    const url = `${origin.value}/menu/${table}?shop=${user.value!.shopId}`
    return { table, url, image: await QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M' }) }
  }))
}
onMounted(async () => { origin.value = window.location.origin; await generate() })
function printCodes() { window.print() }
</script>
<template><div><div class="qr-screen"><AppNav/></div><main class="admin-page tables-page"><div class="page-title qr-screen"><div><p class="eyebrow">Table ordering</p><h1>QR สั่งอาหารประจำโต๊ะ</h1></div><div class="table-tools"><label>จำนวนโต๊ะ<input v-model.number="tableCount" type="number" min="1" max="100"></label><button @click="generate">สร้าง QR</button><button class="secondary" @click="printCodes">พิมพ์ QR</button></div></div><div class="qr-grid"><article v-for="code in codes" :key="code.table" class="qr-card"><h2>โต๊ะ {{ code.table }}</h2><img :src="code.image" :alt="`QR โต๊ะ ${code.table}`"><p>สแกนเพื่อสั่งอาหาร</p><small>{{ code.url }}</small></article></div></main></div></template>
