<template>
  <div class="backend-demo">
    <h2>Backend Demo</h2>
    <div class="block">
      <h3>Public Message</h3>
      <button @click="loadPublic" :disabled="loadingPublic">Load /api/message</button>
      <pre v-if="publicData">{{ publicData }}</pre>
    </div>
    <div class="block">
      <h3>Register & Login</h3>
      <input v-model="username" placeholder="username" />
      <input v-model="password" type="password" placeholder="password" />
      <button @click="register" :disabled="loadingAuth">Register</button>
      <button @click="login" :disabled="loadingAuth">Login</button>
      <p v-if="loggedIn">✅ Eingeloggt (Cookie gesetzt)</p>
    </div>
    <div class="block">
      <h3>Protected Hello</h3>
      <button @click="loadProtected" :disabled="loadingProtected">Load /api/hello</button>
      <pre v-if="protectedData">{{ protectedData }}</pre>
    </div>
    <div class="block">
      <h3>Auth Status</h3>
      <button @click="checkAuth" :disabled="loadingAuth">Check /auth/me</button>
      <pre v-if="authStatus">{{ authStatus }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Using Vite proxy so /api points to backend
const username = ref('demoUser')
const password = ref('demoPass')
const loggedIn = ref(false)
const publicData = ref('')
const protectedData = ref('')
const authStatus = ref('')

const loadingPublic = ref(false)
const loadingAuth = ref(false)
const loadingProtected = ref(false)

async function loadPublic() {
  loadingPublic.value = true
  publicData.value = ''
  try {
    const res = await fetch('/api/message')
    publicData.value = await res.text()
  } finally {
    loadingPublic.value = false
  }
}

async function register() {
  loadingAuth.value = true
  try {
    await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    alert('Registrierung erfolgreich!')
  } finally {
    loadingAuth.value = false
  }
}

async function login() {
  loadingAuth.value = true
  try {
    const basic = btoa(`${username.value}:${password.value}`)
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basic}`,
      },
      credentials: 'include' // Cookie wird vom Backend gesetzt
    })
    if (res.ok) {
      loggedIn.value = true
      alert('Login erfolgreich! Cookie wurde gesetzt.')
    } else {
      alert('Login fehlgeschlagen')
    }
  } finally {
    loadingAuth.value = false
  }
}

async function loadProtected() {
  loadingProtected.value = true
  protectedData.value = ''
  try {
    const res = await fetch('/api/hello', {
      credentials: 'include' // Cookie wird automatisch mitgesendet
    })
    if (res.ok) {
      protectedData.value = await res.text()
    } else {
      protectedData.value = 'Fehler: ' + res.status + ' (nicht authentifiziert?)'
    }
  } finally {
    loadingProtected.value = false
  }
}

async function checkAuth() {
  loadingAuth.value = true
  authStatus.value = ''
  try {
    const res = await fetch('/auth/me', {
      credentials: 'include' // Cookie wird automatisch mitgesendet
    })
    authStatus.value = await res.text()
  } catch (e) {
    authStatus.value = 'Fehler: ' + e.message
  } finally {
    loadingAuth.value = false
  }
}
</script>

<style scoped>
.backend-demo { font-family: sans-serif; max-width: 600px; }
.block { margin-bottom: 1.5rem; padding: .75rem; border: 1px solid #ccc; border-radius: 6px; }
button { margin-right: .5rem; }
pre { background:#f7f7f7; padding:.5rem; white-space:pre-wrap; word-break:break-word; }
input { display:block; margin:.25rem 0; padding:.4rem; width: 100%; max-width: 250px; }
</style>