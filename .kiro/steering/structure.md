# Project Structure

## Directory Layout

```
gear-ui/
├── index.html              # Vite entry HTML, mounts #app
├── env.d.ts                # Ambient types for Vite env vars
├── vite.config.ts          # Build config, @ alias, /v1 dev proxy
├── tsconfig*.json          # Split TS config (app / node / root refs)
├── .env.example            # Template for VITE_ env vars
└── src/
    ├── main.ts             # App bootstrap: createApp + pinia + router
    ├── App.vue             # Root component (RouterView only)
    ├── api/
    │   └── client.ts       # apiFetch wrapper + typed API functions & types
    ├── store/
    │   └── auth.ts         # Pinia auth store (token, login, logout, expiry)
    ├── router/
    │   └── index.ts        # Route table + auth navigation guard
    ├── components/         # Reusable presentational components
    │   ├── AuditTable.vue
    │   ├── SecretTree.vue
    │   └── TokenCard.vue
    └── views/              # Route-level page components
        ├── Login.vue
        ├── Secrets.vue
        ├── SecretDetail.vue
        ├── Tokens.vue
        ├── Policies.vue
        └── AuditLog.vue
```

## Layer Responsibilities

- **`views/`** — One component per route. Owns page-level data loading, loading/
  error/empty states, and composes `components/`. Named after the route.
- **`components/`** — Reusable, presentational pieces. Receive data via props,
  communicate up via typed `emits`. No direct route or store coupling where it
  can be avoided.
- **`api/client.ts`** — The single place that talks to the backend. Exposes
  typed helper functions (`getSecret`, `listTokens`, etc.) and shared interfaces
  (`Secret`, `Token`, `Policy`, `AuditEntry`). Components/views never call
  `fetch` directly — they call these helpers.
- **`store/`** — Cross-cutting session state via Pinia. Currently only `auth`.
- **`router/`** — Route definitions and the global auth guard.

## Naming Conventions

- **Components & views:** `PascalCase.vue` (e.g. `SecretDetail.vue`).
- **TS modules:** `camelCase.ts` (e.g. `client.ts`, `auth.ts`).
- **Composables:** `useXxx` naming if/when added.
- **Types/interfaces:** `PascalCase`, defined alongside the API layer they
  describe.
- **Routes:** lowercase `name` and `path`; the view file mirrors the route
  concept.

## Import Patterns

- Use the `@` alias for all intra-`src` imports: `import { listSecrets } from '@/api/client'`.
- Do not use deep relative paths (`../../`) — prefer `@/...`.
- Import Vue APIs from `vue`, router APIs from `vue-router`.

## Component Conventions

- Always `<script setup lang="ts">` with the Composition API.
- Type props with `defineProps<T>()` (use `withDefaults` for optional props),
  and events with `defineEmits<{ eventName: [payload] }>()`.
- Every data-driven view renders explicit **loading**, **error**, and **empty**
  states — follow the pattern in `Secrets.vue`.
- Styling is component-scoped (`<style scoped>`). No global stylesheet.

## Architectural Decisions

- **Auth by default:** routes require authentication unless `meta.requiresAuth`
  is explicitly `false`. The guard in `router/index.ts` redirects
  unauthenticated users to `/login`.
- **Centralized HTTP concerns:** token injection and 401/403 handling live in
  `apiFetch`, not in individual callers. A 401 forces logout + redirect.
- **Circular-dependency avoidance:** `api/client.ts` lazily imports the auth
  store and router (dynamic `import()`) because the store/router may reference
  the client.
- **Session persistence:** only the token and its expiry are stored in
  `localStorage`; a 30s watcher (`startAuthExpiryWatcher`) logs the user out on
  expiry.
- **Secret paths as hierarchy:** `SecretTree.vue` derives a tree from flat path
  strings split on `/`; there is no server-side tree structure.
