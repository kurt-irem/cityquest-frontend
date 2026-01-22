<script setup>
import { ref } from 'vue'

const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete'])
const showNotes = ref(false)

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => i < (rating || 0) ? 'star' : 'star_border')
}

function toggleNotes() {
  showNotes.value = !showNotes.value
}
</script>

<template>
  <div class="visit-card">
    <!-- Normal View -->
    <div v-if="!showNotes">
      <div class="image-container">
        <img v-if="visit.image" :src="visit.image" :alt="visit.placeName" class="visit-image" />
        <div v-else class="image-placeholder">No image</div>
      </div>

      <div class="visit-info">
        <div class="header-row">
          <h3 class="place-name">{{ visit.placeName }}</h3>
          <p v-if="visit.visitDate" class="visit-date">{{ new Date(visit.visitDate).toLocaleDateString('de-DE') }}</p>
        </div>

        <div v-if="visit.rating" class="rating">
          <div class="stars">
            <span v-for="icon in renderStars(visit.rating)" :key="icon" class="material-icons">{{ icon }}</span>
          </div>
        </div>

        <div v-if="visit.tags && visit.tags.length > 0" class="tags">
          <span v-for="tag in visit.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>

      <!-- Notes Toggle Button -->
      <div class="bottom-actions">
        <button v-if="visit.note" @click="toggleNotes" class="icon-button" title="View notes">
          <span class="material-icons">description</span>
        </button>
      </div>
    </div>

    <!-- Notes View -->
    <div v-else class="notes-view">
      <h3 class="place-name">{{ visit.placeName }}</h3>
      <div class="divider"></div>
      <div class="notes-content">
        <p>{{ visit.note }}</p>
      </div>
      <div class="card-header">
        <div class="actions">
          <button @click="emit('edit', visit)" class="icon-button" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button @click="emit('delete', visit.id)" class="icon-button" title="Delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      </div>
      <div class="bottom-actions">
        <button @click="toggleNotes" class="icon-button" title="Back to card">
          <span class="material-icons">article</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visit-card {
  background: #fdfbf7;
  border: 1px solid #a9a9a9;
  overflow: hidden;
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  height: 340px;
  display: flex;
  flex-direction: column;
}

.card-header {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 10;
}

.actions {
  display: flex;
  gap: 0.35rem;
}


.image-container {
  width: 100%;
  height: 160px;
  background: #e8e8e8;
  overflow: hidden;
  margin: 0.5rem;
  width: calc(100% - 1rem);
  border-radius: 0px;
}

.visit-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 0.9rem;
}

.visit-info {
  padding: 1rem;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.place-name {
  font-family: 'Amatic SC', cursive;
  font-size: 28px;
  font-weight: 400;
  margin: 0;
  color: #000;
  flex: 1;
}

.visit-date {
  font-family: 'Amatic SC', cursive;
  font-size: 20px;
  color: #666;
  margin: 0;
  white-space: nowrap;
}

.rating {
  margin: 0.5rem 0;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  display: flex;
  justify-content: center;
}

.stars {
  display: flex;
  gap: 0.25rem;
}

.stars .material-icons {
  font-size: 24px;
  color: #5a5a5a;
}

.note {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
  margin: 0.5rem 0 0;
  font-style: italic;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.tag {
  background: #e8dcc8;
  color: #5a5a5a;
  padding: 0.25rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
}

/* Bottom actions positioning */
.bottom-actions {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  z-index: 10;
}

/* Notes view */
.notes-view {
  padding: 1.5rem;
  min-height: 20px;
  display: flex;
  flex-direction: column;
}

.notes-view .place-name {
  margin-bottom: 0.5rem;
}

.divider {
  width: 100%;
  height: 1px;
  background: #d0d0d0;
  margin-bottom: 1rem;
}

.notes-content {
  flex: 1;
  font-size: 0.95rem;
  line-height: 1.6;
  color: #333;
}

.notes-content p {
  margin: 0;
  white-space: pre-wrap;
}

@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap');
</style>
