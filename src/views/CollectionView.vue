<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const collections = ref([])
const places = ref([])
const visits = ref([])

const iconOptions = ['bookmark', 'ac_unit', 'sunny', 'local_cafe', 'restaurant', 'account_balance']

const loading = ref(false)
const error = ref('')
const success = ref('')

const showForm = ref(false)
const editingId = ref(null)

const colorOptions = ['#71a2db', '#A7AAE1', '#F1B780', '#9CAB84', '#F2AEBB', '#ACB9BE']

const formData = ref({
	title: '',
	description: '',
	theme: '',
	color: colorOptions[0],
	placeIds: [],
	icon: 'bookmark'
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

async function loadVisits() {
	try {
		const res = await fetch('/api/visits/my-visits', { credentials: 'include' })
		if (res.ok) {
			visits.value = await res.json()
		}
	} catch (e) {
		console.warn(e)
	}
}

function visitedLabel(col) {
	const ids = (col.places || []).map(p => p.id)
	const total = ids.length
	if (total === 0) return '0/0 visited'
	const visitedPlaces = new Set(visits.value.map(v => v.placeId))
	const visitedCount = ids.filter(id => visitedPlaces.has(id)).length
	return `${visitedCount}/${total} visited`
}

function resetForm() {
	editingId.value = null
	formData.value = { title: '', description: '', theme: '', color: colorOptions[0], placeIds: [], icon: 'bookmark' }
}

function editCollection(col) {
	editingId.value = col.id
	formData.value = {
		title: col.title || '',
		description: col.description || '',
		theme: col.theme || '',
		color: col.color || colorOptions[0],
		placeIds: (col.places || []).map(p => p.id),
		icon: col.icon || 'bookmark'
	}
	showForm.value = true
}

function openCollection(colId) {
	router.push({ name: 'collection-detail', params: { id: colId } })
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
		await Promise.all([loadCollections(), loadPlaces(), loadVisits()])
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
			<div v-else class="card clickable" :style="{ borderColor: col.color || '#e3e3e3' }" v-for="col in collections" :key="col.id" @click="openCollection(col.id)">
				<div class="card-header">
					<div class="card-left">
						<div class="icon-circle" :style="{ borderColor: col.color || '#e3e3e3', color: col.color || '#333' }">
							<span class="material-icons">{{ col.icon || 'bookmark' }}</span>
						</div>
						<div class="col-title">{{ col.title }}</div>
					</div>
					<div class="card-meta">
						<div class="muted">{{ visitedLabel(col) }}</div>
						<div class="actions" @click.stop>
							<button class="icon-button" title="Edit" @click.stop="editCollection(col)">
								<span class="material-icons">edit</span>
							</button>
							<button class="icon-button" title="Delete" @click.stop="deleteCollection(col.id)">
								<span class="material-icons">delete</span>
							</button>
						</div>
					</div>
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
				<div>
					<label>Theme</label>
					<input v-model="formData.theme" type="text" placeholder="e.g. Food, Travel" />
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
	gap: 1.25rem;
	margin:  1rem;
}

.card {
	background: #fff;
	border: 2px solid #e3e3e3;
	border-radius: 12px;
	padding: 1.2rem 1.25rem;
	box-shadow: 0 4px 4px 2px rgba(0, 0, 0, 0.05);

}

.card.clickable {
	cursor: pointer;
}

.card.clickable:hover {
	background-color: #f8f8f8;
	box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 1rem;
}

.card-left {
	display: flex;
	align-items: center;
	gap: 0.75rem;
	flex: 1;
}

.card-meta {
	display: flex;
	align-items: center;
	gap: 1rem;
}

.icon-circle {
	width: 44px;
	height: 44px;
	border: 2px solid #e3e3e3;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: #fff;
}

.icon-circle .material-icons {
	font-size: 22px;
}

.actions {
	display: flex;
	gap: 0.5rem;
}
.col-title {
	font-family: var(--font-accent);
    font-size: 1.75rem;
	letter-spacing: 3px;
	font-weight: bold;
	padding-right: 1rem;
	padding-left: 0.5rem;
}

.muted {
	color: #777;
	display: flex;
	font-size: 1.1rem;
}

.loading,
.empty {
	color: #666;
	margin-top: 1rem;
}

.place-list {
	max-height: 260px;
	overflow: auto;
	padding: 0.5rem;
	border: 1px solid #e3e3e3;
	border-radius: 8px;
	margin-top: 0.25rem;
}

.color-choices {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
	margin-top: 0.5rem;
}

.color-swatch {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	border: 1px solid rgba(0, 0, 0, 0.08);
	cursor: pointer;
	padding: 0;
	transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.icon-choices {
	display: flex;
	flex-wrap: wrap;
	gap: 0.5rem;
}

.icon-chip {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 0.35rem;
	padding: 0.35rem 0.75rem;
	border-radius: 999px;
	border: 1px solid #dcdcdc;
	background: #f7f7f7;
	cursor: pointer;
	font-family: inherit;
}

.icon-chip.active {
	border-color: #71a2db;
	background: #e8f2ff;
}

.icon-chip .material-icons {
	font-size: 20px;
}

.color-swatch:hover {
	transform: translateY(-2px);
	border-color: rgba(0, 0, 0, 0.2);
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
		align-items: center;
		gap: 0.5rem;
		padding: 0rem 0.5rem;
	}

	.card-header {
		flex-direction: column;
		align-items: flex-start;
		gap: 0.75rem;
	}

	.card-left {
		width: 100%;
		justify-content: center;
	}

	.card-meta {
		width: 100%;
		justify-content: center;
		align-items: center;
	}
	

	.actions {
		flex-direction: row;
		gap: 0.5rem;
	}
}
</style>
