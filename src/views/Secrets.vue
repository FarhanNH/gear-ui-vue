<template>
  <div class="secrets-view" role="main">
    <!-- Header bar -->
    <div class="secrets-header">
      <h1 class="secrets-title">Secrets</h1>
      <div class="secrets-actions">
        <button
          class="btn btn--icon"
          :disabled="loading"
          :aria-busy="loading"
          title="Refresh"
          @click="loadPaths"
        >
          <span class="icon-refresh" :class="{ 'icon-refresh--spinning': loading }" aria-hidden="true">↻</span>
          <span class="sr-only">Refresh</span>
        </button>
        <button class="btn btn--primary" @click="navigateToNew">
          + New Secret
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="secrets-state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true"></span>
      <span>Loading secrets…</span>
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="secrets-state secrets-state--error"
      role="alert"
      aria-live="assertive"
    >
      <span class="state-icon" aria-hidden="true">⚠️</span>
      <p class="state-message">{{ error }}</p>
      <button class="btn btn--secondary" @click="loadPaths">Try again</button>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="paths.length === 0"
      class="secrets-state secrets-state--empty"
    >
      <span class="state-icon" aria-hidden="true">🗝️</span>
      <p class="state-message">No secrets found.</p>
      <p class="state-hint">Create your first secret to get started.</p>
      <button class="btn btn--primary" @click="navigateToNew">New Secret</button>
    </div>

    <!-- Secret tree -->
    <div v-else class="secrets-tree-wrapper">
      <SecretTree :paths="paths" @select="onSelectPath" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { listSecrets } from '@/api/client'
import SecretTree from '@/components/SecretTree.vue'

const router = useRouter()

const paths = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

async function loadPaths(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    paths.value = await listSecrets('')
  } catch (err: unknown) {
    error.value =
      err instanceof Error ? err.message : 'Failed to load secrets. Please try again.'
  } finally {
    loading.value = false
  }
}

function onSelectPath(path: string): void {
  router.push(`/secrets/${path}`)
}

function navigateToNew(): void {
  router.push('/secrets/new')
}

onMounted(loadPaths)
</script>

<style scoped>
.secrets-view {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100%;
}

/* Header */
.secrets-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  gap: 1rem;
}

.secrets-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.secrets-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Buttons */
.btn {
  align-items: center;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.9rem;
  font-weight: 500;
  gap: 0.4rem;
  justify-content: center;
  padding: 0.45rem 0.9rem;
  transition: background-color 0.15s, opacity 0.15s;
  white-space: nowrap;
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn--primary {
  background-color: #4f46e5;
  color: #ffffff;
}

.btn--primary:hover:not(:disabled) {
  background-color: #4338ca;
}

.btn--secondary {
  background-color: #e5e7eb;
  color: #374151;
}

.btn--secondary:hover:not(:disabled) {
  background-color: #d1d5db;
}

.btn--icon {
  background-color: transparent;
  color: #6b7280;
  padding: 0.45rem;
  font-size: 1.1rem;
}

.btn--icon:hover:not(:disabled) {
  background-color: rgba(0, 0, 0, 0.06);
  color: #374151;
}

/* Refresh icon */
.icon-refresh {
  display: inline-block;
  font-style: normal;
  line-height: 1;
}

.icon-refresh--spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* State panels (loading / error / empty) */
.secrets-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.secrets-state--error {
  color: #b91c1c;
}

.state-icon {
  font-size: 2.5rem;
  line-height: 1;
}

.state-message {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
}

.state-hint {
  margin: 0;
  font-size: 0.85rem;
  color: #9ca3af;
}

/* Spinner (loading) */
.spinner {
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-top-color: #4f46e5;
  border-radius: 50%;
  display: inline-block;
  height: 24px;
  width: 24px;
  animation: spin 0.7s linear infinite;
}

/* Tree container */
.secrets-tree-wrapper {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  overflow: auto;
}

/* Accessibility helper */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
