<template>
  <div class="login-wrapper" role="main">
    <div class="login-card">
      <h1 class="login-title">Gear Secret Management</h1>
      <p class="login-subtitle">Sign in to continue</p>

      <form class="login-form" @submit.prevent="handleLogin" novalidate>
        <!-- Error banner -->
        <div
          v-if="error"
          class="error-banner"
          role="alert"
          aria-live="polite"
        >
          {{ error }}
        </div>

        <!-- Username -->
        <div class="field">
          <label for="username" class="field-label">Username</label>
          <input
            id="username"
            v-model="username"
            type="text"
            class="field-input"
            autocomplete="username"
            autocapitalize="none"
            spellcheck="false"
            required
            :disabled="loading"
            aria-required="true"
            :aria-invalid="!!error"
            placeholder="Enter your username"
          />
        </div>

        <!-- Password -->
        <div class="field">
          <label for="password" class="field-label">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            class="field-input"
            autocomplete="current-password"
            required
            :disabled="loading"
            aria-required="true"
            :aria-invalid="!!error"
            placeholder="Enter your password"
          />
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="login-button"
          :disabled="loading || !username || !password"
          :aria-busy="loading"
        >
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true

  try {
    await authStore.login(username.value, password.value)
    const redirect = route.query.redirect
    const destination =
      typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect
        : '/secrets'
    router.push(destination)
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 1rem;
}

.login-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  padding: 2.5rem 2rem;
  width: 100%;
  max-width: 400px;
}

.login-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: #1a1a1a;
}

.login-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0 0 1.75rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.error-banner {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #b91c1c;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.field-input {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.field-input:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  color: #9ca3af;
}

.login-button {
  align-items: center;
  background-color: #4f46e5;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  cursor: pointer;
  display: flex;
  font-size: 0.95rem;
  font-weight: 500;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.625rem 1rem;
  transition: background-color 0.15s;
  width: 100%;
}

.login-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.login-button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

.spinner {
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #ffffff;
  border-radius: 50%;
  display: inline-block;
  height: 14px;
  width: 14px;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
