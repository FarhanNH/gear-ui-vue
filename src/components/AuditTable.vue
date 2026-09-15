<template>
  <div class="audit-table">
    <!-- Filter controls -->
    <div class="audit-table__filters" role="search" aria-label="Filter audit log">
      <div class="audit-table__filter-group">
        <label for="filter-token" class="audit-table__filter-label">Token Name</label>
        <input
          id="filter-token"
          v-model="filters.token_name"
          type="text"
          class="audit-table__filter-input"
          placeholder="Filter by token name…"
          @input="onFilterChange"
        />
      </div>

      <div class="audit-table__filter-group">
        <label for="filter-path" class="audit-table__filter-label">Path</label>
        <input
          id="filter-path"
          v-model="filters.path"
          type="text"
          class="audit-table__filter-input"
          placeholder="Filter by path…"
          @input="onFilterChange"
        />
      </div>

      <div class="audit-table__filter-group">
        <label for="filter-result" class="audit-table__filter-label">Result</label>
        <select
          id="filter-result"
          v-model="filters.result"
          class="audit-table__filter-select"
          @change="onFilterChange"
        >
          <option value="">All</option>
          <option value="success">Success</option>
          <option value="denied">Denied</option>
          <option value="error">Error</option>
          <option value="attempt">Attempt</option>
        </select>
      </div>

      <div class="audit-table__filter-group">
        <label for="filter-since" class="audit-table__filter-label">Since</label>
        <input
          id="filter-since"
          v-model="filters.since"
          type="date"
          class="audit-table__filter-input"
          @change="onFilterChange"
        />
      </div>

      <div class="audit-table__filter-group">
        <label for="filter-until" class="audit-table__filter-label">Until</label>
        <input
          id="filter-until"
          v-model="filters.until"
          type="date"
          class="audit-table__filter-input"
          @change="onFilterChange"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="audit-table__wrapper" role="region" aria-label="Audit log entries" tabindex="0">
      <table class="audit-table__table">
        <caption class="audit-table__caption">
          Audit Log
          <span class="audit-table__count">({{ total }} entries)</span>
        </caption>
        <thead>
          <tr>
            <th scope="col" class="audit-table__th">Token Name</th>
            <th scope="col" class="audit-table__th">Path</th>
            <th scope="col" class="audit-table__th">Action</th>
            <th scope="col" class="audit-table__th">Result</th>
            <th scope="col" class="audit-table__th">IP Address</th>
            <th scope="col" class="audit-table__th">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="entries.length === 0">
            <td colspan="6" class="audit-table__empty">No entries found.</td>
          </tr>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            class="audit-table__row"
          >
            <td class="audit-table__td audit-table__td--token">
              {{ entry.token_name ?? '—' }}
            </td>
            <td class="audit-table__td audit-table__td--path">
              <code>{{ entry.path ?? '—' }}</code>
            </td>
            <td class="audit-table__td">{{ entry.action }}</td>
            <td class="audit-table__td">
              <span
                class="audit-table__badge"
                :class="resultBadgeClass(entry.result)"
              >
                {{ entry.result }}
              </span>
            </td>
            <td class="audit-table__td audit-table__td--ip">{{ entry.ip_address }}</td>
            <td class="audit-table__td audit-table__td--timestamp">
              {{ formatTimestamp(entry.timestamp) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <nav
      v-if="totalPages > 0"
      class="audit-table__pagination"
      aria-label="Pagination"
    >
      <button
        class="audit-table__page-btn"
        :disabled="currentPage <= 1"
        :aria-disabled="currentPage <= 1"
        @click="goToPrevPage"
      >
        ← Previous
      </button>

      <span class="audit-table__page-info">
        Page {{ currentPage }} of {{ totalPages }}
        <span class="audit-table__page-total">({{ total }} total)</span>
      </span>

      <button
        class="audit-table__page-btn"
        :disabled="currentPage >= totalPages"
        :aria-disabled="currentPage >= totalPages"
        @click="goToNextPage"
      >
        Next →
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AuditEntry } from '@/api/client'

// ---------------------------------------------------------------------------
// Props & Emits
// ---------------------------------------------------------------------------

const props = defineProps<{
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}>()

const emit = defineEmits<{
  'filter-change': [params: Record<string, string>]
  'page-change': [offset: number]
}>()

// ---------------------------------------------------------------------------
// Filter state
// ---------------------------------------------------------------------------

const filters = ref({
  token_name: '',
  path: '',
  result: '',
  since: '',
  until: '',
})

function onFilterChange(): void {
  const params: Record<string, string> = {}
  if (filters.value.token_name) params.token_name = filters.value.token_name
  if (filters.value.path) params.path = filters.value.path
  if (filters.value.result) params.result = filters.value.result
  if (filters.value.since) params.since = filters.value.since
  if (filters.value.until) params.until = filters.value.until
  emit('filter-change', params)
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

const totalPages = computed(() =>
  props.limit > 0 ? Math.ceil(props.total / props.limit) : 0
)

const currentPage = computed(() =>
  props.limit > 0 ? Math.floor(props.offset / props.limit) + 1 : 1
)

function goToPrevPage(): void {
  const newOffset = Math.max(0, props.offset - props.limit)
  emit('page-change', newOffset)
}

function goToNextPage(): void {
  const newOffset = props.offset + props.limit
  emit('page-change', newOffset)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps a result value to a CSS modifier class for the badge. */
function resultBadgeClass(result: string): string {
  switch (result.toLowerCase()) {
    case 'success':
      return 'audit-table__badge--success'
    case 'denied':
      return 'audit-table__badge--denied'
    case 'error':
      return 'audit-table__badge--error'
    case 'attempt':
      return 'audit-table__badge--attempt'
    default:
      return 'audit-table__badge--default'
  }
}

/** Formats an ISO timestamp string into a human-readable local date/time. */
function formatTimestamp(ts: string): string {
  if (!ts) return '—'
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(ts))
  } catch {
    return ts
  }
}
</script>

<style scoped>
/* Layout container */
.audit-table {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── Filters ─────────────────────────────────────────────────── */
.audit-table__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.audit-table__filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 140px;
}

.audit-table__filter-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.audit-table__filter-input,
.audit-table__filter-select {
  padding: 0.35rem 0.6rem;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
}

.audit-table__filter-input:focus,
.audit-table__filter-select:focus {
  outline: none;
  border-color: #4f8ef7;
}

/* ── Table wrapper (horizontal scroll on small screens) ───────── */
.audit-table__wrapper {
  overflow-x: auto;
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 6px;
}

.audit-table__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.audit-table__caption {
  caption-side: top;
  text-align: left;
  padding: 0.5rem 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.audit-table__count {
  font-weight: 400;
  font-size: 0.85rem;
  color: #888;
  margin-left: 0.4rem;
}

.audit-table__th {
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #888;
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
  white-space: nowrap;
  background: rgba(128, 128, 128, 0.05);
}

.audit-table__td {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  vertical-align: middle;
}

.audit-table__row:last-child .audit-table__td {
  border-bottom: none;
}

.audit-table__row:hover .audit-table__td {
  background-color: rgba(128, 128, 128, 0.06);
}

.audit-table__td--path code {
  font-family: monospace;
  font-size: 0.82rem;
  background: rgba(128, 128, 128, 0.1);
  padding: 0.1em 0.35em;
  border-radius: 3px;
}

.audit-table__td--timestamp {
  white-space: nowrap;
  font-size: 0.82rem;
  color: #888;
}

.audit-table__td--ip {
  font-family: monospace;
  font-size: 0.82rem;
}

.audit-table__empty {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

/* ── Result badges ────────────────────────────────────────────── */
.audit-table__badge {
  display: inline-block;
  padding: 0.2em 0.55em;
  border-radius: 99px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: lowercase;
  letter-spacing: 0.02em;
}

.audit-table__badge--success {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}

.audit-table__badge--denied {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

.audit-table__badge--error {
  background: rgba(249, 115, 22, 0.15);
  color: #ea580c;
}

.audit-table__badge--attempt {
  background: rgba(99, 102, 241, 0.15);
  color: #6366f1;
}

.audit-table__badge--default {
  background: rgba(128, 128, 128, 0.15);
  color: #888;
}

/* ── Pagination ───────────────────────────────────────────────── */
.audit-table__pagination {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: center;
}

.audit-table__page-btn {
  padding: 0.4rem 0.9rem;
  border: 1px solid rgba(128, 128, 128, 0.35);
  border-radius: 4px;
  background: transparent;
  color: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.audit-table__page-btn:hover:not(:disabled) {
  background-color: rgba(128, 128, 128, 0.1);
  border-color: rgba(128, 128, 128, 0.5);
}

.audit-table__page-btn:focus-visible {
  outline: 2px solid #4f8ef7;
  outline-offset: 1px;
}

.audit-table__page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.audit-table__page-info {
  font-size: 0.875rem;
  color: #888;
}

.audit-table__page-total {
  margin-left: 0.25rem;
  font-size: 0.82rem;
}
</style>
