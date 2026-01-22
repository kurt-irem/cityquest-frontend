<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import CollectionView from './CollectionView.vue'

const router = useRouter()

const summary = ref(null)
const monthlyGoal = ref(5)
const loadingSummary = ref(false)
const summaryError = ref('')
const showGoalModal = ref(false)
const goalInput = ref(5)

const now = new Date()
const currentMonthKey = computed(() => new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit' }).format(now)) // YYYY-MM
const currentMonthLabel = computed(() => now.toLocaleString('default', { month: 'long', year: 'numeric' }))

const uniqueVisitsThisMonth = computed(() => summary.value?.uniquePlaces ?? 0)
const progressPercent = computed(() => {
  const goal = Math.max(1, monthlyGoal.value || 1)
  return Math.min(100, Math.round((uniqueVisitsThisMonth.value / goal) * 100))
})

const categoryBadges = computed(() => {
  const cats = summary.value?.categories || {}
  // Filter out empty or null category names
  return Object.fromEntries(
    Object.entries(cats).filter(([key]) => key && key.trim())
  )
})

async function loadSummary() {
  loadingSummary.value = true
  summaryError.value = ''
  try {
    const res = await fetch('/api/achievements/summary', { credentials: 'include', cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load achievements')
    const data = await res.json()
    summary.value = data
    monthlyGoal.value = data.goal ?? 5
  } catch (e) {
    summaryError.value = e.message || 'Error loading achievements'
  } finally {
    loadingSummary.value = false
  }
}

async function saveGoal() {
  const goal = Math.max(1, goalInput.value || 1)
  monthlyGoal.value = goal
  try {
    await fetch('/api/achievements/goal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ goal, month: currentMonthKey.value })
    })
    await loadSummary()
    showGoalModal.value = false
  } catch (e) {
    summaryError.value = e.message || 'Error saving goal'
  }
}

function openGoalModal() {
  goalInput.value = monthlyGoal.value || 5
  showGoalModal.value = true
}

function closeGoalModal() {
  showGoalModal.value = false
}

onMounted(() => {
  loadSummary()
})
</script>

<template>
  <header><NavBar /></header>
  <div class="home-view">
    <div class="places">
      <div class="container">
        <CollectionView />

        <section class="add-places">
          <h2>Add New Places to Your Collections</h2>
          <p class="description">Discover places from our collection or create your own!</p>
          <router-link to="/places" class="btn btn-primary">Browse All Places</router-link>
        </section>
      </div>
    </div>

    <aside class="achievements">

      <div class="sidebar-header">
        <h3>Your Achievements</h3>
      </div>

      <div class="monthly-goal-card">
        <div class="goal-header">
          <h4>this months goal:</h4>
          <button class="change-goal-btn" @click="openGoalModal" title="Change goal">
            <span class="material-icons">edit</span>
          </button>
        </div>

        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>

        <div class="progress-text">
          <div class="progress-main">{{ uniqueVisitsThisMonth }}/{{ monthlyGoal || 1 }}</div>
          <div class="muted">new places visited</div>
        </div>
        
      </div>

      <div v-if="Object.keys(categoryBadges).length" class="sidebar-section">
        <div class="section-label">By Category</div>
        <div class="badges">
          <span class="badge" v-for="(count, cat) in categoryBadges" :key="cat">{{ cat }}: {{ count }}</span>
        </div>
      </div>

      <div v-if="summaryError" class="sidebar-section alert alert-error">{{ summaryError }}</div>
      <div v-else-if="loadingSummary" class="sidebar-section muted">Loading achievements...</div>
    </aside>

    <!-- Goal Modal -->
    <div v-if="showGoalModal" class="modal-overlay" @click.self="closeGoalModal">
      <div class="modal">
        <div class="modal-header">
          <h2>Set Monthly Goal</h2>
          <button class="btn-close" @click="closeGoalModal">✕</button>
        </div>

        <div class="goal-input-group">
          <label for="goal-input">How many places do you want to visit this month?</label>
          <input
            id="goal-input"
            type="number"
            min="1"
            step="1"
            v-model.number="goalInput"
            @keyup.enter="saveGoal"
          />
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" @click="saveGoal" :disabled="loadingSummary">Save Goal</button>
          <button class="btn btn-secondary" @click="closeGoalModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-view {
  display: grid;
  grid-template-columns: 3fr 1fr;
  width: 100%;
  height: 100%;
}

.places {
  padding: 2em;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.achievements {
  background-color:  rgb(188, 211, 238, 0.6);;
  padding: 2em;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.add-places {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
  max-width: 100%;
  width: 100%;
}

.add-places h2 {
  margin-top: 0;
}

.description {
  color: #666;
  margin: 0.5rem 0 1rem;
}

/* Achievements Sidebar */
.sidebar-header {
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.1rem;
}

/* Monthly Goal Card */
.monthly-goal-card {
  background: white;
  border: 2px solid #71a2db;
  border-radius: 20px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.change-goal-btn {
  background: #71a2db;
  border: none;
  border-radius: 100%;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;

}

.change-goal-btn:hover {
  opacity: 0.9;
}

.change-goal-btn .material-icons {
  font-size: 18px;
  color: white;
}

.sidebar-section {
  padding: 1rem;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.section-label {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Progress Bar */
.progress-bar {
  position: relative;
  height: 13px;
  width: 100%;
  background: #e8f2ff;
  border: 0.5px solid #71a2db;
  border-radius: 25px;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #71a2db;
  border-radius: 25px;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  text-align: center;
}

.progress-main {
  font-weight: 600;
  font-size: 1rem;
}

/* Badges */
.badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.65rem;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  font-size: 0.8rem;
  background: white;
  color: rgba(0, 0, 0, 0.8);
}

.muted {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
  margin: 0;
}

/* Modal */
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
  max-width: 480px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  color: #666;
}

.btn-close:hover {
  color: #333;
}

.goal-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.goal-input-group label {
  font-weight: 500;
  color: #555;
  font-size: 0.95rem;
}

.goal-input-group input {
  padding: 0.6rem 0.8rem;
  border: 1px solid #d2d2d2;
  border-radius: 8px;
  font-size: 1rem;
}

.goal-input-group input:focus {
  outline: none;
  border-color: #71a2db;
  box-shadow: 0 0 0 2px rgba(113, 162, 219, 0.1);
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.modal-actions .btn {
  padding: 0.6rem 1.2rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .home-view {
    grid-template-columns: 1fr;
    height: auto;
  }

  .achievements {
    padding: 1.5em;
    max-height: none;
  }
}

@media (max-width: 640px) {
  .places {
    padding: 1em;
    gap: 1rem;
  }

  .achievements {
    padding: 1em;
    gap: 0.75rem;
  }

  .add-places {
    padding: 1.5rem;
  }

  .sidebar-section {
    padding: 0.85rem;
  }

  .goal-row {
    gap: 0.3rem;
  }

  .goal-row .btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.85rem;
  }
}
</style>
