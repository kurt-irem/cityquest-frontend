<script setup>
const props = defineProps({
  visit: {
    type: Object,
    required: true
  }
})

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, i) => i < (rating || 0) ? 'star' : 'star_border')
}
</script>

<template>
  <div class="visit-card">
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

      <p v-if="visit.note" class="note">{{ visit.note }}</p>

      <div v-if="visit.tags && visit.tags.length > 0" class="tags">
        <span v-for="tag in visit.tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.visit-card {
  background: #fdfbf7;
  border: 1px solid #828282;
  border-radius: 8px;
  overflow: hidden;
  max-width: 280px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.image-container {
  width: 100%;
  height: 200px;
  background: #e8e8e8;
  overflow: hidden;
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

@import url('https://fonts.googleapis.com/css2?family=Amatic+SC:wght@400;700&display=swap');
</style>
