<script setup>
import { ref, onMounted, computed } from 'vue'

const collections = ref([])
const myCollections = ref([])
const places = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

// Form state
const showForm = ref(false)
const editingId = ref(null)
const formData = ref({
  title: '',
  description: '',
  theme: '',
  color: '',
  placeIds: []
})

// Derived helpers
const isEditing = computed(() => editingId.value !== null)

async function loadAllCollections() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/collections', { credentials: 'include' })
    if (res.ok) collections.value = await res.json()
    else error.value = 'Konnte Collections nicht laden'
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadMyCollections() {
  try {
    const res = await fetch('/api/collections/my-collections', { credentials: 'include' })
    if (res.ok) myCollections.value = await res.json()
  } catch (e) {
    console.warn(e)
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

function resetForm() {
  editingId.value = null
  formData.value = { title: '', description: '', theme: '', color: '', placeIds: [] }
}

function editCollection(col) {
  editingId.value = col.id
  formData.value = {
    title: col.title || '',
    description: col.description || '',
    theme: col.theme || '',
    color: col.color || '',
    placeIds: (col.places || []).map(p => p.id)
  }
  showForm.value = true
}

async function createCollection() {
  if (!formData.value.title) { error.value = 'Titel ist erforderlich'; return }
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const res = await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData.value)
    })
    if (res.ok) {
      success.value = 'Collection erstellt!'
      resetForm()
      showForm.value = false
      await loadAllCollections(); await loadMyCollections()
    } else if (res.status === 401) {
      error.value = 'Bitte erst einloggen'
    } else {
      error.value = 'Fehler beim Erstellen'
    }
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function updateCollection() {
  if (!editingId.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const res = await fetch(`/api/collections/${editingId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(formData.value)
    })
    if (res.ok) {
      success.value = 'Collection aktualisiert!'
      resetForm(); showForm.value = false
      await loadAllCollections(); await loadMyCollections()
    } else if (res.status === 403) {
      error.value = 'Du darfst diese Collection nicht bearbeiten'
    } else {
      error.value = 'Fehler beim Aktualisieren'
    }
  } catch (e) { error.value = e.message } finally { loading.value = false }
}

async function deleteCollection(id) {
  if (!confirm('Wirklich löschen?')) return
  try {
    const res = await fetch(`/api/collections/${id}`, { method: 'DELETE', credentials: 'include' })
    if (res.ok) {
      success.value = 'Collection gelöscht!'
      await loadAllCollections(); await loadMyCollections()
    } else if (res.status === 403) {
      error.value = 'Du darfst diese Collection nicht löschen'
    } else {
      error.value = 'Fehler beim Löschen'
    }
  } catch (e) { error.value = e.message }
}

async function addPlace(colId, placeId) {
  try {
    const res = await fetch(`/api/collections/${colId}/places/${placeId}`, {
      method: 'POST', credentials: 'include'
    })
    if (res.ok) {
      success.value = 'Place hinzugefügt'
      await loadAllCollections(); await loadMyCollections()
    } else if (res.status === 403) {
      error.value = 'Nicht berechtigt'
    }
  } catch (e) { error.value = e.message }
}

async function removePlace(colId, placeId) {
  try {
    const res = await fetch(`/api/collections/${colId}/places/${placeId}`, {
      method: 'DELETE', credentials: 'include'
    })
    if (res.ok) {
      success.value = 'Place entfernt'
      await loadAllCollections(); await loadMyCollections()
    } else if (res.status === 403) {
      error.value = 'Nicht berechtigt'
    }
  } catch (e) { error.value = e.message }
}

onMounted(async () => {
  await Promise.all([loadAllCollections(), loadMyCollections(), loadPlaces()])
})
</script>

<template>
  <div class="collections-container container">
    <h1>Collections</h1>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <button v-if="!showForm" @click="showForm = true" class="btn btn-primary mb-md">+ Neue Collection</button>

    <div v-if="showForm" class="card p-lg mb-lg">
      <h2>{{ isEditing ? 'Collection bearbeiten' : 'Neue Collection' }}</h2>

      <label>Titel *</label>
      <input v-model="formData.title" type="text" placeholder="Titel" />

      <label style="margin-top: 0.75rem;">Beschreibung</label>
      <textarea v-model="formData.description" placeholder="Beschreibung"></textarea>

      <div class="grid grid-2" style="margin-top: 0.75rem;">
        <div>
          <label>Theme</label>
          <input v-model="formData.theme" type="text" placeholder="z.B. Food, Travel" />
        </div>
        <div>
          <label>Farbe</label>
          <input v-model="formData.color" type="text" placeholder="#F4A261" />
        </div>
      </div>

      <label style="margin-top: 0.75rem;">Places auswählen</label>
      <div class="card p-md" style="max-height: 240px; overflow: auto;">
        <div v-if="places.length === 0" style="color: #888;">Keine Places vorhanden</div>
        <div v-else class="grid grid-2">
          <label v-for="p in places" :key="p.id" class="flex flex-gap-sm" style="align-items: center;">
            <input type="checkbox" :value="p.id" v-model="formData.placeIds" />
            <span>{{ p.name }}<span v-if="p.category"> — {{ p.category }}</span></span>
          </label>
        </div>
      </div>

      <div style="display:flex; gap: 0.5rem; margin-top: 1rem;">
        <button @click="isEditing ? updateCollection() : createCollection()" class="btn btn-primary">{{ isEditing ? 'Aktualisieren' : 'Erstellen' }}</button>
        <button @click="showForm = false; resetForm()" class="btn btn-secondary">Abbrechen</button>
      </div>
    </div>

    <div style="margin-bottom: 2rem;">
      <h2>Meine Collections ({{ myCollections.length }})</h2>
      <div v-if="myCollections.length === 0" style="color: #999;">Keine Collections erstellt</div>
      <div v-else class="grid grid-2">
        <div v-for="col in myCollections" :key="col.id" class="card">
          <div class="flex flex-between" style="align-items:center;">
            <h3>{{ col.title }}</h3>
            <div class="flex flex-gap-sm">
              <button @click="editCollection(col)" class="btn btn-primary btn-sm">Bearbeiten</button>
              <button @click="deleteCollection(col.id)" class="btn btn-error btn-sm">Löschen</button>
            </div>
          </div>
          <p v-if="col.description">{{ col.description }}</p>
          <p class="mb-sm"><strong>Theme:</strong> {{ col.theme || '-' }} | <strong>Farbe:</strong> {{ col.color || '-' }}</p>
          <div>
            <strong>Places ({{ (col.places||[]).length }}):</strong>
            <ul style="margin-top: 0.5rem;">
              <li v-for="p in (col.places||[])" :key="p.id" class="flex flex-between" style="align-items:center;">
                <span>{{ p.name }}</span>
                <button @click="removePlace(col.id, p.id)" class="btn btn-outline btn-sm">Entfernen</button>
              </li>
            </ul>
          </div>
          <div class="flex flex-gap-sm" style="margin-top: 0.5rem;">
            <select v-model.number="(formData.placeIdToAdd)" style="min-width: 180px;">
              <option disabled value="">Place hinzufügen…</option>
              <option v-for="p in places" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button @click="formData.placeIdToAdd ? addPlace(col.id, formData.placeIdToAdd) : null" class="btn btn-secondary btn-sm">Hinzufügen</button>
          </div>
        </div>
      </div>
    </div>

    
    <div>
      <h2>Alle Collections ({{ collections.length }})</h2>
      <div v-if="loading" style="text-align:center; padding: 2rem;">Laden…</div>
      <div v-else-if="collections.length === 0" style="color:#999;">Keine Collections gefunden</div>
      <div v-else class="grid grid-2">
        <div v-for="col in collections" :key="col.id" class="card">
          <h3>{{ col.title }}</h3>
          <p v-if="col.description">{{ col.description }}</p>
          <p class="mb-sm"><strong>Theme:</strong> {{ col.theme || '-' }} | <strong>Farbe:</strong> {{ col.color || '-' }}</p>
          <div>
            <strong>Places ({{ (col.places||[]).length }}):</strong>
            <ul style="margin-top: 0.5rem;">
              <li v-for="p in (col.places||[])" :key="p.id">{{ p.name }}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.collections-container { padding: 2rem 0; }
h1 { margin-bottom: 2rem; }
h2 { margin: 2rem 0 1rem; }
.grid { margin-bottom: 2rem; }
</style>
