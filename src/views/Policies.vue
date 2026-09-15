<template>
  <div class="policies-page" role="main">
    <header class="policies-header">
      <h1 class="policies-title">Access Policies</h1>
      <p class="policies-subtitle">Kelola kebijakan akses token ke path secret.</p>
    </header>

    <!-- Create policy form -->
    <section class="policies-section" aria-labelledby="create-policy-heading">
      <h2 id="create-policy-heading" class="section-title">Buat Policy Baru</h2>

      <form class="create-form" @submit.prevent="handleCreate" novalidate>
        <!-- Error banner -->
        <div
          v-if="createError"
          class="error-banner"
          role="alert"
          aria-live="polite"
        >
          {{ createError }}
        </div>

        <!-- Success banner -->
        <div
          v-if="createSuccess"
          class="success-banner"
          role="status"
          aria-live="polite"
        >
          Policy berhasil dibuat.
        </div>

        <div class="form-row">
          <!-- Token selector -->
          <div class="field">
            <label for="policy-token" class="field-label">
              Token <span aria-hidden="true">*</span>
            </label>
            <select
              id="policy-token"
              v-model="newTokenId"
              class="field-input"
              required
              :disabled="creating || loadingTokens"
              aria-required="true"
            >
              <option value="" disabled>
                {{ loadingTokens ? 'Memuat token…' : 'Pilih token' }}
              </option>
              <option
                v-for="token in tokens"
                :key="token.id"
                :value="token.id"
              >
                {{ token.name }}
              </option>
            </select>
          </div>

          <!-- Path pattern -->
          <div class="field">
            <label for="policy-path" class="field-label">
              Path Pattern <span aria-hidden="true">*</span>
            </label>
            <input
              id="policy-path"
              v-model="newPathPattern"
              type="text"
              class="field-input"
              placeholder="Contoh: app/* atau app/db/password"
              required
              :disabled="creating"
              aria-required="true"
            />
          </div>
        </div>

        <!-- Permissions checkboxes -->
        <fieldset class="permissions-fieldset">
          <legend class="field-label">
            Permissions <span aria-hidden="true">*</span>
          </legend>
          <div class="permissions-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="permRead"
                :disabled="creating"
                class="checkbox-input"
              />
              <span>read</span>
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="permWrite"
                :disabled="creating"
                class="checkbox-input"
              />
              <span>write</span>
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                v-model="permDelete"
                :disabled="creating"
                class="checkbox-input"
              />
              <span>delete</span>
            </label>
          </div>
        </fieldset>

        <button
          type="submit"
          class="create-button"
          :disabled="creating || !isFormValid"
          :aria-busy="creating"
        >
          <span v-if="creating" class="spinner" aria-hidden="true"></span>
          {{ creating ? 'Membuat…' : 'Buat Policy' }}
        </button>
      </form>
    </section>

    <!-- Policy list -->
    <section class="policies-section" aria-labelledby="policy-list-heading">
      <h2 id="policy-list-heading" class="section-title">
        Daftar Policy
        <span v-if="!loadingPolicies" class="policy-count">({{ policies.length }})</span>
      </h2>

      <!-- Loading state -->
      <div v-if="loadingPolicies" class="state-message" role="status" aria-live="polite">
        <span class="spinner spinner--dark" aria-hidden="true"></span>
        Memuat policies…
      </div>

      <!-- Load error -->
      <div
        v-else-if="loadError"
        class="error-banner"
        role="alert"
        aria-live="polite"
      >
        {{ loadError }}
        <button class="retry-link" type="button" @click="loadAll">Coba lagi</button>
      </div>

      <!-- Empty state -->
      <p v-else-if="policies.length === 0" class="state-message empty-message">
        Belum ada policy. Buat policy pertama di atas.
      </p>

      <!-- Policy table -->
      <div v-else class="table-wrapper">
        <table class="policy-table" aria-label="Daftar access policy">
          <thead>
            <tr>
              <th scope="col">Token</th>
              <th scope="col">Path Pattern</th>
              <th scope="col">Permissions</th>
              <th scope="col"><span class="sr-only">Aksi</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="policy in policies" :key="policy.id">
              <td class="td-token">{{ tokenNameById(policy.token_id) }}</td>
              <td class="td-path">
                <code class="path-code">{{ policy.path_pattern }}</code>
              </td>
              <td class="td-perms">
                <span
                  v-for="perm in policy.permissions"
                  :key="perm"
                  class="perm-badge"
                  :class="`perm-badge--${perm}`"
                >
                  {{ perm }}
                </span>
              </td>
              <td class="td-action">
                <button
                  class="delete-button"
                  type="button"
                  :disabled="deletingId === policy.id"
                  :aria-busy="deletingId === policy.id"
                  :aria-label="`Hapus policy untuk ${tokenNameById(policy.token_id)} path ${policy.path_pattern}`"
                  @click="handleDelete(policy.id!)"
                >
                  <span v-if="deletingId === policy.id" class="spinner spinner--sm" aria-hidden="true"></span>
                  <span v-else>Hapus</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { listPolicies, createPolicy, deletePolicy, listTokens } from '@/api/client'
