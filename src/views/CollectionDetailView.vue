<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PlaceCard from '@/components/PlaceCard.vue'
import NavBar from '@/components/NavBar.vue'

const route = useRoute()
const router = useRouter()
const id = computed(() => Number(route.params.id))

const collection = ref(null)
const places = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const formData = ref({ title: '', description: '', theme: '', color: '', placeIds: [], placeIdToAdd: '' })
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

function startEdit() {
  if (!collection.value) return
  formData.value = {
    title: collection.value.title || '',
    description: collection.value.description || '',
    theme: collection.value.theme || '',
    color: collection.value.color || '',
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
      method: 'POST', credentials: 'include'
    })
    if (!res.ok) throw new Error('Error adding place')
    success.value = 'Place added'
    formData.value.placeIdToAdd = ''
    await loadCollection()
  } catch (e) { error.value = e.message || 'Error adding place' }
}

async function removePlace(placeId) {
  try {
    const res = await fetch(`/api/collections/${id.value}/places/${placeId}`, {
      method: 'DELETE', credentials: 'include'
    })
    if (!res.ok) throw new Error('Error removing place')
    success.value = 'Place removed'
    await loadCollection()
  } catch (e) { error.value = e.message || 'Error removing place' }
}

onMounted(async () => {
  await Promise.all([loadCollection(), loadPlaces()])
  if (route.query.edit) startEdit()
})
</script>

<template>
    <header><NavBar /></header>
  <div class="collection-detail container">
    <button class="btn btn-ghost" @click="$router.back()">← Back</button>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="!collection" class="muted">Not found</div>

    <div v-else class="card">
      <header class="flex flex-between" style="align-items:center;">
        <div>
          <h2>{{ collection.title }}</h2>
          <p v-if="collection.description" class="muted">{{ collection.description }}</p>
        </div>
        <div class="flex flex-gap-sm">
          <button class="btn btn-secondary" v-if="isOwner" @click="startEdit">Edit</button>
          <button class="btn btn-error" v-if="isOwner" @click="deleteCollection">Delete</button>
        </div>
      </header>

      <p class="meta">
        <strong>Theme:</strong> {{ collection.theme || '-' }}
        <span class="separator">|</span>
        <strong>Color:</strong> {{ collection.color || '-' }}
      </p>

      <section>
        <strong>Places ({{ (collection.places || []).length }}):</strong>
        <div class="grid grid-2" style="margin-top:0.5rem;">
          <div v-for="p in (collection.places || [])" :key="p.id">
            <PlaceCard :place="p" />
            <div v-if="isOwner" class="flex" style="margin-top:0.5rem;">
              <button class="btn btn-outline btn-sm" @click="removePlace(p.id)">Remove</button>
            </div>
          </div>
        </div>

        <div v-if="isOwner" class="flex flex-gap-sm" style="margin-top:0.5rem;">
          <select v-model.number="formData.placeIdToAdd" style="min-width: 200px;">
            <option disabled value="">Add place…</option>
            <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
          <button class="btn btn-secondary" @click="formData.placeIdToAdd ? addPlace(formData.placeIdToAdd) : null">Add</button>
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
          <div>
            <label>Color</label>
            <input v-model="formData.color" type="text" placeholder="#F4A261" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" :disabled="loading" @click="updateCollection">{{ loading ? '...' : 'Update' }}</button>
          <button class="btn btn-secondary" @click="showForm = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 2rem 0; }
.card { background: #fff; border: 1px solid #e3e3e3; border-radius: 12px; padding: 1rem 1.25rem; }
.muted { color: #777; }
.meta { margin: 0.5rem 0; color: #444; }
.separator { margin: 0 0.5rem; color: #999; }
.place-list { margin-top: 0.5rem; }
.grid { display: grid; gap: 0.75rem; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; padding:1rem; z-index:50; }
.modal { background:#fff; border-radius:12px; padding:1.5rem; max-width:720px; width:100%; max-height:90vh; overflow:auto; box-shadow:0 10px 30px rgba(0, 0, 0, 0.1); }
.modal-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; }
.modal-actions { display:flex; gap:0.75rem; margin-top:1rem; }
</style>