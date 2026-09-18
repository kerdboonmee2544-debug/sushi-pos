<script setup lang="ts">
const { user, clear } = useUserSession()
const links = computed(() => {
  const role = user.value?.role
  const items: Array<{ to: string; label: string }> = []
  if (role && ['cashier', 'manager', 'admin'].includes(role)) items.push({ to: '/pos', label: 'ขายหน้าร้าน' })
  if (role && ['cashier', 'kitchen', 'manager', 'admin'].includes(role)) items.push({ to: '/kitchen', label: 'ครัว/ออเดอร์' })
  if (role && ['manager', 'admin'].includes(role)) items.push(
    { to: '/products', label: 'สินค้า' }, { to: '/members', label: 'สมาชิก' },
    { to: '/inventory', label: 'วัตถุดิบ' }, { to: '/promotions', label: 'โปรโมชัน' },
    { to: '/reports', label: 'รายงาน' }, { to: '/tables', label: 'QR โต๊ะ' }
  )
  if (role === 'admin') items.push({ to: '/staff', label: 'Staff' })
  return items
})
async function logout() { await $fetch('/api/auth/logout', { method: 'POST' }); await clear(); await navigateTo('/login') }
</script>
<template>
  <header class="topbar app-nav">
    <NuxtLink :to="user?.role === 'kitchen' ? '/kitchen' : '/pos'" class="brand">🍱 ญี่ปุ่นตามสั่ง</NuxtLink>
    <nav>
      <NuxtLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
    </nav>
    <div>
      <span>{{ user?.name }}</span>
      <button class="ghost" @click="logout">ออกจากระบบ</button>
    </div>
  </header>
</template>
