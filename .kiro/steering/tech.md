# Technology Stack

## Core Framework

- **Vue 3** (`^3.4`) using the **Composition API** with `<script setup lang="ts">`.
- **TypeScript** (`^5.4`) in strict mode. All source is typed; avoid `any`.
- **Vite** (`^5.2`) as the dev server and build tool.

## Libraries

- **vue-router** (`^4.3`) — client-side routing with `createWebHistory`.
- **pinia** (`^2.1`) — state management. Stores use the options-object style
  (see `src/store/auth.ts`).
- **@vueuse/core** (`^10.9`) — composition utilities. Prefer these over
  hand-rolled equivalents.

## Tooling

- **vue-tsc** — type checking and build-time template checks.
- Path alias `@` → `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).
  Always import via `@/...` rather than long relative paths.

## Backend Integration

- The UI talks to the `gear-engine` REST API under the `/v1` prefix.
- Base URL comes from `import.meta.env.VITE_API_BASE_URL`, defaulting to
  `https://localhost:8443`.
- In dev, Vite proxies `/v1` to the backend (see `server.proxy` in
  `vite.config.ts`), with `secure: false` to allow self-signed certs.
- All API calls go through `apiFetch` in `src/api/client.ts`, which injects the
  bearer token, sets JSON content type, and centralizes 401/403 handling.

## Environment

- Configuration is via `VITE_`-prefixed env vars only (Vite requirement).
- Copy `.env.example` to `.env` for local setup. Never commit real `.env` files
  or secret values.

## Constraints & Conventions

- **Do not add new dependencies** without a clear need; prefer the existing
  stack and `@vueuse/core`.
- **No CSS framework.** Styling is plain scoped CSS inside each component's
  `<style scoped>` block. Match the existing design tokens (indigo `#4f46e5`
  primary, gray neutrals, 4px radii).
- **No global state for secrets.** Secret values are fetched on demand and not
  cached in Pinia.
- Keep the client stateless beyond the auth session; the only persisted values
  are the token and its expiry in `localStorage`.

## Commands

```bash
npm run dev          # start Vite dev server
npm run build        # type-check (vue-tsc) then production build
npm run preview      # preview the production build
npm run type-check   # vue-tsc --noEmit only
```

> Note: `dev` and `preview` are long-running servers — run them in your own
> terminal, not as one-off automated commands.
