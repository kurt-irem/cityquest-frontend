<script setup>
import { ref } from 'vue'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

async function register() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Registrierung fehlgeschlagen')
    }
    success.value = 'Erfolgreich registriert! Du kannst dich jetzt anmelden.'
  } catch (e) {
    error.value = e.message || 'Registrierung fehlgeschlagen'
  } finally {
    loading.value = false
  }
}

async function login() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    const basic = btoa(`${username.value}:${password.value}`)
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
      },
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(text || 'Login fehlgeschlagen')
    }
    const data = await res.json()
    const token = data && (data.token || data.jwt || data.accessToken)
    if (!token) throw new Error('Kein Token erhalten')
    localStorage.setItem('jwt', token)
    window.location.href = '/home'
  } catch (e) {
    error.value = e.message || 'Login fehlgeschlagen'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section style="max-width: 360px; margin: 4rem auto;">
    <h1>Anmelden / Registrieren</h1>
    <form @submit.prevent="login">
      <label>
        Benutzername
        <input v-model="username" type="text" autocomplete="username" required />
      </label>
      <label style="display:block; margin-top: 0.75rem;">
        Passwort
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <div style="display:flex; gap:0.5rem; margin-top: 1rem;">
        <button type="button" @click="register" :disabled="loading">{{ loading ? '...' : 'Registrieren' }}</button>
        <button type="submit" :disabled="loading">{{ loading ? '...' : 'Anmelden' }}</button>
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
