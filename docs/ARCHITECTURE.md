# Relay Architecture

This document audits the current frontend prototype and defines a production direction for Relay. It is intentionally architectural: it does not implement authentication, cryptography, environment-file access, or backend APIs.

## Executive summary

The repository is a small Next.js App Router prototype with a single client-rendered application shell and static mock data. It already communicates the core product promise: **secrets stay local; Relay coordinates the handoff**. Its current shape is not yet a production boundary, so the next implementation should preserve the UI while replacing mock seams incrementally with typed application services, a backend, and a separately distributed desktop agent.

The key security decision is non-negotiable: plaintext environment values exist only on the local machines involved in a transfer. The browser and backend may handle names, status, permissions, public keys, encrypted payloads, and audit metadata, but never plaintext values.

## Current repository audit

### Framework, package manager, and structure

- **Framework:** Next.js with the App Router. The manifest uses `next: latest`; the code is compatible with the current Next.js 16 direction.
- **Package manager:** npm, evidenced by `package-lock.json` and the absence of a `packageManager` field.
- **Entry points:** `app/layout.tsx` defines metadata and the root document. `app/page.tsx` renders the prototype.
- **Directory structure:** `app/` contains the page and global CSS; `lib/mock-data.ts` contains all data; root config contains `next.config.mjs`, `tsconfig.json`, package manifests, and a minimal README. There is no `components/`, `server/`, `api/`, `desktop/`, `packages/`, `tests/`, or `docs/` structure yet.
- **Routing:** No route segments exist beyond `/`. Navigation is a client-side `Page` union and React state. Project details and transfer workflows are in-page views/modals rather than shareable routes.
- **Components:** `page.tsx` contains the shell, page views, detail view, status display, transfer modal, and command palette in one file. Styling is mostly custom CSS in `app/globals.css`.
- **Mock-data architecture:** `lib/mock-data.ts` exports untyped arrays for projects, transfers, variables, members, and devices. The UI imports these directly, so there is no repository/service boundary.
- **State management:** Local React `useState` and `useEffect` only. State covers selected page/project, modal flow, command palette, theme, and mobile navigation. There is no server state, cache, URL state, form state, or persistence.
- **API abstraction:** None. No route handlers, server actions, fetch clients, schemas, or domain services exist.
- **Environment configuration:** No runtime environment variables or `.env` access are used by the prototype. The project should not add environment-secret access to the browser. Future server configuration must use validated server-only variables.
- **Dependencies:** React, Next.js, TypeScript, Tailwind CSS, Radix dialog/slot, `lucide-react`, `next-themes`, and small class utilities. There is no database client, auth library, API client, validation library, test runner, desktop framework, or cryptography package.
- **TypeScript:** Strict mode, no emit, bundler resolution, `@/*` mapped to the repository root, and Next's TypeScript plugin. This is a sound base, but domain types should replace inferred mock-array shapes.
- **Linting:** `npm run lint` invokes `eslint .`, but no ESLint configuration was found in the current repository audit. Confirm and add a minimal explicit config before relying on lint in CI.
- **Testing:** No test script, test files, or test framework is present.
- **Build:** `npm run build` is the existing validation path and currently passes. `next.config.mjs` only enables `reactStrictMode`.
- **Deployment:** No deployment configuration, CI workflow, runtime service configuration, or documented environment setup is present. The app is deployable as a Next.js web app, but the API and desktop agent will need separate release targets.

### Evolution blockers

1. One large client component mixes navigation, presentation, workflow state, and future domain behavior.
2. In-page state navigation prevents deep links, refresh-safe workflows, browser history, and route-level authorization.
3. Mock data is imported directly by UI components, making a real API replacement invasive.
4. No explicit domain types or API contracts exist for authorization-sensitive entities.
5. No server boundary exists to enforce permissions or protect secrets.
6. “Encrypted” and “secure” UI copy is currently product intent, not implemented cryptographic evidence; it must not be treated as a security guarantee.
7. No test, migration, observability, release, or threat-modeling foundation exists.

## Product architecture

Relay has three layers:

### Web application (`apps/web`)

The web app handles sign-in, teams, membership, projects, device inventory, transfer coordination, transfer metadata, permissions, audit-event browsing, and security settings. It may display variable names and transfer metadata when authorized. It must never receive plaintext environment values.

### Backend (`apps/api`)

The backend authenticates users, authorizes team/project actions, stores teams and metadata, registers devices and public keys, tracks transfer state, routes encrypted payloads, and records audit metadata. It must reject designs that require plaintext environment values. Payload storage should be treated as opaque ciphertext with strict size, ownership, expiry, and replay controls.

