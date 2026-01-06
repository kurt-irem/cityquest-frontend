<script setup>
import { ref, computed, onMounted } from 'vue'

const collections = ref([])
const places = ref([])

const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const editingId = ref(null)
const formData = ref({
	title: '',
	description: '',
	theme: '',
	color: '',
	placeIds: []
})

const isEditing = computed(() => editingId.value !== null)

// Load only the current user's collections
async function loadCollections() {
	loading.value = true
	error.value = ''
	try {
		const res = await fetch('/api/collections/my-collections', { credentials: 'include', cache: 'no-store' })
		if (!res.ok) throw new Error('Could not load collections')
		collections.value = await res.json()
	} catch (e) {
		error.value = e.message || 'Could not load collections'
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

async function submitCollection() {
	if (!formData.value.title) {
		error.value = 'Title is required'
		return
	}

	loading.value = true
	error.value = ''
	success.value = ''

	try {
		const res = await fetch(isEditing.value ? `/api/collections/${editingId.value}` : '/api/collections', {
			method: isEditing.value ? 'PUT' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify(formData.value)
		})

		if (!res.ok) throw new Error(isEditing.value ? 'Error updating collection' : 'Error creating collection')

		success.value = isEditing.value ? 'Collection updated!' : 'Collection created!'
		resetForm()
		showForm.value = false
		await loadCollections()
	} catch (e) {
		error.value = e.message || 'Something went wrong'
	} finally {
		loading.value = false
	}
}

async function deleteCollection(id) {
	if (!confirm('Really delete this collection?')) return
	try {
		const res = await fetch(`/api/collections/${id}`, { method: 'DELETE', credentials: 'include' })
		if (!res.ok) throw new Error('Error deleting collection')
		success.value = 'Collection deleted!'
		await loadCollections()
	} catch (e) {
		error.value = e.message || 'Error deleting collection'
	}
}

onMounted(async () => {
	await Promise.all([loadCollections(), loadPlaces()])
})
</script>

<template>
	<div class="collection-view container">
		<header class="header-row">
			<h2>Your Collections</h2>
			<button class="btn btn-primary" @click="showForm = true">+ New Collection</button>
		</header>

		<div v-if="success" class="alert alert-success">{{ success }}</div>
		<div v-if="error" class="alert alert-error">{{ error }}</div>

		<div v-if="loading" class="loading">Loading…</div>

		<div v-else class="list">
			<div v-if="collections.length === 0" class="empty">No collections yet</div>
			<div v-else class="card" v-for="col in collections" :key="col.id">
				<div class="card-header">
					<div>
						<h3 class="col-title">{{ col.title }}</h3>
						<p v-if="col.description" class="muted">{{ col.description }}</p>
					</div>
					<div class="actions">
						<button class="btn btn-secondary" @click="editCollection(col)">Edit</button>
						<button class="btn " @click="deleteCollection(col.id)">Delete</button>
					</div>
				</div>
				<p class="meta">
					<strong>Theme:</strong> {{ col.theme || '-' }}
					<span class="separator">|</span>
					<strong>Color:</strong> {{ col.color || '-' }}
				</p>
				<div>
					<strong>Places ({{ (col.places || []).length }}):</strong>
					<ul>
						<li v-for="p in (col.places || [])" :key="p.id">{{ p.name }}</li>
					</ul>
				</div>
			</div>
		</div>

		<div v-if="showForm" class="modal-overlay" @click.self="showForm = false">
			<div class="modal">
				<div class="modal-header">
					<h2>{{ isEditing ? 'Edit Collection' : 'New Collection' }}</h2>
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

				<label>Select places</label>
				<div class="place-list">
					<div v-if="places.length === 0" class="muted">No places available</div>
					<div v-else class="grid grid-2">
						<label v-for="p in places" :key="p.id" class="checkbox-row">
							<input type="checkbox" :value="p.id" v-model="formData.placeIds" />
							<span>{{ p.name }}<span v-if="p.category"> — {{ p.category }}</span></span>
						</label>
					</div>
				</div>

				<div class="modal-actions">
					<button class="btn btn-primary" :disabled="loading" @click="submitCollection">
						{{ loading ? '...' : (isEditing ? 'Update' : 'Create') }}
					</button>
					<button class="btn btn-secondary" @click="showForm = false; resetForm()">Cancel</button>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.collection-view {
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
/* .col-title {
	font-family: var(--font-accent);
    font-size:x-large;
} */

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

.place-list {
	max-height: 260px;
	overflow: auto;
	padding: 0.5rem;
	border: 1px solid #e3e3e3;
	border-radius: 8px;
	margin-top: 0.25rem;
}

.checkbox-row {
	display: flex;
	align-items: center;
	gap: 0.5rem;
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
