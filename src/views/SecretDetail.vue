<template>
  <div class="detail-view" role="main">
    <!-- Back navigation -->
    <div class="detail-nav">
      <button class="btn btn--ghost" @click="router.push('/secrets')">
        ← Back to Secrets
      </button>
    </div>

    <!-- ─── NEW SECRET FORM ─── -->
    <template v-if="isNew">
      <div class="detail-card">
        <h1 class="detail-title">New Secret</h1>

        <div v-if="saveSuccess" class="feedback feedback--success" role="status" aria-live="polite">
          Secret created successfully.
        </div>
        <div v-if="saveError" class="feedback feedback--error" role="alert" aria-live="assertive">
          {{ saveError }}
        </div>

        <form @submit.prevent="handleCreate" novalidate>
          <div class="field">
            <label for="new-path" class="field-label">Path <span class="required" aria-hidden="true">*</span></label>
            <input
              id="new-path"
              v-model="newPath"
              type="text"
              class="field-input"
              placeholder="e.g. app/database/password"
              required
              :disabled="saving"
              aria-required="true"
              spellcheck="false"
              autocomplete="off"
            />
            <span class="field-hint">Use <code>/</code> as separator. No leading slash.</span>
          </div>

          <div class="field">
            <label for="new-value" class="field-label">Value <span class="required" aria-hidden="true">*</span></label>
            <textarea
              id="new-value"
              v-model="newValue"
              class="field-textarea"
              rows="5"
              placeholder="Secret value…"
              required
              :disabled="saving"
              aria-required="true"
              spellcheck="false"
              autocomplete="off"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn--primary"
              :disabled="saving || !newPath.trim() || !newValue.trim()"
              :aria-busy="saving"
            >
              <span v-if="saving" class="spinner" aria-hidden="true"></span>
              {{ saving ? 'Creating…' : 'Create Secret' }}
            </button>
          </div>
        </form>
      </div>
    </template>

    <!-- ─── EXISTING SECRET ─── -->
    <template v-else>
      <!-- Loading state -->
      <div v-if="loading" class="detail-state" role="status" aria-live="polite">
        <span class="spinner spinner--dark" aria-hidden="true"></span>
        <span>Loading secret…</span>
      </div>

      <!-- Load error state -->
      <div
        v-else-if="loadError"
        class="detail-state detail-state--error"
        role="alert"
        aria-live="assertive"
      >
        <span class="state-icon" aria-hidden="true">⚠️</span>
        <p class="state-message">{{ loadError }}</p>
        <button class="btn btn--secondary" @click="loadSecret">Try again</button>
      </div>

      <!-- Loaded: edit/delete form -->
      <div v-else class="detail-card">
        <div class="detail-header">
          <h1 class="detail-title">
            <span class="detail-title-label">Secret</span>
            <code class="detail-path">{{ secretPath }}</code>
          </h1>
          <button
            class="btn btn--danger"
            :disabled="deleting || saving"
            :aria-busy="deleting"
            @click="handleDelete"
          >
            <span v-if="deleting" class="spinner spinner--light" aria-hidden="true"></span>
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </button>
        </div>

        <!-- Operation feedback -->
        <div v-if="saveSuccess" class="feedback feedback--success" role="status" aria-live="polite">
          Secret saved successfully.
        </div>
        <div v-if="saveError" class="feedback feedback--error" role="alert" aria-live="assertive">
          {{ saveError }}
        </div>
        <div v-if="deleteError" class="feedback feedback--error" role="alert" aria-live="assertive">
          {{ deleteError }}
        </div>

        <form @submit.prevent="handleSave" novalidate>
          <div class="field">
            <label for="secret-value" class="field-label">Value</label>
            <textarea
              id="secret-value"
              v-model="editValue"
              class="field-textarea"
              rows="8"
              :disabled="saving || deleting"
              spellcheck="false"
              autocomplete="off"
              aria-label="Secret value"
            ></textarea>
          </div>

          <div class="form-actions">
            <button
              type="submit"
              class="btn btn--primary"
              :disabled="saving || deleting"
              :aria-busy="saving"
            >
              <span v-if="saving" class="spinner spinner--light" aria-hidden="true"></span>
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSecret, putSecret, deleteSecret } from '@/api/client'

const route = useRoute()
const router = useRouter()

// The router uses `/secrets/:path(.*)` — params.path is the wildcard capture
const secretPath = computed(() => {
  const p = route.params.path
  return Array.isArray(p) ? p.join('/') : (p as string)
})

const isNew = computed(() => secretPath.value === 'new')

// ── Existing secret state ──────────────────────────────────────────────────
const loading = ref(false)
const loadError = ref<string | null>(null)
const editValue = ref('')

