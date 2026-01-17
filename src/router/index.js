import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import CollectionView from '../views/CollectionView.vue'
import CollectionDetailView from '../views/CollectionDetailView.vue'
import VisitsView from '../views/VisitsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/home', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/collections', name: 'collections', component: CollectionView, meta: { requiresAuth: true } },
    { path: '/collections/:id', name: 'collection-detail', component: CollectionDetailView, meta: { requiresAuth: true } },
    { path: '/visits', name: 'visits', component: VisitsView, meta: { requiresAuth: true } },
  ],
})

// Simple auth guard using Pinia store
router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if ((to.meta && to.meta.requiresAuth) && !auth.user) {
    // Try to hydrate session from cookie when needed
    await auth.fetchUser()
  }

  if (to.meta && to.meta.requiresAuth && !auth.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && auth.isAuthenticated) {
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
