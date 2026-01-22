<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAlertDismiss } from '@/composables/useAlertDismiss'
import PlaceCard from '@/components/PlaceCard.vue'

const places = ref([])
const myPlaces = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

useAlertDismiss(success, error)

// Form state
const showForm = ref(false)
const formData = ref({
  name: '',
  address: '',
  category: '',
  latitude: null,
  longitude: null,
  googlePlaceId: '',
  googleMapsUrl: '',
  image: ''
})
const editingId = ref(null)
const imageFile = ref(null)
const imagePreview = ref(null)

function handleImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file'
    return
  }
  
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Image must be smaller than 5MB'
    return
  }
  
  imageFile.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result
    formData.value.image = imagePreview.value
  }
  reader.readAsDataURL(file)
}
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
  formData.value = { ...place, image: place.image || '' }
  imageFile.value = null
  imagePreview.value = null
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
    googleMapsUrl: '',
    image: ''
  }
  editingId.value = null
  imageFile.value = null
  imagePreview.value = null
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
          <button @click="showForm = false" class="icon-button" title="Close">
            <span class="material-icons">close</span>
          </button>
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

        <!-- <label>Google Place ID</label>
        <input v-model="formData.googlePlaceId" type="text" /> -->

        <label>Google Maps URL</label>
        <input v-model="formData.googleMapsUrl" type="url" />

        <label>Image</label>
        <div class="image-upload-section">
          <div class="upload-area">
            <input 
              type="file" 
              id="place-image-upload" 
              accept="image/*" 
              @change="handleImageUpload"
              class="file-input"
            />
            <label for="place-image-upload" class="upload-label">
              <span class="material-icons">image</span>
              <span>Choose image or drag & drop</span>
            </label>
          </div>
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" :alt="'Preview'" />
            <button type="button" @click="imageFile = null; imagePreview = null; formData.image = ''" class="remove-btn">x</button>
          </div>
        </div>

        <!-- <label>Image URL (alternative)</label>
        <input 
          v-model="formData.image" 
          type="url" 
          placeholder="https://..." 
          :disabled="!!imageFile"
          class="url-input"
        /> -->

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
  padding: 0;
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

/* Form inputs inside modal */
.modal input,
.modal textarea,
.modal select {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1px solid #d2d2d2;
  border-radius: 8px;
  margin-top: 0.15rem;
  margin-bottom: 0.35rem;
  box-sizing: border-box;
  font-size: 1rem;
}

.modal textarea {
  min-height: 90px;
  resize: vertical;
}

@media (max-width: 768px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Image upload section */
.image-upload-section {
  margin-top: 0.5rem;
  margin-bottom: 1rem;
}

.upload-area {
  position: relative;
  border: 2px dashed #d2d2d2;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafafa;
}

.upload-area:hover {
  border-color: #76a9fa;
  background: #f0f6ff;
}

.upload-area .file-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #666;
  font-size: 0.95rem;
}

.upload-label .material-icons {
  font-size: 2rem;
  color: #76a9fa;
}

.upload-area:hover .upload-label .material-icons {
  color: #0f4fa8;
}

.image-preview {
  margin-top: 1rem;
  position: relative;
  display: inline-block;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  display: block;
}


.url-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

/* ===========================
   RESPONSIVE DESIGN
   =========================== */

@media (max-width: 768px) {
  .hero {
    padding: 1.5rem 0.5rem;
  }

  .hero h1 {
    font-size: 1.6rem;
  }

  .hero .subtitle {
    font-size: 0.95rem;
  }

  .controls {
    gap: 0.75rem;
  }

  .search-bar {
    padding: 0.5rem 0.75rem;
  }

  .search-bar input {
    font-size: 0.95rem;
  }

  .search-icon {
    font-size: 18px;
  }

  .clear-btn {
    font-size: 1.1rem;
  }

  .sort-bar {
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .pill {
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  .divider {
    display: none;
  }

  .modal input,
  .modal textarea,
  .modal select {
    font-size: 1rem;
  }

  .list {
    gap: 0.75rem;
  }
}

@media (max-width: 640px) {
  .places-view {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .hero {
    padding: 1rem 0;
  }

  .hero h1 {
    font-size: 1.4rem;
    margin-bottom: 0.35rem;
  }

  .hero .subtitle {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }

  .search-bar {
    padding: 0.4rem 0.6rem;
    width: 100%;
  }

  .search-bar input {
    font-size: 0.9rem;
  }

  .divider {
    display: none;
  }

  .search-icon {
    font-size: 16px;
  }

  .clear-btn {
    font-size: 1rem;
  }

  .sort-bar {
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .pill {
    padding: 0.3rem 0.6rem;
    font-size: 0.8rem;
    white-space: nowrap;
  }

  .list {
    gap: 0.5rem;
  }

  .modal {
    max-width: 95vw;
    padding: 1rem;
  }

  .modal-header {
    margin-bottom: 0.75rem;
  }

  .modal-header h2 {
    font-size: 1.2rem;
  }

  .modal input,
  .modal textarea,
  .modal select {
    padding: 0.5rem 0.6rem;
    font-size: 0.95rem;
    margin-top: 0.1rem;
    margin-bottom: 0.1rem;
  }

  .modal textarea {
    min-height: 80px;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .modal-actions {
    gap: 0.5rem;
    flex-direction: column;
  }

  .modal-actions .btn {
    width: 100%;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
  }

  .upload-area {
    padding: 1.5rem 1rem;
  }

  .upload-label .material-icons {
    font-size: 1.5rem;
  }

  .upload-label span:last-child {
    font-size: 0.9rem;
  }

  .image-preview img {
    max-height: 200px;
  }


}
</style>
