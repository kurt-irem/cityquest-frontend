<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import PlaceCard from '@/components/PlaceCard.vue'
import PlacesManager from '@/components/PlacesManager.vue'

const places = ref([])
const loading = ref(false)
const error = ref('')

async function loadPlaces() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/places', { credentials: 'include' })
    if (!res.ok) throw new Error('Could not load places')
    places.value = await res.json()
  } catch (e) {
    error.value = e.message || 'Could not load places'
  } finally {
    loading.value = false
  }
}

onMounted(loadPlaces)
</script>

<template>
  <header><NavBar /></header>
  <PlacesManager></PlacesManager>
  <!-- <div class="places-view container">
    <h2>All Places</h2>
    
    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="places.length === 0" class="muted">No places found</div>

    <div v-else class="grid">
      <PlaceCard v-for="place in places" :key="place.id" :place="place" mode="collection" />
    </div>
  </div> -->
</template>

<style scoped>
.container {
  padding: 2rem 0;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

.muted {
  color: #777;
  margin-top: 1rem;
}
</style>
