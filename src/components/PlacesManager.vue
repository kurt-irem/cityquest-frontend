<script setup>
import { ref, onMounted, computed } from 'vue'
import PlaceCard from '@/components/PlaceCard.vue'

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
const activeSource = ref('all') // 'all' | 'mine'

// Filter/Search
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['Restaurant', 'Museum', 'Park', 'Sight', 'Cafe', 'Other']

const filteredPlaces = computed(() => {
  const pool = activeSource.value === 'mine' ? myPlaces.value : places.value
  const term = searchQuery.value.trim().toLowerCase()
  return pool.filter(p => {
    const matchesSearch = term
      ? (p.name || '').toLowerCase().includes(term) || (p.address || '').toLowerCase().includes(term)
      : true
    const matchesCategory = selectedCategory.value
      ? (p.category || '').toLowerCase() === selectedCategory.value.toLowerCase() || (p.tags || []).some(t => t && t.toLowerCase() === selectedCategory.value.toLowerCase())
      : true
    return matchesSearch && matchesCategory
  })
})

// Load all places (public list; keep for global view)
async function loadAllPlaces() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/places', { credentials: 'include', cache: 'no-store' })
    if (res.ok) {
      places.value = await res.json()
    }
  } catch (e) {
    error.value = 'Error loading: ' + e.message
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
    error.value = 'Name is required'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    console.log('Creating place:', formData.value)
    const res = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData.value),
      credentials: 'include'
    })

    console.log('Response status:', res.status)
    if (res.ok) {
      success.value = 'Place created!'
      resetForm()
      await loadMyPlaces()
      await loadAllPlaces()
      showForm.value = false
    } else {
      const errorText = await res.text()
      console.error('Error response:', errorText)
      error.value = `Error creating place (${res.status})`
    }
  } catch (e) {
    console.error('Exception:', e)
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
      success.value = 'Place updated!'
      resetForm()
      await loadMyPlaces()
      await loadAllPlaces()
      showForm.value = false
    } else if (res.status === 403) {
      error.value = 'You are not allowed to edit this place'
    } else {
      error.value = 'Error updating place'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

// Delete place
async function deletePlace(id) {
  if (!confirm('Really delete?')) return

  try {
    const res = await fetch(`/api/places/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    })

    if (res.ok) {
      success.value = 'Place deleted!'
      await loadMyPlaces()
      await loadAllPlaces()
    } else if (res.status === 403) {
      error.value = 'You are not allowed to delete this place'
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

//Search and filter (kept for later, currently unused)
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
  <div class="places-view container">
    <section class="hero">
      <div>
        <h1>Places</h1>
        <p class="subtitle">Save places in your collection, choose from existing places or create new ones</p>
      </div>
      <button class="btn btn-primary" @click="showForm = true">+ New Place</button>
    </section>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div class="controls">
      <div class="search-bar">
        <span class="material-icons search-icon">search</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search places by name or address"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
      </div>

      <div class="sort-bar">
        <button
          class="pill"
          :class="{ active: activeSource === 'all' }"
          @click="activeSource = 'all'"
        >
          All places
        </button>
        <button
          class="pill"
          :class="{ active: activeSource === 'mine' }"
          @click="activeSource = 'mine'"
        >
          My places
        </button>

        <div class="divider" aria-hidden="true"></div>

        <button
          class="pill"
          :class="{ active: selectedCategory === '' }"
          @click="selectedCategory = ''"
        >
          All tags
        </button>
        <button
          v-for="cat in categories"
          :key="cat"
          class="pill"
          :class="{ active: selectedCategory === cat }"
          @click="selectedCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="list">
      <div v-if="filteredPlaces.length === 0" class="empty">No places found</div>
      <div v-else class="list-item" v-for="place in filteredPlaces" :key="place.id">
        <PlaceCard
          :place="place"
          :showActions="activeSource === 'mine'"
          :mode="'collection'"
          @edit="editPlace"
          @delete="deletePlace"
        />
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editingId ? 'Edit Place' : 'New Place' }}</h2>
          <button class="btn-ghost" @click="showForm = false">✕</button>
        </div>

        <label>Name *</label>
        <input v-model="formData.name" type="text" placeholder="Place name" />

        <label>Address</label>
        <input v-model="formData.address" type="text" placeholder="Address" />

        <label>Category</label>
        <select v-model="formData.category">
          <option value="">Select a category</option>
          <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
        </select>

        <!-- <div class="grid grid-2" style="margin-top: 0.75rem;">
          <div>
            <label>Latitude</label>
            <input v-model.number="formData.latitude" type="number" step="0.0001" placeholder="e.g. 52.5200" />
          </div>
          <div>
            <label>Longitude</label>
            <input v-model.number="formData.longitude" type="number" step="0.0001" placeholder="e.g. 13.4050" />
          </div>
        </div> -->

        <label>Google Place ID</label>
        <input v-model="formData.googlePlaceId" type="text" />

        <label>Google Maps URL</label>
        <input v-model="formData.googleMapsUrl" type="url" />

        <div class="modal-actions">
          <button 
            @click="editingId ? updatePlace() : createPlace()"
            class="btn btn-primary"
            :disabled="loading">
            {{ loading ? '...' : (editingId ? 'Update' : 'Create') }}
          </button>
          <button @click="showForm = false; resetForm()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.places-view {
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.subtitle {
  margin-top: 0.25rem;
  color: #555;
  max-width: 720px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #dcdcdc;
  border-radius: 10px;
  padding: 0.35rem 0.6rem;
  background: #fafafa;
}

.search-bar input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
}

.search-icon {
  color: #777;
  font-size: 20px;
}

.clear-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem 0.4rem;
  color: #777;
  border-radius: 6px;
}

.clear-btn:hover {
  background: #eee;
}

.sort-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pill {
  border: 1px solid #dcdcdc;
  background: #f7f7f7;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.pill.active {
  background: #cfe8ff;
  border-color: #76a9fa;
  color: #0f4fa8;
}

.pill:hover {
  background: #ececec;
}

.divider {
  width: 1px;
  height: 28px;
  background: #e0e0e0;
  margin: 0 0.25rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading,
.empty {
  color: #666;
  margin-top: 0.5rem;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 50;
}

.modal {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 720px;
  width: min(720px, 95vw);
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.modal-actions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.modal-actions .btn-primary {
  grid-column: 2;
  justify-self: center;
  width: 160px;
}

.modal-actions .btn-secondary {
  grid-column: 3;
  justify-self: end;
  width: 140px;
}

.btn-ghost {
  background: transparent;
  border: none;
  font-size: 1.1rem;
  cursor: pointer;
}

.grid {
  display: grid;
  gap: 0.75rem;
}

.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

input,
textarea,
select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d2d2d2;
  border-radius: 8px;
  margin-top: 0.15rem;
  margin-bottom: 0.35rem;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .sort-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .modal-actions {
    grid-template-columns: 1fr;
    justify-items: stretch;
  }

  .modal-actions .btn-primary,
  .modal-actions .btn-secondary {
    grid-column: auto;
    justify-self: stretch;
    width: 100%;
  }
}
</style>
