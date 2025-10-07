# Security Review: MediaRefinery

This document is a lightweight, repeatable security review checklist for the MediaRefinery project focused on the PRD QA items (10.5).

Scope
- Secrets and config exposure (client vs server)
- Logging and redaction
- Role-based access and dashboard controls
- Third-party integrations (WordPress REST API, Supabase)
- Dependency & supply-chain checks
- Runtime hardening and network controls

Acceptance criteria (high level)
- No secrets or credentials are exposed to client bundles or public endpoints.
- Structured logs redact sensitive fields (tokens, passwords, API keys) by default.
- RBAC gates exist for destructive operations and are exercised by tests.
- Dependency vulnerability scan shows zero critical or high issues (or a mitigation plan exists).
- A rollback plan and verification steps are documented and tested (see operations guide).

Checklist
1. Secrets & Configuration
   - [ ] Confirm `.env.example` documents required server-only variables.
   - [ ] Confirm `src/lib/secrets` (server-only loader) is not imported by client code.
   - [ ] Verify SUPABASE and WP credentials are only consumed by server routes / worker code.

2. Logging & Redaction
   - [x] Confirm `redact()` helper is exported and used in middleware for incoming payloads. (covered by `tests/unit/server/redact.test.ts`)
   - [ ] Identify any custom structured log calls that include raw request bodies and add redaction keys.
   - [ ] Run quick grep for common sensitive keys (api_key, token, password, secret) in repo.

3. RBAC & Access Controls
   - [x] Verify `requireAdmin` middleware protects dashboard APIs for rewrites and rollbacks. (middleware exists and is used in server routes)
   - [x] Confirm unit tests exercise RBAC for at least one destructive endpoint. (`tests/unit/auth/middleware.test.ts` covers behavior)

4. Integrations & Least Privilege
   - [ ] Confirm WP account used for uploads has only necessary capabilities.
   - [ ] Confirm Supabase role used for writes is scoped to the required tables.

5. Dependency & SCA
   - [x] Run `npm audit --audit-level=high` or Snyk/Dependabot summary and capture results. (see Audit Summary below)
   - [ ] Document any acceptable exceptions with remediation timeline.

Audit Summary (npm audit --audit-level=high)
```
{ "moderate": 2, "high": 0, "critical": 0 }
```
Details: two moderate issues reported (lint-staged -> micromatch ReDoS). Fix available.

Quick grep for sensitive keys
```
Found environment variable names and secrets loader references in repo; `.env` in the workspace contains demo/staging values which should be removed from commits and kept out of source control. Tests and code reference server-only secret getters (e.g., `getSecret('WP_USERNAME')`). Logger default redact keys include `authorization`, `password`, `token`, `apikey`, `apiKey`, `secret`, `credentials`.
```

Immediate recommendations
- Remove or regenerate any real-looking keys in the workspace `.env` and add `.env` to `.gitignore` if not already.
- Upgrade `lint-staged`/`micromatch` to patched versions or apply `npm audit fix` where safe.


6. Network & Runtime
   - [ ] Confirm any outgoing network calls (WP, image hosts) are expected and rate-limited in the integration harness.
   - [ ] Check worker concurrency caps and ensure no infinite spawn or file descriptor leaks.

Required artifacts to mark 10.5 done
- a short markdown section summarizing findings and any remedial actions taken
- CI evidence (audit output) or link to SCA ticket if issues found
- Tests demonstrating RBAC and redaction behavior (already present in unit tests)

How to use
- Fill this doc with results during the review. When all checklist items are verified and artifacts attached, 10.5 can be marked done in the PRD/tasks files.
