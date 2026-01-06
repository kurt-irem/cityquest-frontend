<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

const auth = useAuthStore()
const router = useRouter()

async function register() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await auth.register(username.value, password.value)
    success.value = 'Successfully registered! You can now log in.'
  } catch (e) {
    error.value = e.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}

async function login() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    success.value = 'Login successful!'
    router.push('/home')
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section style="max-width: 360px; margin: 4rem auto;">
    <h1>Login / Register</h1>
    <form @submit.prevent="login">
      <label>
        Username
        <input v-model="username" type="text" autocomplete="username" required />
      </label>
      <label style="display:block; margin-top: 0.75rem;">
        Password
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <div style="display:flex; gap:0.5rem; margin-top: 1rem;">
        <button type="button" @click="register" :disabled="loading">{{ loading ? '...' : 'Register' }}</button>
        <button type="submit" :disabled="loading">{{ loading ? '...' : 'Login' }}</button>
      </div>
    </form>
    <p v-if="success" style="color:#2e7d32; margin-top: 0.75rem;">{{ success }}</p>
    <p v-if="error" style="color:#b00020; margin-top: 0.75rem;">{{ error }}</p>
  </section>
</template>

<style scoped>
input { width: 100%; padding: 0.5rem; }
button { padding: 0.5rem 0.75rem; }
</style>
