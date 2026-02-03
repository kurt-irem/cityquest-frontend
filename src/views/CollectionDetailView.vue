<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAlertDismiss } from '@/composables/useAlertDismiss'
import PlaceCard from '@/components/PlaceCard.vue'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))

const collection = ref(null)
const places = ref([])
const visits = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

useAlertDismiss(success, error)

const iconOptions = ['bookmark', 'ac_unit', 'sunny', 'local_cafe', 'restaurant', 'account_balance']
const colorOptions = ['#71a2db', '#A7AAE1', '#F1B780', '#9CAB84', '#F2AEBB', '#ACB9BE']

const showForm = ref(false)
const showAddPlace = ref(false)
const searchPlaces = ref('')
const formData = ref({ title: '', description: '', theme: '', color: '', icon: 'bookmark', placeIds: [], placeIdToAdd: '' })
const isOwner = computed(() => !!collection.value?.createdByUserId)

async function loadCollection() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch(`/api/collections/${id.value}`, { credentials: 'include', cache: 'no-store' })
    if (!res.ok) throw new Error('Collection not found')
    collection.value = await res.json()
  } catch (e) {
    error.value = e.message || 'Could not load collection'
  } finally {
    loading.value = false
  }
}

async function loadPlaces() {
  try {
    const res = await fetch('/api/places', { credentials: 'include' })
    if (res.ok) places.value = await res.json()
  } catch (e) {
    console.warn(e)
  }
}

async function loadVisits() {
  try {
    const res = await fetch('/api/visits/my-visits', { credentials: 'include' })
    if (res.ok) {
      visits.value = await res.json()
    } else if (res.status === 401) {
      visits.value = []
    }
  } catch (e) {
    console.warn(e)
  }
}

function isPlaceVisited(placeId) {
  return visits.value.some(v => v.placeId === placeId)
}

function filteredPlaces() {
  const query = searchPlaces.value.toLowerCase()
  return (collection.value?.places || []).filter(p => 
    p.name.toLowerCase().includes(query) || 
    (p.address && p.address.toLowerCase().includes(query))
  )
}

function startEdit() {
  if (!collection.value) return
  formData.value = {
    title: collection.value.title || '',
    description: collection.value.description || '',
    theme: collection.value.theme || '',
    color: collection.value.color || colorOptions[0],
    icon: collection.value.icon || 'bookmark',
    placeIds: (collection.value.places || []).map(p => p.id),
    placeIdToAdd: ''
  }
  showForm.value = true
}

async function updateCollection() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const res = await fetch(`/api/collections/${id.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData.value)
    })
    if (!res.ok) throw new Error('Error updating collection')
    success.value = 'Collection updated!'
    showForm.value = false
    await loadCollection()
  } catch (e) {
    error.value = e.message || 'Error updating collection'
  } finally {
    loading.value = false
  }
}

async function deleteCollection() {
  if (!confirm('Really delete this collection?')) return
  try {
    const res = await fetch(`/api/collections/${id.value}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) throw new Error('Error deleting collection')
    success.value = 'Collection deleted!'
    router.push({ name: 'home' })
  } catch (e) {
    error.value = e.message || 'Error deleting collection'
  }
}

