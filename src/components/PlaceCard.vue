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
    visitForm.value.image = imagePreview.value
  }
  reader.readAsDataURL(file)
}

function openVisitForm() {
  error.value = ''
  success.value = ''
  showVisitForm.value = true
}

function closeVisitForm() {
  showVisitForm.value = false
  imageFile.value = null
  imagePreview.value = null
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
    imageFile.value = null
    imagePreview.value = null
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
        <div class="place-name">{{ place.name }}</div>
        <a v-if="place.googleMapsUrl" :href="place.googleMapsUrl" target="_blank" class="maps-icon" title="View on Google Maps">
          <span class="material-icons">open_in_new</span>
        </a>
        <div v-if="place.category || (place.tags && place.tags.length > 0)" class="tags-inline">
          <span v-if="place.category" class="tag">{{ place.category }}</span>
          <span v-for="tag in (place.tags || []).slice(0, 1)" :key="tag" class="tag">{{ tag }}</span>
        </div>
        
      </div>
      <p class="place-address">{{ place.address || 'No address' }}</p>
    </div>

    <!-- Button -->
    <div class="button-container">
      <button 
        v-if="mode === 'visit'" 
        :class="{ 'btn-action visit': !hasVisited, 'btn-action visited': hasVisited }"
        @click="openVisitForm"
      >
        {{ hasVisited ? 'Visit Again' : 'Log Visit' }}
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
        <button @click="closeVisitForm" class="icon-button" title="Close">
            <span class="material-icons">close</span>
          </button>
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
        </div>

        <label>Image</label>
        <div class="image-upload-section">
          <div class="upload-area">
            <input 
              type="file" 
              id="image-upload" 
              accept="image/*" 
              @change="handleImageUpload"
              class="file-input"
            />
            <label for="image-upload" class="upload-label">
              <span class="material-icons">image</span>
              <span>Choose image or drag & drop</span>
            </label>
          </div>
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" :alt="'Preview'" />
            <button type="button" @click="imageFile = null; imagePreview = null; visitForm.image = ''" class="remove-btn" title="Remove image">✕</button>
          </div>
        </div>

        <!-- <label>Image URL (alternative)</label>
        <input 
          v-model="visitForm.image" 
          type="url" 
          placeholder="https://..." 
          :disabled="!!imageFile"
          class="url-input"
        /> -->s

        <label>Tags (comma separated)</label>
        <input v-model="visitForm.tagsText" type="text" placeholder="e.g. lunch, crowded, favorite" />
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
  transition: all 0.2s ease;
}

.place-card.visited-card {
  border-color: #6ba3a0;
  background: #f6f9f8;
  box-shadow: 0 1px 3px rgba(107, 163, 160, 0.5);
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
  width: 100px;
  height: 80px;
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
  gap: 0.75rem;
  margin-bottom: 0.25rem;
  flex-wrap: wrap;
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
  flex-shrink: 0;
}

.tags-inline {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.maps-icon {
  flex-shrink: 0;
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-bottom: 5px;
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
  font-size: 15px;
  white-space: nowrap;
  margin-left: 1rem;
}

.button-container {
  flex-shrink: 0;
  padding-left: 1rem;
  margin-right: 4rem;
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
  background: #c8d9d3;;
  color: black;
  border: 1px solid #6ba3a0;
}

.btn-action.visited:hover {
  background: #a8bcb7e0;
  border-color: #5a8f8c;
}

.btn-action.visit {
  background: #E4D2EC;
  color: black;
  border: 1px solid #D6BBE3;
}

.btn-action.visit:hover {
  background: #D6BBE3;
  border-color: #C9A5D9;
}

.btn-action.add-to-collection {
  background: #c1dbda;
  color: black;
  border: 1px solid #367565;
}

.btn-action.add-to-collection:hover {
  background: #b0cccb;
}

/* Modal styles
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
} */

/* .btn-close {
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
} */

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

.image-upload-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.upload-area {
  position: relative;
  border: 2px dashed #d2d2d2;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.2s, background-color 0.2s;
}

.upload-area:hover {
  border-color: #71a2db;
  background: #f0f5fa;
}

.file-input {
  display: none;
}

.upload-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  user-select: none;
}

.upload-label .material-icons {
  font-size: 32px;
  color: #71a2db;
}

.upload-label span:last-child {
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

.image-preview {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  border: 1px solid #d2d2d2;
}



.url-input:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
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

/* ===========================
   RESPONSIVE DESIGN
   =========================== */

@media (max-width: 768px) {
  .place-card {
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .image-container {
    width: 50px;
    height: 50px;
  }

  .place-header {
    gap: 0.5rem;
    margin-bottom: 0.15rem;
  }

  .place-name {
    font-size: 20px;
  }

  .place-address {
    font-size: 16px;
  }

  .tag {
    font-size: 13px;
    padding: 0.2rem 0.6rem;
  }

  .maps-icon .material-icons {
    font-size: 18px;
  }

  .btn-action {
    padding: 0.4rem 1rem;
    font-size: 16px;
  }

  .button-container {
    padding-right: 2rem;
  }
}

@media (max-width: 640px) {
  .place-card {
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.75rem;
    align-items: stretch;
  }

  .image-container {
    width: 80px;
    height: 80px;
    flex-shrink: 0;
  }

  .place-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .place-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0;
  }

  .place-name {
    font-size: 18px;
  }

  .maps-icon {
    align-self: flex-start;
  }

  .tags-inline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    width: 100%;
  }

  .place-address {
    font-size: 14px;
    margin: 0;
  }

  .tag {
    font-size: 12px;
    padding: 0.15rem 0.5rem;
    margin-left: 0;
  }

  .maps-icon .material-icons {
    font-size: 16px;
  }

  .btn-action {
    padding: 0.4rem 1rem;
    font-size: 14px;
    width: auto;
    align-self: flex-start;
  }

  .button-container {
    width: 100%;
    padding: 0;
    margin: 0;
    display: flex;
  }

  .card-actions {
    top: 0.25rem;
    right: 0.25rem;
  }
}
</style>