### Desktop agent (`apps/desktop`)

The agent is the trusted local boundary. It owns device identity, private keys, local environment files, Git/repository detection, local encryption/decryption, conflict detection, and environment installation. It communicates with the backend using authenticated device sessions and sends only encrypted payloads plus safe metadata.

## Recommended repository architecture

```text
relay/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── api/                 # Backend HTTP/API service and workers
│   └── desktop/             # Desktop agent, installer, local IPC/UI
├── packages/
│   ├── shared/              # Safe domain types, IDs, validation schemas
│   ├── protocol/            # Versioned transfer/API protocol contracts
│   ├── crypto/              # Audited crypto primitives and envelopes
│   └── ui/                  # Reusable visual components, if sharing is useful
├── docs/
│   ├── ARCHITECTURE.md
│   ├── THREAT-MODEL.md
│   └── protocol/            # Versioned protocol decisions
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

A workspace is preferable once the API and desktop agent are introduced because protocol types and validation must be versioned and tested once, while apps retain independent deployment and release lifecycles. The current npm-based single app can remain intact during the first migration; introduce the workspace only when a second runnable app is created. Do not split the current prototype prematurely or duplicate UI code before a real shared consumer exists.

`shared` must contain only safe contracts and never secret values. `protocol` should define wire formats, lifecycle transitions, idempotency, and compatibility. `crypto` should be isolated, reviewed, versioned, and backed by test vectors; it must not become an ad-hoc collection of encryption helpers.

## Domain model

These are conceptual entities, not an implementation schema yet.

- **User:** An authenticated human identity. Owns memberships, sessions, and personal device registrations.
- **Team:** A workspace boundary for members, projects, devices, policies, and audit events.
- **TeamMembership:** Joins a user to a team with a role, status, invitation metadata, and permission scope. All team-scoped access is evaluated through it.
- **Project:** A team-owned logical codebase identity. Stores safe repository signals, display metadata, policy settings, and links to transfers; it is not a filesystem path.
- **Device:** A user-owned trusted endpoint with a stable device ID, public key, capabilities, status, last-seen data, and revocation state. Private keys never leave it.
- **Transfer:** The coordination record for one handoff: sender, project, recipients, status, protocol version, timestamps, expiry, and audit references.
- **TransferRecipient:** Per-recipient state and authorization for a transfer, including recipient device selection, approval/decline, delivery, and installation result.
- **TransferPayload:** Opaque encrypted content plus envelope metadata, key-wrapping information for intended devices, checksum, size, protocol version, and expiry. It must not expose plaintext values.
- **AuditEvent:** Append-oriented record of security-relevant actions, actor, team/project/transfer references, device, timestamp, result, and safe context. Never include values or raw payloads.

Relationships: a User has many TeamMemberships and Devices; a Team has many memberships, Projects, and AuditEvents; a Project has many Transfers; a Transfer has one sender, one or more TransferRecipients, and one encrypted TransferPayload; devices participate in sender/recipient authorization; all mutations produce audit events.

## Transfer lifecycle

The canonical lifecycle is:

```text
created → encrypted → sent → received → approved → installing → installed
```

- **created:** Sender selected a project, recipient(s), target, and safe variable-name policy. Store actor, project, recipient, protocol version, and expiry.
- **encrypted:** Sender agent produced a local ciphertext envelope. Store checksum, size, key-envelope metadata, device IDs, and encryption/protocol version—not values.
- **sent:** Backend accepted the payload and notified recipients. Store delivery attempt and idempotency metadata.
- **received:** Recipient device fetched and authenticated the payload. Store device, timestamp, and receipt result.
- **approved:** Recipient explicitly authorized local installation after reviewing safe metadata and conflict preview.
- **installing:** Recipient agent began a local transactional install. Store operation ID and progress/result metadata only.
- **installed:** Agent completed installation and reports counts/checksum/result. Never report values.

Terminal or exceptional states: **declined** (recipient rejected), **expired** (past policy deadline), **cancelled** (authorized actor stopped it), and **failed** (delivery, authentication, decryption, conflict, or installation failure). Every transition must be server-authorized, monotonic, idempotent where possible, timestamped, and audited. Error details must be sanitized.

## Security boundaries

### Browser

May know authenticated user/team context, authorized project names, repository identifiers, variable names, transfer status, recipient identities, public keys or key fingerprints, checksums, and safe conflict summaries. It may initiate approvals and coordination actions. It must never receive plaintext values, private keys, decrypted payloads, or `.env` file contents. Browser state, analytics, URLs, errors, and logs must not contain secrets.

### Backend

May know identities, memberships, permissions, project identity signals, device public keys, lifecycle metadata, encrypted payload bytes, envelope metadata, checksums, expiry, and audit events. It must not be able to decrypt payloads and must never accept plaintext values as an API field.

### Sender desktop agent

May read plaintext environment values from explicitly selected local files, hold the sender private key, construct the project identity, encrypt values, and retain local operation state. Plaintext should be short-lived, minimized, cleared where practical, excluded from logs, and protected by the host OS.

### Recipient desktop agent

May hold the recipient private key, decrypt a payload intended for that device, compare local files, show a local conflict preview, request approval, and write files after an explicit decision. Plaintext may exist only in protected process memory and the local target file during the approved operation.

**Intended invariant:** plaintext environment values exist only on the local machines involved in the transfer. They do not exist in the browser, backend database, backend logs, analytics, audit events, or transport metadata.

## Project identity

A project should be matched using a stable normalized identity rather than a filesystem path alone. Candidate signals, from strongest to supporting:

1. normalized Git remote URL (provider, host, owner, repository, and stable repository ID when available);
2. provider repository owner/name and immutable repository ID;
3. Git repository root and commit/repository metadata;
4. package metadata such as `package.json` name as a hint, never as sole identity;
5. local filesystem path only as a device-local display/location, never a cross-device identity.

The agent should canonicalize remotes, support SSH and HTTPS forms, handle multiple remotes explicitly, and allow a user to confirm or link an ambiguous match. Repository metadata is untrusted input: validate length and format, avoid executing hooks, and do not let a remote URL alone grant project access. A project record should retain an immutable provider/repository identifier where available plus the normalized remote and an optional user-confirmed link.

## API boundaries

These are proposed groups, not implemented endpoints.

- **Authentication:** session creation/refresh/revocation, current user, device/session binding, account recovery, and logout. No environment data.
- **Teams:** create/update team, invitations, membership listing, role changes, leave/remove member, and team policy settings.
- **Projects:** list/create/link/unlink projects, repository identity matching, project members/policies, and safe variable-name metadata.
- **Devices:** register device public key, list device status, rotate/revoke device, challenge/authenticate device, and key fingerprint retrieval.
- **Transfers:** create transfer intent, upload/fetch opaque encrypted payload, list/detail, recipient receipt, approve/decline, cancel, state transitions, expiry, and sanitized installation results. Require idempotency keys and strict authorization at every operation.
- **Audit events:** authorized, paginated, append-only event query and security export. Do not expose payload bytes or secret-bearing request fields.

The web app should call a typed client/service boundary rather than import mock data. Server-side authorization remains authoritative; client checks are only UX.

## Desktop-agent boundary

Exclusive desktop-agent operations include:

- reading and parsing selected environment files;
- handling plaintext values and minimizing their lifetime;
- generating, protecting, rotating, and using private device keys;
- encrypting sender payloads and decrypting recipient payloads;
- detecting repository roots and normalized Git identity;
- comparing target files and producing local conflict previews;
- requiring explicit local approval;
- writing `.env` files transactionally with permission preservation and safe backup/rollback policy;
- communicating with the backend using device authentication and protocol-versioned messages.

The web app can request these operations through an authenticated local-agent bridge later, but it must not reproduce them in browser JavaScript or send file contents to the web app.

## Security risks and later mitigations

| Threat | Architectural mitigation |
|---|---|
| Plaintext secret leakage | Never model plaintext in web/API contracts; local-only parsing; redacted errors/logs; memory minimization; secure review of agent code. |
| Server compromise | End-to-end encryption; per-device key envelopes; least-privilege service access; encrypted opaque storage; key revocation and short-lived transfer expiry. |
| Browser compromise | No plaintext browser capability; strict CSP and headers; XSS prevention; short sessions; CSRF protection; explicit approval outside the browser for installation. |
| Malicious team member | Role-based authorization, project membership, explicit recipient approval, device identity, immutable audit events, and transfer expiry/cancellation. |
| Compromised device | Device revocation, key rotation, last-seen health, re-authentication, scoped device access, and clear warning states. Revocation must block future fetch/decrypt operations. |
| Revoked device | Check revocation at registration, upload, fetch, approval, and key-envelope use; reject stale sessions and rotate affected keys. |
| Replayed transfer | Unique transfer IDs, nonce/sequence binding, recipient/device binding, expiry, one-time approval/install IDs, checksums, and idempotent state transitions. |
| Unauthorized project access | Backend-side team/project authorization on every query and mutation; never trust client-selected project IDs alone. |
| Wrong-project installation | Agent-side identity matching, explicit confirmation on ambiguity, target-path safeguards, conflict preview, and no automatic overwrite. |
| Accidental overwrite | Dry-run diff, explicit approval, atomic write, backups/rollback, permissions preservation, and configurable conflict policy. |
| Malicious repository metadata | Treat Git/package metadata as untrusted; parse safely, cap sizes, canonicalize URLs, avoid hooks/commands, and require confirmation for ambiguous matches. |
| Logs containing secrets | Structured redaction, allowlisted fields, no request-body logging for payload endpoints, secret-safe telemetry tests, and sanitized crash reporting. |
| Crash dumps containing secrets | Minimize plaintext lifetime, disable/limit dumps where appropriate, scrub buffers where practical, and review platform crash-report settings. |
| Clipboard leakage | Avoid clipboard by default; warn when used, provide timed clearing where supported, never copy entire environments automatically, and audit local UX. |

Security claims in the current prototype are aspirational until these controls exist. Do not label the system end-to-end encrypted or secure in a way that implies implemented guarantees before independent review and tests.

## Development phases

1. **Repository architecture:** Keep the prototype working; introduce workspace conventions when a second app exists; extract domain types and protocol boundaries without moving secrets into shared code.
2. **Backend foundation:** Choose the service/runtime and database, define migrations, request validation, authorization middleware, opaque payload storage, audit model, and safe error/logging policy.
3. **Authentication and teams:** Implement sessions, users, teams, memberships, invitations, roles, project authorization, and route-level web protection.
4. **Devices and cryptographic identity:** Add device registration, public-key lifecycle, secure local private-key storage, revocation, key rotation, and test vectors with reviewed primitives.
5. **Transfer protocol:** Version the envelope and lifecycle, implement authenticated upload/fetch, recipient binding, expiry, idempotency, replay resistance, and audit transitions. Keep payload opaque to the server.
6. **Desktop project detection:** Build safe Git remote/root detection, normalization, repository matching, ambiguity handling, and local project linking.
7. **Environment installation:** Add local parsing, encryption/decryption, dry-run conflict detection, explicit approval, transactional writes, rollback, and platform permission handling.
8. **Security hardening:** Apply CSP/headers, rate limits, abuse controls, revocation enforcement, secret-safe telemetry, dependency review, threat-model review, and external security review.
9. **Testing:** Add unit and property tests for protocol/state transitions, crypto test vectors, authorization tests, API contract tests, agent integration tests, install rollback tests, redaction tests, and browser end-to-end tests. Include negative and adversarial cases.
10. **Deployment:** Establish separate web/API/desktop release pipelines, environment and secret management, database migrations, encrypted object retention/expiry, monitoring, incident response, staged desktop updates, signing/notarization, and operational runbooks.

## Preserve, change, and next step

### What exists

A polished responsive frontend prototype with overview, projects, project detail, transfers, devices, team, security settings, transfer modals, incoming-transfer flow, command palette, mobile navigation, theme toggle, and dedicated mock data. The build currently passes.

### What should change

Introduce real URL/routing boundaries, split the monolithic page into feature components, add typed domain contracts, put API calls behind services, add server-enforced authorization, and create separate API and desktop applications. Replace mock data incrementally rather than rewriting the UI.

### What should remain

The existing product language and privacy-first UX direction should remain. The frontend should continue to show safe variable names and metadata while explicitly avoiding plaintext values. The current dependency set is sufficient for the prototype.

### Recommended next implementation step

Create the first typed domain/protocol package and a backend foundation that can serve read-only teams, projects, devices, and transfer metadata. Wire one existing Projects or Transfers screen through a server API behind authorization while retaining mock fallback only in development. Do not upload or persist environment values during this step.

### Security-critical decisions

- Plaintext exists only on sender/recipient local machines.
- The backend stores and routes opaque ciphertext, never plaintext.
- Private keys remain on devices; only public keys and safe fingerprints leave them.
- Every team/project/device/transfer operation is authorized server-side.
- Transfers are versioned, expiring, recipient-bound, auditable, and replay-resistant.
- Installation is a local, explicit, conflict-aware, transactional agent operation.
- Security terminology must track implemented controls, not UI copy.

### Dependencies to avoid adding prematurely

Do not add a database client, auth provider, desktop framework, crypto library, object storage, queue, analytics SDK, or full state-management framework merely to support the prototype. First define the contracts and security boundaries. When implementation begins, choose audited, maintained primitives and use the platform/provider guidance for the selected stack rather than inventing cryptography or a custom key exchange.

## Validation note

This audit added documentation only. No frontend, backend, cryptographic, filesystem, or dependency changes were made.
