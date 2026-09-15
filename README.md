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

## Security Notes

- All storage, encryption, and authorization live in the backend; this UI is a
  thin client.
- Only the session token and its expiry are persisted (in `localStorage`).
  Secret values are fetched on demand and never cached.
- Sessions log out automatically on token expiry, and any `401` response forces
  logout and redirect to `/login`.
