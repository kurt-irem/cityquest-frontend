<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const username = computed(() => auth.user?.username || 'User')

async function onLogout() {
  try {
    await auth.logout()
  } finally {
    // Navigiere zuverlässig zur Login-Seite
    router.replace('/login')
    // Fallback für harte Navigation falls Router blockiert
    setTimeout(() => { window.location.assign('/login') }, 0)
  }
}
</script>

<template>
  <div class="navbar flex flex-between">
    <div class="accent-font">CityQuest</div>
    <div class="flex flex-row flex-gap-sm" >
        <div style="padding-right: 1em;">Logged in as: {{ username }}</div>
        <button @click="onLogout" class="btn btn-secondary">Logout</button>
    </div>
  </div>
</template>

<style scoped>
    .navbar{
        background-color:var(--color-secondary);
        padding: 0 2em;
        align-items: center;

        
    }
</style>

