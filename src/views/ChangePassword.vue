<template>
  <div class="login-wrapper" role="main">
    <div class="login-card">
      <h1 class="login-title">Change Password</h1>
      <p class="login-subtitle">Update your admin password</p>

      <form class="login-form" @submit.prevent="handleSubmit" novalidate>
        <!-- Success banner -->
        <div
          v-if="success"
          class="success-banner"
          role="status"
          aria-live="polite"
        >
          Password changed successfully
        </div>

        <!-- Error banner -->
        <div
          v-if="error"
          class="error-banner"
          role="alert"
          aria-live="polite"
        >
          {{ error }}
        </div>

        <!-- Current Password -->
        <div class="field">
          <label for="currentPassword" class="field-label">Current Password</label>
          <input
            id="currentPassword"
            v-model="currentPassword"
            type="password"
            class="field-input"
            autocomplete="current-password"
            required
            :disabled="loading"
            aria-required="true"
            placeholder="Enter current password"
          />
        </div>

        <!-- New Password -->
        <div class="field">
          <label for="newPassword" class="field-label">New Password</label>
          <input
            id="newPassword"
            v-model="newPassword"
            type="password"
            class="field-input"
            autocomplete="new-password"
            required
            :disabled="loading"
            aria-required="true"
            placeholder="Enter new password"
          />
        </div>

        <!-- Confirm New Password -->
        <div class="field">
          <label for="confirmPassword" class="field-label">Confirm New Password</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            class="field-input"
            autocomplete="new-password"
            required
            :disabled="loading"
            aria-required="true"
            :aria-invalid="!!mismatchError"
            placeholder="Confirm new password"
          />
          <span v-if="mismatchError" class="field-error" role="alert">{{ mismatchError }}</span>
        </div>

        <button
          type="submit"
          class="login-button"
          :disabled="loading || !currentPassword || !newPassword || !confirmPassword"
          :aria-busy="loading"
        >
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          {{ loading ? 'Saving\u2026' : 'Change Password' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '@/api/client'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const router = useRouter()
const success = ref(false)
const mismatchError = ref('')
const loading = ref(false)

async function handleSubmit() {
  error.value = ''
  success.value = false
  mismatchError.value = ''

  if (newPassword.value !== confirmPassword.value) {
    mismatchError.value = 'New passwords do not match'
    return
  }

  loading.value = true
  try {
    const res = await apiFetch('/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword.value,
        new_password: newPassword.value,
      }),
    })

    if (res.status === 204) {
      success.value = true
    setTimeout(() => router.push('/secrets'), 1000)
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    } else {
      let message = `Error: ${res.status}`
      try {
        const body = await res.json()
        if (body?.error) message = body.error
      } catch {
        // ignore JSON parse errors
      }
      error.value = message
    }
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Request failed. Please try again.'
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
  min-height: calc(100vh - 56px);
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

.success-banner {
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 4px;
  color: #15803d;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
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

.field-error {
  font-size: 0.8rem;
  color: #b91c1c;
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
