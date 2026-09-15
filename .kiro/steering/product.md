# Product Overview

## Purpose

Gear UI is the web admin console for **Gear**, a self-hosted secret management
system. It provides a browser-based interface for operators to store, retrieve,
and govern access to sensitive values (API keys, database credentials, TLS
material, etc.) served by the `gear-engine` backend.

The UI is a thin, security-focused client. All storage, encryption, and
authorization logic lives in the backend; this app is responsible for
presentation, workflow, and enforcing an authenticated session.

## Target Users

- **Platform / DevOps engineers** who manage secrets for applications and
  infrastructure.
- **Security administrators** who create access tokens, define policies, and
  review audit trails.
- **Service owners** who need to read or rotate secrets scoped to their
  applications.

These are internal, technical users operating inside a trusted network. The UI
is not intended for public/anonymous access.

## Key Features

- **Authentication** — Username/password login against the backend, with
  bearer-token sessions and automatic expiry handling.
- **Secret management** — Browse secrets as a hierarchical tree, view/edit
  values, create new secrets, and delete them.
- **Token management** — Create scoped access tokens (with TTL), list active
  tokens, and revoke them. Plaintext tokens are shown only once at creation.
- **Policy management** — Define path-pattern-based permissions bound to tokens,
  list policies, and remove them.
- **Audit log** — Review a filterable history of access and administrative
  actions (who, what path, action, result, IP, timestamp).

## Business Objectives

- Provide a secure, auditable single pane of glass for secret operations.
- Reduce the risk of credential sprawl and unmanaged access by centralizing
  secrets behind tokens and policies.
- Keep the client attack surface minimal: no secret material persisted beyond
  what the session requires, no long-lived tokens, hard logout on expiry.

## Design Principles

- **Security first.** Default to authenticated routes, fail closed, surface
  permission errors clearly.
- **Least surprise.** Explicit loading, empty, and error states for every data
  view.
- **Accessible.** Semantic markup, ARIA roles, keyboard navigation, and screen
  reader support are expected, not optional.
