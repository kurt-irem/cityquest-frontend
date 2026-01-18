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
    <div class="nav-links flex flex-row flex-gap-md">
      <router-link to="/home" class="nav-link">Home</router-link>
      <router-link to="/places" class="nav-link">Places</router-link>
      <router-link to="/collections" class="nav-link">Collections</router-link>
      <router-link to="/visits" class="nav-link">My Visits</router-link>
    </div>
    <div class="flex flex-row flex-gap-sm">
      <div style="padding-right: 1em;">Logged in as: {{ username }}</div>
      <button @click="onLogout" class="btn btn-secondary">Logout</button>
    </div>
  </div>
</template>

<style scoped>
    .navbar {
        background-color: var(--color-secondary);
        padding: 0 2em;
        align-items: center;
    }

    .nav-links {
        flex: 1;
        justify-content: center;
    }

    .nav-link {
        color: inherit;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: background-color 0.2s;
    }

    .nav-link:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .nav-link.router-link-active {
        background-color: rgba(0, 0, 0, 0.2);
        font-weight: 500;
    }
</style>

