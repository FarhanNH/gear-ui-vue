<template>
  <article
    class="token-card"
    :class="{ 'token-card--revoked': token.revoked }"
    :aria-label="`Token: ${token.name}${token.revoked ? ', revoked' : ', active'}`"
  >
    <!-- Header row: name + status badge -->
    <div class="token-card__header">
      <h3 class="token-card__name" :class="{ 'token-card__name--revoked': token.revoked }">
        {{ token.name }}
      </h3>
      <span
        class="token-card__badge"
        :class="token.revoked ? 'token-card__badge--revoked' : 'token-card__badge--active'"
        :aria-label="token.revoked ? 'Status: Revoked' : 'Status: Active'"
      >
        {{ token.revoked ? 'Revoked' : 'Active' }}
      </span>
    </div>

    <!-- Metadata -->
    <dl class="token-card__meta">
      <div class="token-card__meta-row">
        <dt class="token-card__meta-label">Created</dt>
        <dd class="token-card__meta-value">{{ formatDate(token.created_at) }}</dd>
      </div>
      <div class="token-card__meta-row">
        <dt class="token-card__meta-label">Expires</dt>
        <dd class="token-card__meta-value">{{ expiresLabel }}</dd>
      </div>
    </dl>

    <!-- One-time plaintext display (only present right after creation) -->
    <div v-if="token.token" class="token-card__plaintext" role="region" aria-label="New token value — save now">
      <p class="token-card__plaintext-warning" aria-live="assertive">
        ⚠️ Save this token now — it will not be shown again!
      </p>
      <div class="token-card__plaintext-row">
        <code class="token-card__plaintext-value" aria-label="Token value">{{ token.token }}</code>
        <button
          class="token-card__copy-btn"
          type="button"
          :aria-label="copied ? 'Copied to clipboard' : 'Copy token to clipboard'"
          @click="copyToken"
        >
          {{ copied ? '✓ Copied' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Revoke button (only when active) -->
    <div v-if="!token.revoked" class="token-card__actions">
      <button
        class="token-card__revoke-btn"
        type="button"
        :aria-label="`Revoke token: ${token.name}`"
        @click="handleRevoke"
      >
        Revoke Token
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Token } from '@/api/client'

// ---------------------------------------------------------------------------
// Props & emits
// ---------------------------------------------------------------------------

const props = defineProps<{
  token: Token
}>()

const emit = defineEmits<{
  revoke: [id: number]
}>()

// ---------------------------------------------------------------------------
// Copy-to-clipboard state
// ---------------------------------------------------------------------------

const copied = ref(false)

function copyToken(): void {
  if (!props.token.token) return
  const plaintext = props.token.token
  const markCopied = () => {
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
  if (navigator.clipboard) {
    navigator.clipboard.writeText(plaintext).then(markCopied).catch(() => {
      fallbackCopy(plaintext)
      markCopied()
    })
  } else {
    fallbackCopy(plaintext)
    markCopied()
  }
}

function fallbackCopy(text: string): void {
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'absolute'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

// ---------------------------------------------------------------------------
// Revoke handler
// ---------------------------------------------------------------------------

function handleRevoke(): void {
  const confirmed = window.confirm('Revoke this token?')
  if (confirmed) {
    emit('revoke', props.token.id)
  }
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

const expiresLabel = computed<string>(() => {
  if (!props.token.expires_at) return 'Never'
  return formatDate(props.token.expires_at)
})
</script>

<style scoped>
/* ── Card shell ─────────────────────────────────────────────────── */
.token-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(128, 128, 128, 0.25);
  border-radius: 8px;
  background: var(--color-background-soft, #f9f9f9);
  transition: border-color 0.15s ease, opacity 0.15s ease;
}

.token-card--revoked {
  opacity: 0.65;
  border-color: rgba(128, 128, 128, 0.15);
}

/* ── Header ─────────────────────────────────────────────────────── */
.token-card__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.token-card__name {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.token-card__name--revoked {
  text-decoration: line-through;
  color: var(--color-text-muted, #888);
}

/* ── Status badge ───────────────────────────────────────────────── */
.token-card__badge {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  flex-shrink: 0;
}

.token-card__badge--active {
  background: #d1fae5;
  color: #065f46;
}

.token-card__badge--revoked {
  background: #fee2e2;
  color: #991b1b;
}

/* ── Metadata ───────────────────────────────────────────────────── */
.token-card__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.token-card__meta-row {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.token-card__meta-label {
  color: var(--color-text-muted, #888);
  min-width: 4.5rem;
}

.token-card__meta-value {
  color: var(--color-text, inherit);
  font-weight: 500;
}

/* ── Plaintext one-time display ─────────────────────────────────── */
.token-card__plaintext {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  background: #fefce8;
  border: 1px solid #fde68a;
}

.token-card__plaintext-warning {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #92400e;
}

.token-card__plaintext-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.token-card__plaintext-value {
  flex: 1;
  font-family: 'Menlo', 'Consolas', 'Monaco', monospace;
  font-size: 0.8rem;
  word-break: break-all;
  background: #fff;
  border: 1px solid #fde68a;
  border-radius: 4px;
  padding: 0.3rem 0.5rem;
  color: #1c1917;
}

.token-card__copy-btn {
  flex-shrink: 0;
  padding: 0.3rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  color: #374151;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.token-card__copy-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.token-card__copy-btn:focus-visible {
  outline: 2px solid #4f8ef7;
  outline-offset: 2px;
}

/* ── Revoke button ──────────────────────────────────────────────── */
.token-card__actions {
  display: flex;
  justify-content: flex-end;
}

.token-card__revoke-btn {
  padding: 0.4rem 1rem;
  border: 1px solid #f87171;
  border-radius: 5px;
  background: transparent;
  color: #dc2626;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.token-card__revoke-btn:hover {
  background: #dc2626;
  color: #fff;
}

.token-card__revoke-btn:focus-visible {
  outline: 2px solid #dc2626;
  outline-offset: 2px;
}
</style>
