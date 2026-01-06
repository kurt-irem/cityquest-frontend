<script setup>
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
onMounted(() => {
  // Try to hydrate session on app start
  auth.fetchUser().catch(() => {})
})
</script>

<template>
  <RouterView />
</template>
