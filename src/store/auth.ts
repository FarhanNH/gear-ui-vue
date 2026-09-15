import { defineStore } from 'pinia'

const TOKEN_KEY = 'gear_token'
const EXPIRES_AT_KEY = 'gear_expires_at'
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:8443'
const EXPIRY_CHECK_INTERVAL_MS = 30_000

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) as string | null,
    expiresAt: (() => {
      const raw = localStorage.getItem(EXPIRES_AT_KEY)
      return raw ? parseInt(raw, 10) : null
    })() as number | null,
  }),

  actions: {
    /**
     * Login: POST /v1/auth/login
     * On success stores token + expiry in state and localStorage.
     * On 401 or 429 throws an error with the server-provided message.
     */
    async login(username: string, password: string): Promise<void> {
      const res = await fetch(`${BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      if (!res.ok) {
        let message = res.status === 429 ? 'Too many requests' : 'Invalid credentials'
        try {
          const body = await res.json()
          if (body?.error) message = body.error
        } catch {
          // ignore JSON parse errors — keep default message
        }
        throw new Error(message)
      }

      const data = await res.json() as { token: string; expires_at: string }

      // expires_at from server is an ISO 8601 string — convert to epoch ms
      const expiresAtMs = new Date(data.expires_at).getTime()

      this.token = data.token
      this.expiresAt = expiresAtMs

      localStorage.setItem(TOKEN_KEY, data.token)
      localStorage.setItem(EXPIRES_AT_KEY, String(expiresAtMs))
    },

    /**
     * Logout: clears state and localStorage, then redirects to /login.
     */
    logout(): void {
      this.token = null
      this.expiresAt = null

      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(EXPIRES_AT_KEY)

      // Use hard redirect so every part of the app is cleaned up
      window.location.href = '/login'
    },

    /**
     * checkExpiry: if the token has expired, logout immediately.
     */
    checkExpiry(): void {
      if (this.expiresAt !== null && Date.now() > this.expiresAt) {
        this.logout()
      }
    },
  },
})

/**
 * Start a 30-second interval that calls checkExpiry on the auth store.
 * Call this once after the Pinia instance is installed (e.g. in main.ts or
 * App.vue setup), or it is called automatically when this module is first
 * imported in a browser context.
 */
export function startAuthExpiryWatcher(): void {
  const store = useAuthStore()
  // Immediate check on startup
  store.checkExpiry()
  setInterval(() => store.checkExpiry(), EXPIRY_CHECK_INTERVAL_MS)
}

// Auto-start when running in a browser (not during SSR or unit tests)
if (typeof window !== 'undefined') {
  // Defer until after Pinia is fully installed via microtask
  Promise.resolve().then(() => startAuthExpiryWatcher())
}