import type { Policy, Token } from '@/api/client'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const tokens = ref<Token[]>([])
const policies = ref<Policy[]>([])

const loadingTokens = ref(false)
const loadingPolicies = ref(false)
const loadError = ref('')

const newTokenId = ref<number | ''>('')
const newPathPattern = ref('')
const permRead = ref(false)
const permWrite = ref(false)
const permDelete = ref(false)

const creating = ref(false)
const createError = ref('')
const createSuccess = ref(false)

const deletingId = ref<number | null>(null)

// ---------------------------------------------------------------------------
// Computed
// ---------------------------------------------------------------------------

const selectedPermissions = computed<string[]>(() => {
  const perms: string[] = []
  if (permRead.value) perms.push('read')
  if (permWrite.value) perms.push('write')
  if (permDelete.value) perms.push('delete')
  return perms
})

const isFormValid = computed<boolean>(() =>
  newTokenId.value !== '' &&
  newPathPattern.value.trim().length > 0 &&
  selectedPermissions.value.length > 0
)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tokenNameById(tokenId: number): string {
  const found = tokens.value.find(t => t.id === tokenId)
  return found ? found.name : `Token #${tokenId}`
}

// ---------------------------------------------------------------------------
// Load data
// ---------------------------------------------------------------------------

async function loadAll(): Promise<void> {
  loadError.value = ''
  // Run both requests; handle independently so one failure shows an error
  loadingTokens.value = true
  loadingPolicies.value = true

  try {
    const [fetchedTokens, fetchedPolicies] = await Promise.all([
      listTokens(),
      listPolicies(),
    ])
    tokens.value = fetchedTokens
    policies.value = fetchedPolicies
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal memuat data.'
  } finally {
    loadingTokens.value = false
    loadingPolicies.value = false
  }
}

onMounted(loadAll)

// ---------------------------------------------------------------------------
// Create policy
// ---------------------------------------------------------------------------

async function handleCreate(): Promise<void> {
  createError.value = ''
  createSuccess.value = false

  if (!isFormValid.value) {
    createError.value = 'Lengkapi semua field dan pilih minimal satu permission.'
    return
  }

  creating.value = true
  try {
    const created = await createPolicy({
      token_id: newTokenId.value as number,
      path_pattern: newPathPattern.value.trim(),
      permissions: selectedPermissions.value,
    })
    // Prepend the new policy to the list
    policies.value = [created, ...policies.value]
    // Reset form
    newTokenId.value = ''
    newPathPattern.value = ''
    permRead.value = false
    permWrite.value = false
    permDelete.value = false
    createSuccess.value = true
    // Auto-hide success message after 3 seconds
    setTimeout(() => { createSuccess.value = false }, 3000)
  } catch (err: unknown) {
    createError.value =
      err instanceof Error ? err.message : 'Gagal membuat policy.'
  } finally {
    creating.value = false
  }
}

// ---------------------------------------------------------------------------
// Delete policy
// ---------------------------------------------------------------------------

