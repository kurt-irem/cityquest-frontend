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
      <p v-if="token">JWT stored ({{ token.substring(0,20) }}...)</p>
    </div>
    <div class="block" v-if="token">
      <h3>Protected Hello</h3>
      <button @click="loadProtected" :disabled="loadingProtected">Load /api/hello</button>
      <pre v-if="protectedData">{{ protectedData }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Using Vite proxy so /api points to backend
const username = ref('demoUser')
const password = ref('demoPass')
const token = ref(localStorage.getItem('jwt') || '')
const publicData = ref('')
const protectedData = ref('')

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
  } finally {
    loadingAuth.value = false
  }
}

async function login() {
  loadingAuth.value = true
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    token.value = data.token
    localStorage.setItem('jwt', token.value)
  } finally {
    loadingAuth.value = false
  }
}

async function loadProtected() {
  loadingProtected.value = true
  protectedData.value = ''
  try {
    const res = await fetch('/api/hello', {
      headers: { Authorization: 'Bearer ' + token.value }
    })
    protectedData.value = await res.text()
  } finally {
    loadingProtected.value = false
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