<script setup>
import { ref, onMounted } from 'vue'

const places = ref([])
const myPlaces = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

// Form state
const showForm = ref(false)
const formData = ref({
  name: '',
  address: '',
  category: '',
  latitude: null,
  longitude: null,
  googlePlaceId: '',
  googleMapsUrl: ''
})
const editingId = ref(null)

// Filter/Search
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['Restaurant', 'Museum', 'Park', 'Sehenswürdigkeit', 'Cafe', 'Andere']

// Load all places
async function loadAllPlaces() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/places', {
      credentials: 'include'
    })
    if (res.ok) {
      places.value = await res.json()
    }
  } catch (e) {
    error.value = 'Fehler beim Laden: ' + e.message
  } finally {
    loading.value = false
  }
}

// Load my places (authenticated)
async function loadMyPlaces() {
  try {
    const res = await fetch('/api/places/my-places', {
      credentials: 'include'
    })
    if (res.ok) {
      myPlaces.value = await res.json()
    }
  } catch (e) {
    console.error(e)
  }
}

// Create place
async function createPlace() {
  if (!formData.value.name) {
    error.value = 'Name ist erforderlich'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value),
      credentials: 'include'
    })

    if (res.ok) {
      success.value = 'Place erstellt!'
      resetForm()
      await loadAllPlaces()
      await loadMyPlaces()
      showForm.value = false
    } else {
      error.value = 'Fehler beim Erstellen'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Update place
async function updatePlace() {
  if (!editingId.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const res = await fetch(`/api/places/${editingId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value),
      credentials: 'include'
    })

    if (res.ok) {
      success.value = 'Place aktualisiert!'
      resetForm()
      await loadAllPlaces()
      await loadMyPlaces()
      showForm.value = false
    } else if (res.status === 403) {
      error.value = 'Du darfst diesen Place nicht bearbeiten'
    } else {
      error.value = 'Fehler beim Aktualisieren'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Delete place
async function deletePlace(id) {
  if (!confirm('Wirklich löschen?')) return

  try {
    const res = await fetch(`/api/places/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (res.ok) {
      success.value = 'Place gelöscht!'
      await loadAllPlaces()
      await loadMyPlaces()
    } else if (res.status === 403) {
      error.value = 'Du darfst diesen Place nicht löschen'
    }
  } catch (e) {
    error.value = e.message
  }
}

// Edit place
function editPlace(place) {
  editingId.value = place.id
  formData.value = { ...place }
  showForm.value = true
}

// Reset form
function resetForm() {
  formData.value = {
    name: '',
    address: '',
    category: '',
    latitude: null,
    longitude: null,
    googlePlaceId: '',
    googleMapsUrl: ''
  }
  editingId.value = null
}

// Search places
async function searchPlaces() {
  if (!searchQuery.value) {
    await loadAllPlaces()
    return
  }

  loading.value = true
  try {
    const res = await fetch(`/api/places/search?name=${encodeURIComponent(searchQuery.value)}`, {
      credentials: 'include'
    })
    if (res.ok) {
      places.value = await res.json()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Filter by category
async function filterByCategory() {
  if (!selectedCategory.value) {
    await loadAllPlaces()
    return
  }

  loading.value = true
  try {
    const res = await fetch(`/api/places/category/${encodeURIComponent(selectedCategory.value)}`, {
      credentials: 'include'
    })
    if (res.ok) {
      places.value = await res.json()
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllPlaces()
  loadMyPlaces()
})
</script>

<template>
  <div class="places-container container">
    <h1>Places</h1>

    <!-- Messages -->
    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <!-- Create Button -->
    <button 
      v-if="!showForm"
      @click="showForm = true"
      class="btn btn-primary mb-md">
      + Neuer Place
    </button>

    <!-- Create/Edit Form -->
    <div v-if="showForm" class="card p-lg mb-lg">
      <h2>{{ editingId ? 'Place bearbeiten' : 'Neuer Place' }}</h2>
      
      <label>Name *</label>
      <input v-model="formData.name" type="text" placeholder="Name des Ortes" />

      <label style="margin-top: 0.75rem;">Adresse</label>
      <input v-model="formData.address" type="text" placeholder="Adresse" />

      <label style="margin-top: 0.75rem;">Kategorie</label>
      <select v-model="formData.category">
        <option value="">Wähle eine Kategorie</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <label style="margin-top: 0.75rem;">Breitengrad</label>
      <input v-model.number="formData.latitude" type="number" step="0.0001" placeholder="z.B. 52.5200" />

      <label style="margin-top: 0.75rem;">Längengrad</label>
      <input v-model.number="formData.longitude" type="number" step="0.0001" placeholder="z.B. 13.4050" />

      <label style="margin-top: 0.75rem;">Google Place ID</label>
      <input v-model="formData.googlePlaceId" type="text" />

      <label style="margin-top: 0.75rem;">Google Maps URL</label>
      <input v-model="formData.googleMapsUrl" type="url" />

      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button 
          @click="editingId ? updatePlace() : createPlace()"
          class="btn btn-primary"
          :disabled="loading">
          {{ loading ? '...' : (editingId ? 'Aktualisieren' : 'Erstellen') }}
        </button>
        <button 
          @click="showForm = false; resetForm()"
          class="btn btn-secondary">
          Abbrechen
        </button>
      </div>
    </div>

    <!-- Search and Filter -->
    <div class="flex flex-gap-md mb-lg" style="flex-wrap: wrap;">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Nach Place suchen..."
        @keyup.enter="searchPlaces"
        style="flex: 1; min-width: 200px;">
      
      <select 
        v-model="selectedCategory"
        @change="filterByCategory"
        style="min-width: 150px;">
        <option value="">Alle Kategorien</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <button @click="searchPlaces" class="btn btn-secondary">Suchen</button>
      <button @click="loadAllPlaces()" class="btn btn-outline">Reset</button>
    </div>

    <!-- My Places Tab -->
    <div style="margin-bottom: 2rem;">
      <h2>Meine Places ({{ myPlaces.length }})</h2>
      <div v-if="myPlaces.length === 0" style="color: #999;">Keine Places erstellt</div>
      <div v-else class="grid grid-2">
        <div v-for="place in myPlaces" :key="place.id" class="card">
          <h3>{{ place.name }}</h3>
          <p><strong>Kategorie:</strong> {{ place.category || '-' }}</p>
          <p><strong>Adresse:</strong> {{ place.address || '-' }}</p>
          <p><strong>Erstellt von:</strong> {{ place.createdByUsername }}</p>
          <div class="flex flex-gap-sm">
            <button @click="editPlace(place)" class="btn btn-primary btn-sm">Bearbeiten</button>
            <button @click="deletePlace(place.id)" class="btn btn-error btn-sm">Löschen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- All Places -->
    <div>
      <h2>Alle Places ({{ places.length }})</h2>
      <div v-if="loading" style="text-align: center; padding: 2rem;">Laden...</div>
      <div v-else-if="places.length === 0" style="color: #999;">Keine Places gefunden</div>
      <div v-else class="grid grid-2">
        <div v-for="place in places" :key="place.id" class="card">
          <h3>{{ place.name }}</h3>
          <p><strong>Kategorie:</strong> {{ place.category || '-' }}</p>
          <p><strong>Adresse:</strong> {{ place.address || '-' }}</p>
          <p v-if="place.latitude && place.longitude">
            <strong>Koordinaten:</strong> {{ place.latitude }}, {{ place.longitude }}
          </p>
          <p><strong>Erstellt von:</strong> {{ place.createdByUsername }}</p>
          <p><strong>Erstellt am:</strong> {{ new Date(place.createdAt).toLocaleDateString('de-DE') }}</p>
          <div v-if="place.googleMapsUrl" style="margin-top: 0.5rem;">
            <a :href="place.googleMapsUrl" target="_blank" class="btn btn-outline btn-sm">
              Auf Google Maps anschauen
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.places-container {
  padding: 2rem 0;
}

h1 {
  margin-bottom: 2rem;
}

h2 {
  margin: 2rem 0 1rem 0;
}

.grid {
  margin-bottom: 2rem;
}
</style>
