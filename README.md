# Gear UI

Web admin console for **Gear**, a self-hosted secret management system. Gear UI
is a Vue 3 single-page app that lets operators manage secrets, access tokens,
policies, and audit logs served by the `gear-engine` backend.

## Features

- **Authentication** — username/password login with bearer-token sessions and
  automatic expiry.
- **Secrets** — browse secrets as a hierarchical tree, view/edit values, create,
  and delete.
- **Tokens** — create scoped tokens with a TTL, list active tokens, and revoke
  them (plaintext token shown once at creation).
- **Policies** — define path-pattern permissions bound to tokens, list, and
  delete.
- **Audit log** — review a filterable history of access and admin actions.

## Tech Stack

- [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)
- [VueUse](https://vueuse.org/)

## Prerequisites

- **Node.js 20+** and npm
- A running `gear-engine` backend (defaults to `https://localhost:8443`)
- **uv** (Python package manager) — untuk graphify

## Graphify — Knowledge Graph

Project ini menggunakan [graphify](https://github.com/Graphify-Labs/graphify) untuk membangun knowledge graph kodebase, sehingga AI coding assistant dapat memahami struktur project lebih efisien.

### Install graphify (sekali per mesin)

```bash
# Install uv (jika belum ada)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Install graphify CLI
uv tool install graphifyy

# Register skill ke AI assistant
graphify install
```

### Update graphify-out (setiap ada perubahan kode)

```bash
graphify . --code-only
```

Output tersimpan di `graphify-out/` (sudah di-ignore oleh git). Jalankan ulang perintah ini setiap kali ada perubahan signifikan pada kode agar knowledge graph tetap akurat.

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure the backend URL
cp .env.example .env
# edit .env and set VITE_API_BASE_URL if your backend is elsewhere

# 3. Start the dev server
npm run dev
```

The app runs at the URL printed by Vite (default `http://localhost:5173`). In
dev, requests to `/v1` are proxied to `VITE_API_BASE_URL`, with self-signed TLS
certs allowed.

## Configuration

Configuration uses `VITE_`-prefixed environment variables.

| Variable            | Default                  | Description                     |
| ------------------- | ------------------------ | ------------------------------- |
| `VITE_API_BASE_URL` | `https://localhost:8443` | Base URL of the gear-engine API |

> Never commit real `.env` files or secret values.

## Scripts

```bash
npm run dev          # start the Vite dev server
npm run build        # type-check (vue-tsc) then build for production
npm run preview      # preview the production build locally
npm run type-check   # run vue-tsc --noEmit only
```

## Project Structure

```
src/
├── main.ts          # App bootstrap (Vue + Pinia + Router)
├── App.vue          # Root component
├── api/client.ts    # apiFetch wrapper + typed API helpers
├── store/auth.ts    # Pinia auth store (token, login, expiry)
├── router/index.ts  # Routes + auth navigation guard
├── components/      # Reusable presentational components
└── views/           # Route-level page components
```

See `.kiro/steering/` for detailed product, tech, and structure documentation.

## Building for Production

```bash
npm run build
```

The type-checked, bundled output is written to `dist/`, which can be served by
any static file host. Ensure the deployed app can reach the `gear-engine` API
(configure a reverse proxy for `/v1` or set the appropriate base URL).

## CI/CD

The workflow in `.github/workflows/deploy.yml` checks pushes and pull requests
to `master`. Pushing a `vMAJOR.MINOR.PATCH` tag whose commit belongs to `master`
builds `ghcr.io/farhannh/gear-ui-vue:<tag>` and deploys only `gear-ui` through
`/opt/apps/gear/deploy.sh` on the VPS. The shared deployment kit is maintained
in the `gear-engine` repository under `deploy/` and must already be installed.

Configure `VPS_HOST`, `VPS_PORT`, `VPS_USER`, `VPS_SSH_KEY`, and
`VPS_FINGERPRINT` in repository Actions secrets. The VPS deploy user also needs
pull access to the private GHCR package.

The Docker build defaults `VITE_API_BASE_URL` to an empty string so `/v1`
requests use the UI Nginx proxy. Local `.env*` files are excluded from the Docker
build context; runtime Nginx environment variables cannot change the compiled
API URL. The production build includes TypeScript checking; there is no UI
unit-test or lint script yet. CI also runs `npm audit --audit-level=moderate`.

## Security Notes

- All storage, encryption, and authorization live in the backend; this UI is a
  thin client.
- Only the session token and its expiry are persisted (in `localStorage`).
  Secret values are fetched on demand and never cached.
- Sessions log out automatically on token expiry, and any `401` response forces
  logout and redirect to `/login`.
