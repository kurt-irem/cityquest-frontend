<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAlertDismiss } from '@/composables/useAlertDismiss'

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')

useAlertDismiss(success, error)

const auth = useAuthStore()
const router = useRouter()

async function register() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await auth.register(username.value, password.value)
    success.value = 'Successfully registered! You can now log in.'
  } catch (e) {
    error.value = e.message || 'Registration failed'
  } finally {
    loading.value = false
  }
}

async function login() {
  error.value = ''
  success.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    success.value = 'Login successful!'
    router.push('/home')
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="hero-section">
      <h1 class="hero-title">Welcome to CityQuest</h1>
      <p class="hero-subtitle">Make a habit of trying new places and explore your City!</p>
    </div>

    <div class="form-container">
      <div class="form-box">
        <h2>Login / Register</h2>

        <form @submit.prevent="login">
          <div class="form-group">
            <label for="username">Username</label>
            <input 
              id="username"
              v-model="username" 
              type="text" 
              autocomplete="username" 
              required 
              placeholder="Enter your username"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              id="password"
              v-model="password" 
              type="password" 
              autocomplete="current-password" 
              required 
              placeholder="Enter your password"
            />
          </div>

          <div class="form-actions">
            <button 
              type="button" 
              @click="register" 
              :disabled="loading" 
              class="btn btn-secondary"
            >
              {{ loading ? '...' : 'Register' }}
            </button>
            <button 
              type="submit" 
              :disabled="loading"
              class="btn btn-primary"
            >
              {{ loading ? '...' : 'Login' }}
            </button>
          </div>
        </form>

        <div v-if="success" class="alert alert-success">{{ success }}</div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: var(--space-lg, 2rem);
}

.hero-section {
  text-align: center;
  margin-bottom: var(--space-xl, 3rem);
  max-width: 600px;
}

.hero-title {
  font-family: var(--font-accent);
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-primary-dark, #71a2db);
  margin: 0 0 var(--space-md, 1rem) 0;
  letter-spacing: 3px;
}

.hero-subtitle {
  font-size: 1.125rem;
  color: #666;
  margin: 0;
  font-family: 'Manjari', sans-serif;
  line-height: 1.6;
  font-weight: 400;
}

.form-container {
  display: flex;
  justify-content: center;
  width: 100%;
}

.form-box {
  background: white;
  border: 2px solid var(--color-secondary, #C7D0EE);
  border-radius: 20px;
  padding: var(--space-xl, 3rem);
  width: 100%;
  max-width: 400px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease;
}

.form-box:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.form-box h2 {
  margin: 0 0 var(--space-lg, 2rem) 0;
  font-size: 1.5rem;
  color: var(--color-primary-dark, #71a2db);
  text-align: center;
  font-family: 'Manjari', sans-serif;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-lg, 2rem);
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #333;
  margin-bottom: var(--space-xs, 0.5rem);
  font-family: 'Manjari', sans-serif;
}

.form-group input {
  padding: var(--space-md, 1rem);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: 'Manjari', sans-serif;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: #fafafa;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-primary, #BCD3EE);
  background: white;
  box-shadow: 0 0 0 3px rgba(113, 162, 219, 0.1);
}

.form-group input::placeholder {
  color: #aaa;
}

.form-actions {
  display: flex;
  gap: var(--space-md, 1rem);
  margin-top: var(--space-lg, 2rem);
}

.btn {
  flex: 1;
  padding: var(--space-md, 1rem);
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  font-family: 'Manjari', sans-serif;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-primary-dark, #71a2db);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #5a88c1;
  box-shadow: 0 4px 12px rgba(113, 162, 219, 0.3);
  transform: translateY(-2px);
}

.btn-secondary {
  background: var(--color-secondary, #C7D0EE);
  color: var(--color-primary-dark, #71a2db);
  font-weight: 600;
}

.btn-secondary:hover:not(:disabled) {
  background: #b8c7e0;
  box-shadow: 0 4px 12px rgba(113, 162, 219, 0.2);
  transform: translateY(-2px);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alert {
  padding: var(--space-md, 1rem);
  border-radius: 8px;
  margin-top: var(--space-lg, 2rem);
  font-size: 0.95rem;
  text-align: center;
  font-family: 'Manjari', sans-serif;
}

.alert-success {
  background: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #4caf50;
}

.alert-error {
  background: #ffebee;
  color: #b71c1c;
  border-left: 4px solid #f44336;
}

/* Responsive Mobile */
@media (max-width: 640px) {
  .login-page {
    padding: var(--space-md, 1rem);
  }

  .hero-section {
    margin-bottom: var(--space-lg, 2rem);
  }

  .hero-title {
    font-size: 2.25rem;
    
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .form-box {
    padding: var(--space-lg, 2rem);
    border-radius: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
