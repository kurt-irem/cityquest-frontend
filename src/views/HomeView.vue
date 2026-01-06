<script setup>
import PlacesManager from '../components/PlacesManager.vue'
import CollectionsManager from '../components/CollectionsManager.vue'
import NavBar from '@/components/NavBar.vue';
import CollectionView from './CollectionView.vue';
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <header>
    <NavBar/>
  </header>
  <div class="home-view">
    <div class="places">
      
      <!-- <h3>Add a new place ...</h3> -->
      <CollectionView />
      <PlacesManager />
    </div>
    <div class="achievements">
      <h3> Your Achievements</h3>
    </div>

    
    
    
  </div>
  <!-- <div style="background-color: azure;"> div</div>
  <PlacesManager />
  <CollectionsManager /> -->
</template>
