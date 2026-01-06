import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null, // { username }
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async fetchUser() {
      this.loading = true
      this.error = null

      try {
        // Backend liefert Text: "Authenticated as: <username>"
        const res = await fetch('/auth/me', {
          credentials: 'include',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        if (!res.ok) throw new Error('Not authenticated')
        const text = await res.text()
        const match = text.match(/Authenticated as: (.+)/)
        const username = match ? match[1] : null
        this.user = username ? { username } : null
      } catch {
        this.user = null
      } finally {
        this.loading = false
      }
    },

    async login(username, password) {
      this.loading = true
      this.error = null

      try {
        const basic = btoa(`${username}:${password}`)
        const res = await fetch('/auth/login', {
          method: 'POST',
          headers: { Authorization: `Basic ${basic}` },
          credentials: 'include'
        })
        if (!res.ok) throw new Error('Login failed')
        await this.fetchUser()
      } catch (err) {
        this.error = 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(username, password) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          credentials: 'include'
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || 'Registration failed')
        }
        return true
      } catch (err) {
        this.error = err.message || 'Registration failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async logout() {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
      this.user = null
    }
  }
})
