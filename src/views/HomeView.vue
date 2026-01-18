<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import CollectionView from './CollectionView.vue'

const router = useRouter()
</script>

<template>
  <header><NavBar/></header>
  <div class="home-view container">
    <div>
      <CollectionView />
    
      <section class="add-places">
        <h2>Add New Places</h2>
        <p class="description">Discover and add places from our collection to your own.</p>
        <router-link to="/places" class="btn btn-primary">Browse All Places</router-link>
      </section>
    </div>
    

    <div class="achievements">
      <h3>Your Achievements</h3>
    </div>
  </div>
</template>

<style scoped>
.container { padding: 2rem 0; }

.add-places {
  margin-top: 2rem;
  padding: 2rem;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #e3e3e3;
}

.add-places h2 {
  margin-top: 0;
}

.description {
  color: #666;
  margin: 0.5rem 0 1rem;
}

.achievements {
  margin-top: 2rem;
}
</style>
