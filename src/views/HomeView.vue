<script setup>
import PlacesManager from '../components/PlacesManager.vue'
import CollectionsManager from '../components/CollectionsManager.vue'

async function logout() {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include'
    })
  } finally {
    window.location.href = '/login'
  }
}
</script>

<template>
  <div>
    <header style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #f5f5f5;">
      <h1 style="margin: 0;">CityQuest</h1>
      <button @click="logout" class="btn btn-secondary">Abmelden</button>
    </header>
    <PlacesManager />
    <CollectionsManager />
  </div>
</template>
