<script setup>
import { ref, onMounted } from 'vue'
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

// Filter/Search
const searchQuery = ref('')
const selectedCategory = ref('')
const categories = ['Restaurant', 'Museum', 'Park', 'Sight', 'Cafe', 'Other']

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

// Search and filter (kept for later, currently unused)
// async function searchPlaces() {
//   if (!searchQuery.value) {
//     await loadAllPlaces()
//     return
//   }
//   loading.value = true
//   try {
//     const res = await fetch(`/api/places/search?name=${encodeURIComponent(searchQuery.value)}`, {
//       credentials: 'include'
//     })
//     if (res.ok) {
//       places.value = await res.json()
//     }
//   } catch (e) {
//     error.value = e.message
//   } finally {
//     loading.value = false
//   }
// }

// async function filterByCategory() {
//   if (!selectedCategory.value) {
//     await loadAllPlaces()
//     return
//   }
//   loading.value = true
//   try {
//     const res = await fetch(`/api/places/category/${encodeURIComponent(selectedCategory.value)}`, {
//       credentials: 'include'
//     })
//     if (res.ok) {
//       places.value = await res.json()
//     }
//   } catch (e) {
//     error.value = e.message
//   } finally {
//     loading.value = false
//   }
// }

onMounted(() => {
  loadAllPlaces()
  loadMyPlaces()
})
</script>

<template>
  <div class="places-view container">
    <header class="header-row">
      <h1>Your Places</h1>
      <button class="btn btn-primary" @click="showForm = true">+ New Place</button>
    </header>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="list">
      <div v-if="myPlaces.length === 0" class="empty">No places created</div>
      <div v-else class="list-item" v-for="place in myPlaces" :key="place.id">
        <PlaceCard :place="place" />
        <div class="actions" style="margin-top:0.5rem;">
          <button @click="editPlace(place)" class="btn btn-primary">Edit</button>
          <button @click="deletePlace(place.id)" class="btn">Delete</button>
        </div>
      </div>
    </div>

    <!-- Search and filter (kept for later use)
    <div class="flex flex-gap-md mb-lg" style="flex-wrap: wrap; margin-top: 1.5rem;">
      <input 
        v-model="searchQuery"
        type="text"
        placeholder="Search for place..."
        @keyup.enter="searchPlaces"
        style="flex: 1; min-width: 200px;">
      
      <select 
        v-model="selectedCategory"
        @change="filterByCategory"
        style="min-width: 150px;">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>

      <button @click="searchPlaces" class="btn btn-secondary">Search</button>
      <button @click="loadAllPlaces()" class="btn btn-outline">Reset</button>
    </div>
    -->

    <div class="all-list">
      <h2>All Places ({{ places.length }})</h2>
      <div v-if="places.length === 0" class="empty">No places found</div>
      <div v-else class="grid grid-2">
        <div v-for="place in places" :key="place.id">
          <PlaceCard :place="place" />
        </div>
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
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.meta {
  margin: 0.5rem 0;
  color: #444;
}

.separator {
  margin: 0 0.5rem;
  color: #999;
}

.muted {
  color: #777;
}

.loading,
.empty {
  color: #666;
  margin-top: 1rem;
}

.all-list {
  margin-top: 2rem;
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
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
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
  margin-top: 0.25rem;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

@media (max-width: 640px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .actions {
    flex-direction: column;
  }
}
</style>