const saving = ref(false)
const saveSuccess = ref(false)
const saveError = ref<string | null>(null)

const deleting = ref(false)
const deleteError = ref<string | null>(null)

// ── New secret state ───────────────────────────────────────────────────────
const newPath = ref('')
const newValue = ref('')

// ── Load existing secret ───────────────────────────────────────────────────
async function loadSecret(): Promise<void> {
  loading.value = true
  loadError.value = null
  saveSuccess.value = false
  saveError.value = null
  deleteError.value = null

  try {
    const secret = await getSecret(secretPath.value)
    editValue.value = secret.value
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : 'Failed to load secret. Please try again.'
  } finally {
    loading.value = false
  }
}

// ── Save (edit) existing secret ────────────────────────────────────────────
async function handleSave(): Promise<void> {
  saving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    await putSecret(secretPath.value, editValue.value)
    saveSuccess.value = true
    router.push('/secrets')
  } catch (err: unknown) {
    saveError.value =
      err instanceof Error ? err.message : 'Failed to save secret. Please try again.'
  } finally {
    saving.value = false
  }
}

// ── Delete existing secret ─────────────────────────────────────────────────
async function handleDelete(): Promise<void> {
  const confirmed = window.confirm(
    `Delete secret "${secretPath.value}"?\n\nThis action cannot be undone.`
  )
  if (!confirmed) return

  deleting.value = true
  deleteError.value = null

  try {
    await deleteSecret(secretPath.value)
    router.push('/secrets')
  } catch (err: unknown) {
    deleteError.value =
      err instanceof Error ? err.message : 'Failed to delete secret. Please try again.'
    deleting.value = false
  }
}

// ── Create new secret ──────────────────────────────────────────────────────
async function handleCreate(): Promise<void> {
  saving.value = true
  saveSuccess.value = false
  saveError.value = null

  try {
    await putSecret(newPath.value.trim(), newValue.value)
    saveSuccess.value = true
    saving.value = false
    router.push('/secrets')
  } catch (err: unknown) {
    saveError.value =
      err instanceof Error ? err.message : 'Failed to create secret. Please try again.'
    saving.value = false
  }
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  if (!isNew.value) {
    loadSecret()
  }
})
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  max-width: 760px;
  margin: 0 auto;
  min-height: 100%;
}

/* Back navigation */
.detail-nav {
  margin-bottom: 1rem;
}

/* Card container */
.detail-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.75rem 2rem;
}

/* Header row (title + delete button) */
.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.detail-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #1a1a1a;
}

.detail-title-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

/* standalone h1 used on New Secret form */
.detail-card > h1.detail-title {
  font-size: 1.3rem;
  flex-direction: row;
  align-items: center;
  margin-bottom: 1.25rem;
}

.detail-path {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
  word-break: break-all;
}

/* Loading / error states */
.detail-state {
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

.detail-state--error {
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

/* Feedback banners */
.feedback {
  border-radius: 4px;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
}

.feedback--success {
  background-color: #f0fdf4;
  border: 1px solid #86efac;
  color: #166534;
}

.feedback--error {
  background-color: #fef2f2;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

/* Form fields */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  margin-bottom: 1.25rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #dc2626;
  margin-left: 0.1em;
}

.field-hint {
  font-size: 0.8rem;
  color: #9ca3af;
}

.field-hint code {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.8rem;
  background: #f3f4f6;
  border-radius: 3px;
  padding: 0 0.25em;
}

.field-input,
.field-textarea {
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.95rem;
  padding: 0.5rem 0.75rem;
  transition: border-color 0.15s, box-shadow 0.15s;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}

.field-textarea {
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
  resize: vertical;
}

.field-input:focus,
.field-textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
}

.field-input:disabled,
.field-textarea:disabled {
  background-color: #f9fafb;
  cursor: not-allowed;
  color: #9ca3af;
}

/* Form action row */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
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
  opacity: 0.55;
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

.btn--danger {
  background-color: #dc2626;
  color: #ffffff;
}

.btn--danger:hover:not(:disabled) {
  background-color: #b91c1c;
}

.btn--ghost {
  background-color: transparent;
  color: #4f46e5;
  padding: 0.35rem 0.5rem;
  font-size: 0.875rem;
}

.btn--ghost:hover:not(:disabled) {
  background-color: rgba(79, 70, 229, 0.07);
}

/* Spinners */
.spinner {
  border-radius: 50%;
  display: inline-block;
  animation: spin 0.7s linear infinite;
}

.spinner--dark {
  border: 2px solid rgba(79, 70, 229, 0.2);
  border-top-color: #4f46e5;
  height: 24px;
  width: 24px;
}

.spinner--light {
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  height: 14px;
  width: 14px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
