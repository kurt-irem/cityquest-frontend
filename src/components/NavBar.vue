<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const showMenu = ref(false)

const username = computed(() => auth.user?.username || 'User')

async function onLogout() {
  try {
    await auth.logout()
  } finally {
    router.replace('/login')
    setTimeout(() => { window.location.assign('/login') }, 0)
  }
}

function navigateTo(path) {
  router.push(path)
  showMenu.value = false
}
</script>

<template>
  <div class="navbar flex flex-between">
    <div class="accent-font">CityQuest</div>
    <div class="nav-links flex flex-row flex-gap-md">
      <router-link to="/home" class="nav-link">Home</router-link>
      <router-link to="/places" class="nav-link">Places</router-link>
      <router-link to="/collections" class="nav-link">Collections</router-link>
      <router-link to="/visits" class="nav-link">My Visits</router-link>
    </div>
    <div class="flex flex-row flex-gap-sm">
      <div style="padding-right: 1em;">Logged in as: {{ username }}</div>
      <button @click="onLogout" class="btn btn-secondary">Logout</button>
    </div>

    <!-- Mobile hamburger menu -->
    <div class="mobile-menu-container">
      <button class="hamburger" @click="showMenu = !showMenu" title="Menu">
        <span class="material-icons">menu</span>
      </button>
      <div v-if="showMenu" class="dropdown-menu">
        <button class="dropdown-item" @click="navigateTo('/home')">
          <span class="material-icons">home</span>
          <span>Home</span>
        </button>
        <button class="dropdown-item" @click="navigateTo('/places')">
          <span class="material-icons">location_on</span>
          <span>Places</span>
        </button>
        <button class="dropdown-item" @click="navigateTo('/collections')">
          <span class="material-icons">collections</span>
          <span>Collections</span>
        </button>
        <button class="dropdown-item" @click="navigateTo('/visits')">
          <span class="material-icons">checklist</span>
          <span>My Visits</span>
        </button>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item logout" @click="onLogout">
          <span class="material-icons">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
    .navbar {
        background-color: var(--color-secondary);
        padding: 0 2em;
        align-items: center;
    }

    .nav-links {
        flex: 1;
        justify-content: center;
    }

    .nav-link {
        color: inherit;
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: background-color 0.2s;
    }

    .nav-link:hover {
        background-color: rgba(0, 0, 0, 0.1);
    }

    .nav-link.router-link-active {
        background-color: rgba(0, 0, 0, 0.2);
        font-weight: 500;
    }

    /* Mobile menu - hidden on desktop */
    .mobile-menu-container {
        display: none;
        position: relative;
    }

    .hamburger {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        color: inherit;
    }

    .hamburger .material-icons {
        font-size: 24px;
    }

    .dropdown-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 100;
        min-width: 200px;
        margin-top: 0.5rem;
        overflow: hidden;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        text-align: left;
        cursor: pointer;
        color: #333;
        font-size: 1rem;
        transition: background-color 0.2s;
    }

    .dropdown-item:hover {
        background-color: #f0f0f0;
    }

    .dropdown-item .material-icons {
        font-size: 20px;
    }

    .dropdown-divider {
        height: 1px;
        background: #eee;
        margin: 0.5rem 0;
    }

    .dropdown-item.logout {
        color: #d32f2f;
    }

    .dropdown-item.logout:hover {
        background-color: rgba(211, 47, 47, 0.1);
    }

    /* Show mobile menu on small screens */
    @media (max-width: 768px) {
        .nav-links,
        .username-label {
            display: none;
        }

        .mobile-menu-container {
            display: block;
        }

        .navbar {
            padding: 0 1rem;
        }
    }
</style>

