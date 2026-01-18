<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  place: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: 'visit' // 'visit' or 'collection'
  }
})

const router = useRouter()
const showVisitForm = ref(false)
const loading = ref(false)
const error = ref('')
const success = ref('')
const visitForm = ref({
  visitDate: '',
  note: '',
  rating: null,
  image: '',
  tagsText: ''
})

const collections = ref([])
const selectedCollectionId = ref(null)

function openVisitForm() {
  error.value = ''
  success.value = ''
  showVisitForm.value = true
}

function closeVisitForm() {
  showVisitForm.value = false
}

async function loadCollections() {
  try {
    const res = await fetch('/api/collections/my-collections', { credentials: 'include' })
    if (res.ok) {
      collections.value = await res.json()
    }
  } catch (e) {
    console.error('Failed to load collections:', e)
  }
}

async function submitVisit() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const tags = visitForm.value.tagsText
      ? visitForm.value.tagsText.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const payload = {
      placeId: props.place.id,
      visitDate: visitForm.value.visitDate || null,
      note: visitForm.value.note || null,
      rating: visitForm.value.rating || null,
      image: visitForm.value.image || null,
      tags
    }

    const res = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    if (!res.ok) {
      const tx = await res.text()
      throw new Error(tx || 'Failed to create visit')
    }

    success.value = 'Visit saved!'
    showVisitForm.value = false
    visitForm.value = { visitDate: '', note: '', rating: null, image: '', tagsText: '' }
  } catch (e) {
    error.value = e.message || 'Error saving visit'
  } finally {
    loading.value = false
  }
}

async function submitAddToCollection() {
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const res = await fetch(`/api/collections/${selectedCollectionId.value}/places/${props.place.id}`, {
      method: 'POST',
      credentials: 'include'
    })

    if (!res.ok) {
      const tx = await res.text()
      throw new Error(tx || 'Failed to add place to collection')
    }

    success.value = 'Place added to collection!'
    showVisitForm.value = false
    selectedCollectionId.value = null
  } catch (e) {
    error.value = e.message || 'Error adding place to collection'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card">
    <div class="card-header">
      <div>
        <h3>{{ place.name }}</h3>
        <p class="muted">{{ place.address || 'No address' }}</p>
      </div>
      <div>
        <button v-if="mode === 'visit'" class="btn btn-primary btn-sm" @click="openVisitForm">Visited</button>
        <button v-else-if="mode === 'collection'" class="btn btn-primary btn-sm" @click="loadCollections(); openVisitForm()">Add to Collection</button>
      </div>
    </div>
    <p class="meta">
      <strong>Category:</strong> {{ place.category || '-' }}
      <span class="separator">|</span>
      <strong>Created by:</strong> {{ place.createdByUsername || '-' }}
    </p>
    <p class="meta">
      <strong>Created at:</strong>
      {{ place.createdAt ? new Date(place.createdAt).toLocaleDateString('en-US') : '-' }}
    </p>
    <div v-if="place.googleMapsUrl" style="margin-top: 0.5rem;">
      <a :href="place.googleMapsUrl" target="_blank" class="btn btn-outline btn-sm">View on Google Maps</a>
    </div>
  </div>
  
  <div v-if="showVisitForm" class="modal-overlay" @click.self="closeVisitForm">
    <div class="modal">
      <div class="modal-header">
        <h2 v-if="mode === 'visit'">Log Visit</h2>
        <h2 v-else>Add to Collection</h2>
        <button class="btn btn-ghost" @click="closeVisitForm">✕</button>
      </div>

      <div v-if="error" class="alert alert-error">{{ error }}</div>
      <div v-if="success" class="alert alert-success">{{ success }}</div>

      <template v-if="mode === 'visit'">
        <label>Date</label>
        <input v-model="visitForm.visitDate" type="date" />

        <label>Note</label>
        <textarea v-model="visitForm.note" placeholder="Your notes"></textarea>

        <div class="grid grid-2">
          <div>
            <label>Rating</label>
            <select v-model.number="visitForm.rating">
              <option :value="null">-</option>
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
              <option :value="5">5</option>
            </select>
          </div>
          <div>
            <label>Image URL</label>
            <input v-model="visitForm.image" type="url" placeholder="https://..." />
          </div>
        </div>

        <label>Tags (comma separated)</label>
        <input v-model="visitForm.tagsText" type="text" placeholder="e.g. sunny, family, quick stop" />
      </template>

      <template v-else>
        <label>Select a Collection</label>
        <div v-if="collections.length === 0" class="muted">No collections yet. <router-link to="/collections">Create one</router-link></div>
        <select v-else v-model.number="selectedCollectionId">
          <option :value="null">Choose a collection...</option>
          <option v-for="col in collections" :key="col.id" :value="col.id">{{ col.title }}</option>
        </select>
      </template>

      <div class="modal-actions">
        <button v-if="mode === 'visit'" class="btn btn-primary" :disabled="loading" @click="submitVisit">{{ loading ? '...' : 'Save' }}</button>
        <button v-else class="btn btn-primary" :disabled="loading || !selectedCollectionId" @click="submitAddToCollection">{{ loading ? '...' : 'Add' }}</button>
        <button class="btn btn-secondary" @click="closeVisitForm">Cancel</button>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e3e3e3;
  border-radius: 12px;
  padding: 1rem 1.25rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.muted { color: #777; }
.meta { margin: 0.5rem 0; color: #444; }
.separator { margin: 0 0.5rem; color: #999; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
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
  max-width: 640px;
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
.modal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
.grid { display: grid; gap: 0.75rem; }
.grid-2 { grid-template-columns: repeat(2, 1fr); }
input, textarea, select { width: 100%; padding: 0.55rem 0.75rem; border: 1px solid #d2d2d2; border-radius: 8px; margin-top: 0.25rem; }
textarea { min-height: 90px; resize: vertical; }
</style>