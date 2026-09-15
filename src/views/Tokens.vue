<template>
  <div class="tokens-page" role="main">
    <header class="tokens-header">
      <h1 class="tokens-title">Access Tokens</h1>
      <p class="tokens-subtitle">Buat dan kelola token akses API.</p>
    </header>

    <!-- Create token form -->
    <section class="tokens-section" aria-labelledby="create-token-heading">
      <h2 id="create-token-heading" class="section-title">Buat Token Baru</h2>

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

        <div class="form-row">
          <!-- Token name -->
          <div class="field">
            <label for="token-name" class="field-label">Nama Token <span aria-hidden="true">*</span></label>
            <input
              id="token-name"
              v-model="newName"
              type="text"
              class="field-input"
              placeholder="Contoh: ci-deploy, monitoring"
              required
              :disabled="creating"
              aria-required="true"
            />
          </div>

          <!-- TTL -->
          <div class="field">
            <label for="token-ttl" class="field-label">TTL (masa berlaku)</label>
            <div class="ttl-combo">
              <select
                id="token-ttl"
                v-model="newTTL"
                class="field-input ttl-select"
                :disabled="creating"
                aria-label="Pilih atau masukkan TTL"
              >
                <option value="1h">1 jam (1h)</option>
                <option value="24h">24 jam (24h)</option>
                <option value="720h">30 hari (720h)</option>
                <option value="8760h">1 tahun (8760h)</option>
                <option value="custom">Kustom…</option>
              </select>
              <input
                v-if="newTTL === 'custom'"
                v-model="customTTL"
                type="text"
                class="field-input ttl-custom-input"
                placeholder="Contoh: 48h, 168h"
                :disabled="creating"
                aria-label="Masukkan TTL kustom"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          class="create-button"
          :disabled="creating || !newName.trim() || (newTTL === 'custom' && !customTTL.trim())"
          :aria-busy="creating"
        >
          <span v-if="creating" class="spinner" aria-hidden="true"></span>
          {{ creating ? 'Membuat…' : 'Buat Token' }}
        </button>
      </form>
    </section>

    <!-- Token list -->
    <section class="tokens-section" aria-labelledby="token-list-heading">
      <h2 id="token-list-heading" class="section-title">
        Daftar Token
        <span v-if="!loading" class="token-count">({{ tokens.length }})</span>
      </h2>

      <!-- Loading state -->
      <div v-if="loading" class="state-message" role="status" aria-live="polite">
        <span class="spinner spinner--dark" aria-hidden="true"></span>
        Memuat token…
      </div>

      <!-- Load error -->
      <div
        v-else-if="loadError"
        class="error-banner"
        role="alert"
        aria-live="polite"
      >
        {{ loadError }}
        <button class="retry-link" type="button" @click="loadTokens">Coba lagi</button>
      </div>

      <!-- Empty state -->
      <p v-else-if="tokens.length === 0" class="state-message empty-message">
        Belum ada token. Buat token pertama di atas.
      </p>

      <!-- Token cards -->
      <div v-else class="token-list" aria-label="Daftar access token">
        <TokenCard
          v-for="token in tokens"
          :key="token.id"
          :token="token"
          @revoke="handleRevoke"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { listTokens, createToken, revokeToken } from '@/api/client'
import type { Token } from '@/api/client'
import TokenCard from '@/components/TokenCard.vue'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const tokens = ref<Token[]>([])
const loading = ref(false)
const loadError = ref('')

const newName = ref('')
const newTTL = ref('720h')
const customTTL = ref('')
const creating = ref(false)
const createError = ref('')

// ---------------------------------------------------------------------------
// Load tokens
// ---------------------------------------------------------------------------

async function loadTokens(): Promise<void> {
  loading.value = true
  loadError.value = ''
  try {
    tokens.value = await listTokens()
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal memuat token.'
  } finally {
    loading.value = false
  }
}

onMounted(loadTokens)

// ---------------------------------------------------------------------------
// Create token
// ---------------------------------------------------------------------------

async function handleCreate(): Promise<void> {
  createError.value = ''
  const name = newName.value.trim()
  const ttl = newTTL.value === 'custom' ? customTTL.value.trim() : newTTL.value

  if (!name) {
    createError.value = 'Nama token wajib diisi.'
    return
  }
  if (!ttl) {
    createError.value = 'TTL wajib diisi.'
    return
  }

  creating.value = true
  try {
    const created = await createToken(name, ttl)
    // Prepend so the new token (with plaintext) appears at the top
    tokens.value = [created, ...tokens.value]
    // Reset form
    newName.value = ''
    newTTL.value = '720h'
    customTTL.value = ''
  } catch (err: unknown) {
    createError.value =
      err instanceof Error ? err.message : 'Gagal membuat token.'
  } finally {
    creating.value = false
  }
}

// ---------------------------------------------------------------------------
// Revoke token
// ---------------------------------------------------------------------------

async function handleRevoke(id: number): Promise<void> {
  try {
    await revokeToken(id)
    // Reload list to reflect revoked status from server
    await loadTokens()
  } catch (err: unknown) {
    loadError.value =
      err instanceof Error ? err.message : 'Gagal merevoke token.'
  }
}
</script>

<style scoped>
/* ── Page shell ─────────────────────────────────────────────────── */
.tokens-page {
  max-width: 780px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Header ─────────────────────────────────────────────────────── */
.tokens-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tokens-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

.tokens-subtitle {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

/* ── Section ────────────────────────────────────────────────────── */
.tokens-section {
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

.token-count {
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
  min-width: 180px;
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

/* TTL combo: select + optional custom text input side by side */
.ttl-combo {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.ttl-select {
  flex: 1;
}

.ttl-custom-input {
  flex: 1;
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

/* ── Error banner ───────────────────────────────────────────────── */
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

/* ── Token list ─────────────────────────────────────────────────── */
.token-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
