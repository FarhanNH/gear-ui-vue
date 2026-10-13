/**
 * API client for gear-engine
 *
 * - Base URL from import.meta.env.VITE_API_BASE_URL
 * - Injects Authorization: Bearer {token} from Pinia auth store
 * - Intercepts 401 → logout() + redirect /login
 * - Intercepts 403 → console.warn (Forbidden)
 *
 * Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 9.4
 */

// ---------------------------------------------------------------------------
// Base URL
// ---------------------------------------------------------------------------

export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:8443'

// ---------------------------------------------------------------------------
// Type definitions
// ---------------------------------------------------------------------------

export interface Secret {
  path: string
  value: string
  version?: number
  updated_at?: string
}

export interface Token {
  id: number
  name: string
  /** Present only on creation response */
  token?: string
  expires_at?: string
  revoked: boolean
  created_at: string
}

export interface Policy {
  id?: number
  token_id: number
  path_pattern: string
  permissions: string[]
}

export interface AuditEntry {
  id: number
  token_name?: string
  path?: string
  action: string
  result: string
  ip_address: string
  timestamp: string
}

export interface AuditLogResponse {
  entries: AuditEntry[]
  total: number
  limit: number
  offset: number
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

/**
 * apiFetch wraps the native fetch with:
 *  1. Authorization: Bearer header injection from Pinia auth store
 *  2. Content-Type: application/json when a body is present
 *  3. 401 → logout() + redirect /login
 *  4. 403 → console.warn("Forbidden")
 *
 * Uses a lazy dynamic import of the auth store to avoid circular dependency
 * issues (the store itself imports router, which may import api/client).
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // Lazy import to avoid circular dependencies
  const { useAuthStore } = await import('@/store/auth')
  const authStore = useAuthStore()

  const headers = new Headers(options.headers)

  // Inject auth token if available
  if (authStore.token) {
    headers.set('Authorization', `Bearer ${authStore.token}`)
  }

  // Add Content-Type for requests with a body
  if (options.body !== undefined && options.body !== null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    authStore.logout()
    // Import the router module directly (not useRouter() which requires component context)
    try {
      const { default: router } = await import('@/router/index')
      await router.push('/login')
    } catch {
      window.location.href = '/login'
    }
    return response
  }

  if (response.status === 403) {
    console.warn('Forbidden: insufficient permissions for this resource')
  }

  return response
}

// ---------------------------------------------------------------------------
// Typed helper functions
// ---------------------------------------------------------------------------

/**
 * GET /v1/secret/{path}
 * Returns the decrypted secret object.
 */
export async function getSecret(path: string): Promise<Secret> {
  const response = await apiFetch(`/v1/secret/${encodeURIComponent(path)}`)
  if (!response.ok) {
    throw new Error(`getSecret failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<Secret>
}

/**
 * PUT /v1/secret/{path}
 * Upserts a secret value. Returns 204 on success.
 */
export async function putSecret(path: string, value: string): Promise<void> {
  const response = await apiFetch(`/v1/secret/${encodeURIComponent(path)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  })
  if (!response.ok) {
    throw new Error(`putSecret failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * DELETE /v1/secret/{path}
 * Deletes a secret. Returns 204 on success.
 */
export async function deleteSecret(path: string): Promise<void> {
  const response = await apiFetch(`/v1/secret/${encodeURIComponent(path)}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`deleteSecret failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * GET /v1/list/{prefix}
 * Lists secret paths under a prefix. Returns an array of path strings.
 */
export async function listSecrets(prefix: string): Promise<string[]> {
  const response = await apiFetch(`/v1/list/${encodeURIComponent(prefix)}`)
  if (!response.ok) {
    throw new Error(`listSecrets failed: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as { paths: string[] }
  return data.paths
}

/**
 * POST /v1/token
 * Creates a new access token. The plaintext token is only present on this response.
 */
export async function createToken(name: string, ttl: string): Promise<Token> {
  const response = await apiFetch('/v1/token', {
    method: 'POST',
    body: JSON.stringify({ name, ttl }),
  })
  if (!response.ok) {
    throw new Error(`createToken failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<Token>
}

/**
 * DELETE /v1/token/{id}
 * Revokes a token. Returns 204 on success.
 */
export async function revokeToken(id: number): Promise<void> {
  const response = await apiFetch(`/v1/token/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`revokeToken failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * GET /v1/token
 * Lists all active tokens (without plaintext values).
 */
export async function listTokens(): Promise<Token[]> {
  const response = await apiFetch('/v1/token')
  if (!response.ok) {
    throw new Error(`listTokens failed: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as { tokens: Token[] }
  return data.tokens
}

/**
 * POST /v1/policy
 * Creates a new access policy.
 */
export async function createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy> {
  const response = await apiFetch('/v1/policy', {
    method: 'POST',
    body: JSON.stringify(policy),
  })
  if (!response.ok) {
    throw new Error(`createPolicy failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<Policy>
}

/**
 * DELETE /v1/policy/{id}
 * Deletes a policy. Returns 204 on success.
 */
export async function deletePolicy(id: number): Promise<void> {
  const response = await apiFetch(`/v1/policy/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error(`deletePolicy failed: ${response.status} ${response.statusText}`)
  }
}

/**
 * GET /v1/policy
 * Lists policies, optionally filtered by token_id.
 */
export async function listPolicies(tokenId?: number): Promise<Policy[]> {
  const query = tokenId !== undefined ? `?token_id=${tokenId}` : ''
  const response = await apiFetch(`/v1/policy${query}`)
  if (!response.ok) {
    throw new Error(`listPolicies failed: ${response.status} ${response.statusText}`)
  }
  const data = await response.json() as { policies: Policy[] }
  return data.policies
}

/**
 * GET /v1/audit
 * Retrieves audit log entries with optional filters.
 * params may include: token_id, path, since, until, result, limit, offset
 */
export async function getAuditLog(params?: Record<string, string | number>): Promise<AuditLogResponse> {
  let query = ''
  if (params && Object.keys(params).length > 0) {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    )
    query = `?${qs.toString()}`
  }
  const response = await apiFetch(`/v1/audit${query}`)
  if (!response.ok) {
    throw new Error(`getAuditLog failed: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<AuditLogResponse>
}