async function addPlace(placeId) {
  try {
    const res = await fetch(`/api/collections/${id.value}/places/${placeId}`, {
      method: 'POST',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Error adding place')
    success.value = 'Place added'
    formData.value.placeIdToAdd = ''
    showAddPlace.value = false
    await loadCollection()
  } catch (e) {
    error.value = e.message || 'Error adding place'
  }
}

async function removePlace(placeId) {
  try {
    const res = await fetch(`/api/collections/${id.value}/places/${placeId}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Error removing place')
    success.value = 'Place removed'
    await loadCollection()
  } catch (e) {
    error.value = e.message || 'Error removing place'
  }
}

function handlePlaceVisited() {
  loadVisits()
}

onMounted(async () => {
  await Promise.all([loadCollection(), loadPlaces(), loadVisits()])
  if (route.query.edit) startEdit()
})
</script>

<template>
  <header>
    <NavBar />
  </header>
  <div class="collection-detail container">
    <button class="btn btn-ghost" @click="$router.back()">← Back</button>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="!collection" class="muted">Not found</div>

    <div v-else class="card">
      <header class="header-row">
        <div>
          <h1 class="title">{{ collection.title }}</h1>
          <p v-if="collection.description" class="description">{{ collection.description }}</p>
          <div v-if="collection.theme" class="tags-row">
            <span class="pill theme-pill">{{ collection.theme }}</span>
          </div>
        </div>
        <div class="actions">
          <button v-if="isOwner" @click="startEdit" class="icon-button" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button v-if="isOwner" @click="deleteCollection" class="icon-button" title="Delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </header>

      <section class="places-section">
        <div class="section-header">
          <strong>Places ({{ filteredPlaces().length }})</strong>
          <button v-if="isOwner" class="btn btn-secondary" @click="showAddPlace = true">+ Add Place</button>
        </div>
        
        <div v-if="(collection.places || []).length > 0" class="search-bar">
          <span class="material-icons search-icon">search</span>
          <input 
            v-model="searchPlaces"
            type="text" 
            placeholder="Search places..." 
          />
          <button v-if="searchPlaces" class="clear-btn" @click="searchPlaces = ''">✕</button>
        </div>
        
        <div class="places-list">
          <div v-for="p in filteredPlaces()" :key="p.id" class="place-item">
            <PlaceCard :place="p" :hasVisited="isPlaceVisited(p.id)" @visited="handlePlaceVisited" />
            <button v-if="isOwner" @click="removePlace(p.id)" class="icon-button place-remove" title="Remove">
              <span class="material-icons">close</span>
            </button>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Collection</h2>
          <button class="btn btn-ghost" @click="showForm = false">✕</button>
        </div>

        <label>Title *</label>
        <input v-model="formData.title" type="text" placeholder="Title" />

        <label>Description</label>
        <textarea v-model="formData.description" placeholder="Description"></textarea>

        <div class="grid grid-2">
          <div>
            <label>Theme</label>
            <input v-model="formData.theme" type="text" placeholder="e.g. Food, Travel" />
          </div>
        </div>

        <div class="grid grid-2">
          <div>
            <label>Icon</label>
            <div class="icon-choices">
            <button
              v-for="icon in iconOptions"
              :key="icon"
              type="button"
              class="icon-chip"
              :class="{ active: formData.icon === icon }"
              @click="formData.icon = icon"
            >
              <span class="material-icons">{{ icon }}</span>
            </button>
            </div>
          </div>
          
          <div>
            <label>Color</label>
            <div class="color-choices">
              <button
                v-for="c in colorOptions"
                :key="c"
                type="button"
                class="color-swatch"
                :style="{ backgroundColor: c, boxShadow: formData.color === c ? '0 0 0 3px rgba(0,0,0,0.1)' : 'none' }"
                @click="formData.color = c"
                title="Choose color"
              ></button>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" :disabled="loading" @click="updateCollection">{{ loading ? '...' : 'Update' }}</button>
          <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>

    <div v-if="showAddPlace" class="modal-overlay" @click.self="showAddPlace = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Add Place to Collection</h2>
          <button class="btn btn-ghost" @click="showAddPlace = false">✕</button>
        </div>

        <label>Select Place</label>
        <select v-model.number="formData.placeIdToAdd">
          <option disabled value="">Choose a place…</option>
          <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>

        <div class="modal-actions">
          <button class="btn btn-primary" :disabled="!formData.placeIdToAdd" @click="formData.placeIdToAdd ? addPlace(formData.placeIdToAdd) : null">Add</button>
          <button class="btn btn-secondary" @click="showAddPlace = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 2rem 0.5rem;
}

.card {
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
}

.muted {
  color: #777;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.title {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: 1px;
}

.description {
  margin: 0.35rem 0 0.5rem;
  color: #555;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.tags-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pill {
  border: 1px solid #dcdcdc;
  background: #f7f7f7;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.9rem;
  color: #333;
}

.theme-pill {
  background: #e5f0fd;
  border-color: #c5dbfb;
  color: #0f4fa8;
}

.places-section {
  margin-top: 1rem;
}

.section-header {
  margin-bottom: 0.5rem;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  strong{
    font-size: large;
    padding-top: 5px;
    padding-left: 5px;
  }
}

.places-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.place-item {
  display: flex;
  flex-direction: row;
  gap: 0.2rem;
  align-items: stretch;
  position: relative;
}

.place-item > :first-child {
  flex-grow: 1;
  width: 100%;
}

.place-item .icon-button {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 2;
}

.add-place-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}

.add-place-row select {
  min-width: 200px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d2d2d2;
  border-radius: 8px;
  margin-bottom: 1rem;
  background: #fafafa;
}

.search-icon {
  color: #999;
  font-size: 20px;
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font-size: 1rem;
  font-family: 'Manjari', sans-serif;
}

.search-bar input:focus {
  outline: none;
}

.clear-btn {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
  flex-shrink: 0;
  transition: color 0.2s;
}

.clear-btn:hover {
  color: #333;
}

/* ===========================
   RESPONSIVE DESIGN
   =========================== */

@media (max-width: 768px) {
  .container {
    padding: 1.5rem 1rem;

  }

  .card {
    padding: 1rem 1rem;
    border-radius: 10px;
    background-color:transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .title {
    font-size: 1.5rem;
    letter-spacing: 0.5px;
  }

  .description {
    margin: 0.25rem 0 0.35rem;
    font-size: 0.95rem;
  }

  

  .tags-row {
    gap: 0.35rem;
  }

  .pill {
    font-size: 0.85rem;
    padding: 0.2rem 0.6rem;
  }

  .section-header strong {
    font-size: 1.05rem;
    padding-top: 3px;
    padding-left: 3px;
  }

  .search-bar {
    padding: 0.4rem 0.6rem;
    margin-bottom: 0.75rem;
  }

  .search-icon {
    font-size: 18px;
  }

  .search-bar input {
    font-size: 0.95rem;
  }

  .clear-btn {
    font-size: 1.1rem;
  }
}

@media (max-width: 640px) {
  .container {
    padding: 1rem 0.5rem;
  }

  .card {
    padding: 0.75rem;
    border-radius: 8px;
  }

 

  .title {
    font-size: 1.25rem;
    letter-spacing: 0;
    margin-bottom: 0.5rem;
  }

  .description {
    margin: 0.15rem 0 0.25rem;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  

  .icon-button .material-icons {
    font-size: 18px;
  }

  .place-item .icon-button {
  top: 0.2rem;
  right: 0.2rem;
}

  .tags-row {
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .pill {
    font-size: 0.8rem;
    padding: 0.15rem 0.5rem;
  }

  .theme-pill {
    padding: 0.15rem 0.5rem;
  }

  .places-section {
    margin-top: 0.75rem;
  }

  .section-header {
    margin-bottom: 0.35rem;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .section-header strong {
    font-size: 1rem;
    padding: 0;
  }

  .section-header button {
    width: 100%;
    padding: 0.4rem 0.75rem;
    font-size: 0.9rem;
  }

  .search-bar {
    padding: 0.4rem 0.5rem;
    margin-bottom: 0.5rem;
    border-radius: 6px;
    margin-bottom: 0.75rem;
  }

  .search-icon {
    font-size: 18px;
  }

  .search-bar input {
    font-size: 1rem;
  }

  .clear-btn {
    font-size: 1rem;
  }

  .places-list {
    gap: 0.5rem;
  }
}
</style>