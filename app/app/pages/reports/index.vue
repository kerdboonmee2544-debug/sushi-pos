<script setup lang="ts">
definePageMeta({ middleware:'auth' })
const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date())
const start = ref(`${today.slice(0,7)}-01`)
const end = ref(today)
const report = ref<any>()
const loading = ref(false)
const requestFetch = useRequestFetch()
const paymentLabels:Record<string,string>={cash:'เงินสด',promptpay:'พร้อมเพย์',card:'บัตร',other:'อื่น ๆ'}
async function load(){loading.value=true;try{report.value=await requestFetch('/api/reports/summary',{query:{start:start.value,end:end.value}})}finally{loading.value=false}}
function money(value:unknown){return Number(value||0).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})}
function thaiDate(value:string){return new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeZone:'Asia/Bangkok'}).format(new Date(`${value}T00:00:00+07:00`))}
function orderDate(value:string){const date=value.endsWith('Z')?value.replace(/Z$/,'+07:00'):value;return new Intl.DateTimeFormat('th-TH',{dateStyle:'short',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date(date))}
function printReport(){window.print()}
await load()
</script>

<template><div><div class="report-screen"><AppNav/></div><main class="admin-page report-page">
  <div class="page-title report-screen"><div><p class="eyebrow">Sales report</p><h1>รายงานยอดขาย</h1></div><div class="report-actions"><label>ตั้งแต่<input v-model="start" type="date"></label><label>ถึง<input v-model="end" type="date"></label><button :disabled="loading" @click="load">{{loading?'กำลังโหลด...':'แสดงรายงาน'}}</button><button class="secondary" @click="printReport">พิมพ์ / บันทึก PDF</button></div></div>
  <section v-if="report" class="report-print">
    <header class="report-header"><div class="report-logo">🍱</div><div><h2>{{report.shop?.name||'ญี่ปุ่นตามสั่ง'}}</h2><p>{{report.shop?.slogan}}</p><h1>รายงานสรุปยอดขาย</h1><strong>ประจำวันที่ {{thaiDate(report.range.start)}} ถึง {{thaiDate(report.range.end)}}</strong></div></header>
    <div class="report-summary"><article><span>ยอดขายสุทธิ</span><strong>{{money(report.totals.sales)}} ฿</strong></article><article><span>จำนวนบิล</span><strong>{{report.totals.bills}} บิล</strong></article><article><span>ส่วนลดรวม</span><strong>{{money(report.totals.discounts)}} ฿</strong></article><article><span>เฉลี่ยต่อบิล</span><strong>{{money(report.totals.averageBill)}} ฿</strong></article></div>
    <section class="report-section"><h3>รายละเอียดการขาย</h3><div class="report-table-wrap"><table class="report-table"><thead><tr><th>ลำดับ</th><th>วันเวลา</th><th>เลขออเดอร์</th><th>พนักงาน</th><th>สมาชิก</th><th class="number quantity-column">จำนวน</th><th class="number money-column">ส่วนลด</th><th class="number money-column">ยอดสุทธิ</th><th>ชำระ</th></tr></thead><tbody><tr v-for="(order,index) in report.orders" :key="order.orderNumber"><td>{{Number(index)+1}}</td><td>{{orderDate(order.createdAt)}}</td><td>{{order.orderNumber}}</td><td>{{order.staffName}}</td><td>{{order.memberName}}</td><td class="number quantity-column">{{order.itemQuantity}}</td><td class="number money-column">{{money(order.discount)}}</td><td class="number money-column">{{money(order.total)}}</td><td>{{paymentLabels[order.paymentMethod]}}</td></tr><tr v-if="!report.orders.length"><td colspan="9" class="no-data">ไม่มีรายการขายในช่วงเวลานี้</td></tr></tbody><tfoot><tr><th colspan="7">รวมยอดขายสุทธิ</th><th class="number money-column">{{money(report.totals.sales)}}</th><th>บาท</th></tr></tfoot></table></div></section>
    <div class="report-columns"><section class="report-section"><h3>สินค้าขายดี</h3><table class="report-table compact"><thead><tr><th>อันดับ</th><th>สินค้า</th><th class="number quantity-column">จำนวน</th><th class="number money-column">ยอดขาย</th></tr></thead><tbody><tr v-for="(product,index) in report.topProducts" :key="product.name"><td>{{Number(index)+1}}</td><td>{{product.name}}</td><td class="number quantity-column">{{product.quantity}}</td><td class="number money-column">{{money(product.sales)}}</td></tr></tbody></table></section><section class="report-section"><h3>ช่องทางชำระเงิน</h3><table class="report-table compact"><thead><tr><th>ช่องทาง</th><th class="number quantity-column">จำนวนบิล</th><th class="number money-column">ยอดเงิน</th></tr></thead><tbody><tr v-for="payment in report.payments" :key="payment.method"><td>{{paymentLabels[payment.method]}}</td><td class="number quantity-column">{{payment.bills}}</td><td class="number money-column">{{money(payment.amount)}}</td></tr></tbody></table></section></div>
    <footer class="report-footer"><span>พิมพ์เมื่อ {{new Intl.DateTimeFormat('th-TH',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Bangkok'}).format(new Date())}}</span><span>รายงานจากระบบญี่ปุ่นตามสั่ง POS</span></footer>
  </section>
</main></div></template>

