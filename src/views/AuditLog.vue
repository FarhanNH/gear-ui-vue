<template>
  <div class="audit-log">
    <header class="audit-log__header">
      <h1 class="audit-log__title">Audit Log</h1>
    </header>

    <!-- Loading state -->
    <div v-if="loading" class="audit-log__loading" role="status" aria-live="polite">
      <span class="audit-log__spinner" aria-hidden="true"></span>
      <span>Loading audit entries…</span>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="audit-log__error" role="alert">
      <p class="audit-log__error-message">{{ error }}</p>
      <button class="audit-log__retry-btn" @click="load">Retry</button>
    </div>

    <!-- Table -->
    <AuditTable
      v-else
      :entries="entries"
      :total="total"
      :limit="limit"
      :offset="offset"
      @filter-change="onFilterChange"
      @page-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * AuditLog view
 *
 * Loads audit log entries via GET /v1/audit with filter and pagination params.
 * Delegates rendering to the AuditTable component which also owns filter controls.
 *
 * Requirements: 7.3, 8.8
 */
import { ref, onMounted } from 'vue'
import { getAuditLog } from '@/api/client'
import type { AuditEntry } from '@/api/client'
import AuditTable from '@/components/AuditTable.vue'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const entries = ref<AuditEntry[]>([])
const total = ref(0)
const limit = ref(100)
const offset = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const filters = ref<Record<string, string>>({})

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

async function load(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const params: Record<string, string | number> = {
      limit: limit.value,
      offset: offset.value,
      ...filters.value,
    }

    const response = await getAuditLog(params)
    entries.value = response.entries
    total.value = response.total
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load audit log'
  } finally {
    loading.value = false
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function onFilterChange(params: Record<string, string>): void {
  filters.value = params
  offset.value = 0
  load()
}

function onPageChange(newOffset: number): void {
  offset.value = newOffset
  load()
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

onMounted(load)
</script>

<style scoped>
.audit-log {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.audit-log__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.audit-log__title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

/* ── Loading state ──────────────────────────────────────────── */
.audit-log__loading {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem;
  color: #888;
  font-size: 0.9rem;
}

.audit-log__spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(128, 128, 128, 0.3);
  border-top-color: #4f8ef7;
  border-radius: 50%;
  animation: audit-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes audit-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Error state ────────────────────────────────────────────── */
.audit-log__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(239, 68, 68, 0.35);
  border-radius: 6px;
  background: rgba(239, 68, 68, 0.06);
}

.audit-log__error-message {
  margin: 0;
  color: #dc2626;
  font-size: 0.9rem;
}

.audit-log__retry-btn {
  padding: 0.35rem 0.85rem;
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 4px;
  background: transparent;
  color: #dc2626;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.audit-log__retry-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.audit-log__retry-btn:focus-visible {
  outline: 2px solid #4f8ef7;
  outline-offset: 1px;
}
</style>
