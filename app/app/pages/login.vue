<script setup lang="ts">
const username = ref('admin')
const password = ref('')
const pending = ref(false)
const errorMessage = ref('')
const { fetch } = useUserSession()

async function login() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { username: username.value, password: password.value } })
    await fetch()
    await navigateTo('/pos')
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <form class="login-card" @submit.prevent="login">
      <div class="brand-mark">🍣</div>
      <h1>ญี่ปุ่นตามสั่ง POS</h1>
      <p>เข้าสู่ระบบพนักงาน</p>
      <label>ชื่อผู้ใช้<input v-model="username" autocomplete="username" required></label>
      <label>รหัสผ่าน<input v-model="password" type="password" autocomplete="current-password" placeholder="อย่างน้อย 8 ตัวอักษร" required minlength="8"></label>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button :disabled="pending">{{ pending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ' }}</button>
    </form>
  </main>
</template>