async function handleDelete(id: number): Promise<void> {
  const policy = policies.value.find(p => p.id === id)
  const label = policy
    ? `policy untuk token "${tokenNameById(policy.token_id)}" dengan path "${policy.path_pattern}"`
    : 'policy ini'

  if (!window.confirm(`Hapus ${label}? Tindakan ini tidak dapat dibatalkan.`)) {
    return
  }

  deletingId.value = id
  try {
    await deletePolicy(id)
    policies.value = policies.value.filter(p => p.id !== id)
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal menghapus policy.'
  } finally {
    deletingId.value = null
  }
}
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────────── */
.policies-page {
  max-width: 860px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Header ─────────────────────────────────────────────────────── */
.policies-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.policies-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.policies-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* ── Section ────────────────────────────────────────────────────── */
.policies-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.policy-count {
  font-size: 0.875rem;
  font-weight: 400;
  color: #9ca3af;
}

/* ── Create form ────────────────────────────────────────────────── */
.create-form {
  background: var(--color-background-soft, #f9f9f9);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row .field {
  flex: 1;
  min-width: 200px;
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
  outline: none;
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
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

/* ── Permissions fieldset ───────────────────────────────────────── */
.permissions-fieldset {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.permissions-fieldset legend {
  float: left; /* keep legend before the group */
  width: 100%;
  margin-bottom: 0.375rem;
}

.permissions-group {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.9rem;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.checkbox-input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #4f46e5;
}

.checkbox-input:disabled {
  cursor: not-allowed;
}

/* ── Create button ──────────────────────────────────────────────── */
.create-button {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4f46e5;
  border: none;
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.55rem 1.25rem;
  transition: background-color 0.15s;
}

.create-button:hover:not(:disabled) {
  background-color: #4338ca;
}

.create-button:disabled {
  background-color: #a5b4fc;
  cursor: not-allowed;
}

/* ── Banners ────────────────────────────────────────────────────── */
.error-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #b91c1c;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}

.success-banner {
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 4px;
  color: #166534;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
}

.retry-link {
  background: none;
  border: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0;
  text-decoration: underline;
  flex-shrink: 0;
}

.retry-link:hover {
  color: #4338ca;
}

/* ── State messages ─────────────────────────────────────────────── */
.state-message {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #6b7280;
  padding: 1rem 0;
}

.empty-message {
  font-style: italic;
}

/* ── Policy table ───────────────────────────────────────────────── */
.table-wrapper {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.policy-table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9rem;
}

.policy-table th,
.policy-table td {
  padding: 0.65rem 1rem;
  text-align: left;
}

.policy-table th {
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.policy-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.policy-table tbody tr:last-child {
  border-bottom: none;
}

.policy-table tbody tr:hover {
  background-color: #fafafa;
}

.td-token {
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.td-path {
  min-width: 160px;
}

.path-code {
  background-color: #f3f4f6;
  border-radius: 3px;
  font-family: ui-monospace, monospace;
  font-size: 0.85rem;
  padding: 0.15em 0.4em;
  color: #374151;
}

.td-perms {
  min-width: 140px;
}

.perm-badge {
  border-radius: 9999px;
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  margin-right: 0.3rem;
  padding: 0.25em 0.6em;
  white-space: nowrap;
}

.perm-badge--read {
  background-color: #dbeafe;
  color: #1e40af;
}

.perm-badge--write {
  background-color: #dcfce7;
  color: #166534;
}

.perm-badge--delete {
  background-color: #fee2e2;
  color: #991b1b;
}

.td-action {
  white-space: nowrap;
  text-align: right;
}

/* ── Delete button ──────────────────────────────────────────────── */
.delete-button {
  background-color: transparent;
  border: 1px solid #fca5a5;
  border-radius: 4px;
  color: #b91c1c;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.3rem 0.65rem;
  transition: background-color 0.15s, border-color 0.15s;
}

.delete-button:hover:not(:disabled) {
  background-color: #fef2f2;
  border-color: #f87171;
}

.delete-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

/* ── Spinner ────────────────────────────────────────────────────── */
.spinner {
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  display: inline-block;
  height: 14px;
  width: 14px;
  flex-shrink: 0;
  animation: spin 0.7s linear infinite;
}

.spinner--dark {
  border-color: rgba(0, 0, 0, 0.12);
  border-top-color: #4f46e5;
}

.spinner--sm {
  height: 11px;
  width: 11px;
  border-width: 1.5px;
  border-color: rgba(185, 28, 28, 0.3);
  border-top-color: #b91c1c;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Accessibility helper ───────────────────────────────────────── */
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
