<script setup>
import { ref, onMounted } from 'vue'
import NavBar from '@/components/NavBar.vue'
import VisitCard from '@/components/VisitCard.vue'

const myVisits = ref([])
const loading = ref(false)
const error = ref('')
const success = ref('')
const editingId = ref(null)
const showForm = ref(false)

const formData = ref({
  visitDate: '',
  note: '',
  rating: null,
  image: '',
  tagsText: ''
})

async function loadMyVisits() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/visits/my-visits', { credentials: 'include', cache: 'no-store' })
    if (!res.ok) throw new Error('Could not load visits')
    myVisits.value = await res.json()
  } catch (e) {
    error.value = e.message || 'Could not load visits'
  } finally {
    loading.value = false
  }
}

function openEditForm(visit) {
  editingId.value = visit.id
  formData.value = {
    visitDate: visit.visitDate || '',
    note: visit.note || '',
    rating: visit.rating || null,
    image: visit.image || '',
    tagsText: (visit.tags || []).join(', ')
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  formData.value = { visitDate: '', note: '', rating: null, image: '', tagsText: '' }
}

async function updateVisit() {
  if (!editingId.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    const tags = formData.value.tagsText
      ? formData.value.tagsText.split(',').map(t => t.trim()).filter(Boolean)
      : []

    const payload = {
      placeId: null, // Can't change place, just update other fields
      visitDate: formData.value.visitDate || null,
      note: formData.value.note || null,
      rating: formData.value.rating || null,
      image: formData.value.image || null,
      tags
    }

    const res = await fetch(`/api/visits/${editingId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    })

    if (!res.ok) throw new Error('Error updating visit')
    success.value = 'Visit updated!'
    closeForm()
    await loadMyVisits()
  } catch (e) {
    error.value = e.message || 'Error updating visit'
  } finally {
    loading.value = false
  }
}

async function deleteVisit(id) {
  if (!confirm('Delete this visit?')) return
  try {
    const res = await fetch(`/api/visits/${id}`, { method: 'DELETE', credentials: 'include' })
    if (!res.ok) throw new Error('Error deleting visit')
    success.value = 'Visit deleted!'
    await loadMyVisits()
  } catch (e) {
    error.value = e.message || 'Error deleting visit'
  }
}

onMounted(loadMyVisits)
</script>

<template>
  <header><NavBar /></header>
  <div class="visits-view container">
    <h2>My Visits</h2>

    <div v-if="success" class="alert alert-success">{{ success }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>

    <div v-if="loading" class="muted">Loading…</div>
    <div v-else-if="myVisits.length === 0" class="muted">No visits logged yet</div>

    <div v-else class="list">
      <div class="grid">
        <div v-for="visit in myVisits" :key="visit.id" class="visit-item">
          <VisitCard :visit="visit" />
          <div class="actions">
            <button class="btn btn-secondary btn-sm" @click="openEditForm(visit)">Edit</button>
            <button class="btn btn-error btn-sm" @click="deleteVisit(visit.id)">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showForm" class="modal-overlay" @click.self="closeForm">
      <div class="modal">
        <div class="modal-header">
          <h2>Edit Visit</h2>
          <button class="btn btn-ghost" @click="closeForm">✕</button>
        </div>

        <label>Date</label>
        <input v-model="formData.visitDate" type="date" />

        <label>Note</label>
        <textarea v-model="formData.note" placeholder="Your notes"></textarea>

        <div class="grid grid-2">
          <div>
            <label>Rating</label>
            <select v-model.number="formData.rating">
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
            <input v-model="formData.image" type="url" placeholder="https://..." />
          </div>
        </div>

        <label>Tags (comma separated)</label>
        <input v-model="formData.tagsText" type="text" placeholder="e.g. sunny, family, quick stop" />

        <div class="modal-actions">
          <button class="btn btn-primary" :disabled="loading" @click="updateVisit">{{ loading ? '...' : 'Update' }}</button>
          <button class="btn btn-secondary" @click="closeForm">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visits-view {
  padding: 2rem 0;
}

.list {
  margin-top: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.visit-item {
  display: flex;
  flex-direction: column;
}

.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.muted {
  color: #777;
  margin: 0.25rem 0 0;
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

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
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

label {
  display: block;
  margin-top: 0.75rem;
  font-weight: 500;
}

label:first-of-type {
  margin-top: 0;
}
</style>
