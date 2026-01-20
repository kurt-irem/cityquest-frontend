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
  },
  showActions: {
    type: Boolean,
    default: false
  },
  hasVisited: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['edit', 'delete', 'visited'])

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
    emit('visited', props.place.id)
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
    
  <div class="place-card" :class="{ 'visited-card': hasVisited }">
    <!-- Edit/Delete Actions -->
    <div v-if="showActions" class="card-actions">
      <button @click.stop="emit('edit', place)" class="icon-button" title="Edit">
        <span class="material-icons">edit</span>
      </button>
      <button @click.stop="emit('delete', place.id)" class="icon-button" title="Delete">
        <span class="material-icons">delete</span>
      </button>
    </div>

    <!-- Image -->
    <div class="image-container">
      <img v-if="place.image" :src="place.image" :alt="place.name" class="place-image" />
      <div v-else class="image-placeholder">📍</div>
    </div>

    <!-- Content -->
    <div class="place-content">
      <div class="place-header">
        <h2 class="place-name">{{ place.name }}</h2>
        <a v-if="place.googleMapsUrl" :href="place.googleMapsUrl" target="_blank" class="maps-icon" title="View on Google Maps">
          <span class="material-icons">open_in_new</span>
        </a>
      </div>
      <p class="place-address">{{ place.address || 'No address' }}</p>
    </div>

    <!-- Tags -->
    <div v-if="place.category || (place.tags && place.tags.length > 0)" class="tags-container">
      <span v-if="place.category" class="tag">{{ place.category }}</span>
      <span v-for="tag in (place.tags || []).slice(0, 1)" :key="tag" class="tag">{{ tag }}</span>
    </div>

    <!-- Button -->
    <div class="button-container">
      <button 
        v-if="mode === 'visit'" 
        class="btn-action visited"
        @click="openVisitForm"
      >
        {{ hasVisited ? 'Visit Again' : 'Visited' }}
      </button>
      <button 
        v-else-if="mode === 'collection'" 
        class="btn-action add-to-collection"
        @click="loadCollections(); openVisitForm()"
      >
        add to list
      </button>
    </div>
  </div>
  
  <!-- Modal -->
  <div v-if="showVisitForm" class="modal-overlay" @click.self="closeVisitForm">
    <div class="modal">
      <div class="modal-header">
        <h2 v-if="mode === 'visit'">Log Visit</h2>
        <h2 v-else>Add to Collection</h2>
        <button class="btn-close" @click="closeVisitForm">✕</button>
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
.place-card {
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 5px;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  position: relative;
  transition: border-color 0.2s ease;
}

.place-card.visited-card {
  border-color: #4caf50;
  border-width: 2px;
}

.card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 10;
}

.image-container {
  flex-shrink: 0;
  width: 116px;
  height: 93px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.place-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  font-size: 2rem;
}

.place-content {
  flex: 1;
  min-width: 0;
}

.place-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.place-name {
  margin: 0;
  font-family: 'Manjari', sans-serif;
  font-size: 25px;
  font-weight: 400;
  line-height: 1.5;
  color: black;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.maps-icon {
  flex-shrink: 0;
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.maps-icon .material-icons {
  font-size: 20px;
}

.maps-icon:hover {
  color: #333;
}

.place-address {
  margin: 0;
  font-family: 'Manjari', sans-serif;
  font-size: 20px;
  color: black;
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tags-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: #e5f0fd;
  color: black;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-family: 'Manjari', sans-serif;
  font-size: 16px;
  white-space: nowrap;
}

.button-container {
  flex-shrink: 0;
}

.btn-action {
  padding: 0.5rem 1.5rem;
  border: none;
  border-radius: 25px;
  font-family: 'Manjari', sans-serif;
  font-size: 20px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-action.visited {
  background: #6ba3a0;
  color: white;
  border: 2px solid #6ba3a0;
}

.btn-action.visited:hover {
  background: #5a8f8c;
  border-color: #5a8f8c;
}

.btn-action.add-to-collection {
  background: #c1dbda;
  color: black;
  border: 2px solid #367565;
}

.btn-action.add-to-collection:hover {
  background: #b0cccb;
}

/* Modal styles */
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
  background: white;
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

.modal-header h2 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
}

.btn-close:hover {
  color: #333;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.alert {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.alert-error {
  background: #fee;
  color: #c33;
}

.alert-success {
  background: #efe;
  color: #3c3;
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
  font-family: 'Manjari', sans-serif;
}

textarea {
  min-height: 90px;
  resize: vertical;
}

label {
  display: block;
  margin-top: 1rem;
  font-weight: 500;
}

label:first-of-type {
  margin-top: 0;
}

.muted {
  color: #777;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: 'Manjari', sans-serif;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #6ba3a0;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a8f8c;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e0e0e0;
  color: black;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>