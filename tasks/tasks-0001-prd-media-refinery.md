# Task List: 0001 PRD MediaRefinery

Generated from `0001-prd-media-refinery.md` (Expanded with detailed sub-tasks)

## Relevant Files

- `package.json` - Node/Next.js project dependencies and scripts.
- `README.md` - Project overview and setup instructions.
- `src/` - Application source code (placeholder added)
- `dashboard/` - Next.js dashboard app (placeholder added)
- `tests/` - Unit and integration tests (placeholder added)
- `supabase/` - Supabase migrations and schema (placeholder added)
 - `.eslintrc.json` - ESLint configuration
 - `.prettierrc` - Prettier configuration
 - `.env.example` - Example environment variables
 - `src/config/index.ts` - Environment loader & schema validation (Zod)
- `src/config/index.ts` - Centralized configuration loader (env + defaults like quality, width, concurrency).
- `src/config/schedule.ts` - Scheduling window evaluation utilities.
- `src/lib/wordpress/client.ts` - WordPress REST API client wrapper.
- `src/lib/wordpress/media.ts` - Functions for media upload, metadata retrieval.
- `src/lib/wordpress/posts.ts` - Functions for post fetching and updating (rewrites, featured images).
- `src/lib/image/processor.ts` - Sharp-based conversion pipeline (WebP/AVIF, downscale, ICC logic).
- `src/lib/image/hash.ts` - SHA-256 / dedupe helpers.
- `src/lib/image/quality-profile.ts` - Logic deciding quality (photographic vs small graphics heuristic).
- `src/lib/inventory/discover.ts` - Crawl posts, extract image URLs/IDs, build inventory.
- `src/lib/inventory/dedupe.ts` - Hash-based deduplication and status initialization.
- `src/lib/queue/index.ts` - In-memory + adaptive concurrency queue driver.
- `src/lib/queue/adaptive.ts` - Error rate tracking and scaling logic.
- `src/lib/db/index.ts` - Supabase/Postgres connection and query helpers.
- `src/lib/db/schema.sql` - DDL for tables.
- `supabase/migrations/*.sql` - Versioned migrations.
- `src/lib/logging/logger.ts` - Structured logging (JSON), redaction.
- `src/lib/verification/sampler.ts` - Post-migration URL sampler & HTTP 200 checker.
- `src/lib/reporting/dry-run.ts` - Estimation logic for pre-optimization savings.
- `src/lib/reporting/final-summary.ts` - Aggregates processing outcomes.
- `src/lib/rollback/restore.ts` - Rollback script logic.
- `src/lib/rollback/preview.ts` - Preview rollback impact.
- `src/lib/filters/scope.ts` - Author/date filtering.
- `src/server/routes/*.ts` - Minimal backend API endpoints (status, trigger dry-run, trigger optimize, export mapping).
- `src/server/middleware/auth.ts` - Auth guard for internal API endpoints.
- `dashboard/app/(pages)/layout.tsx` - Dashboard layout.
- `dashboard/app/(pages)/index/page.tsx` - Main progress view.
- `dashboard/app/(pages)/dry-run/page.tsx` - Dry-run report page.
- `dashboard/app/(pages)/image/[id]/page.tsx` - Image detail view.
- `dashboard/app/(pages)/settings/page.tsx` - Configuration & scheduling UI.
- `dashboard/components/ProgressCards.tsx` - Summary metrics component.
- `dashboard/components/FilterBar.tsx` - Author/date & status filters.
- `dashboard/components/ImageTable.tsx` - Paginated table.
- `dashboard/components/QualityLegend.tsx` - Explains quality profiles.
- `dashboard/lib/api.ts` - Client fetch wrappers.
- `tests/unit/image/processor.test.ts` - Unit tests for image pipeline.
- `tests/unit/inventory/discover.test.ts` - Inventory discovery tests.
- `tests/unit/queue/adaptive.test.ts` - Adaptive concurrency logic tests.
- `tests/unit/rollback/restore.test.ts` - Rollback script tests.
- `tests/integration/full-run.sample.test.ts` - Orchestrated small end-to-end run.

### Notes

- Unit tests live in `tests/` grouped by domain; co-location acceptable for small helpers.
- Environment variables loaded via `dotenv`/process env in `src/config/index.ts`.
- Use `npx jest` for test execution; add coverage later.
- Minimal Next.js + server API separation to keep worker concerns isolated.

## Tasks

- [ ] 1.0 Architecture & Environment Setup
  - [ ] 1.1 Initialize repository structure (src/, dashboard/, tests/, supabase/)
  - [x] 1.2 Create `package.json` with scripts (dev, build, test, lint, typecheck)
  - [x] 1.3 Add TypeScript config (root + dashboard tsconfigs)
  - [x] 1.4 Add base ESLint + Prettier configuration
  - [x] 1.5 Create `.env.example` with all required variables (WP creds, SUPABASE, quality, schedule)
  - [x] 1.6 Implement configuration loader with schema validation (e.g., Zod)
  - [ ] 1.7 Document setup steps in `README.md`
  - [x] 1.8 Add Git hooks / lint-staged (optional) for formatting enforcement

- [ ] 2.0 Data Layer & Supabase Schema Implementation
  - [x] 2.1 Draft SQL migrations for `media_inventory`, `media_optimization`, `post_rewrites`, `config`
  - [x] 2.2 Add indices (hash, status, author/date composite for filtering performance)
  - [ ] 2.3 Implement DB client wrapper with typed queries
  - [ ] 2.4 Implement repository functions (CRUD for inventory, optimization updates)
  - [ ] 2.5 Seed dev database with sample records for local testing
  - [ ] 2.6 Add unit tests for DB layer (using test transaction + rollback)

- [ ] 3.0 Media Inventory & Dry-Run Reporting Pipeline
  - [ ] 3.1 Implement WordPress post fetch (pagination, published only)
  - [ ] 3.2 Extract image references from post content (HTML parse) & featured images
  - [ ] 3.3 Resolve attachment IDs & metadata for each URL
  - [ ] 3.4 Compute SHA-256 hash (download stream or HEAD + conditional full fetch)
  - [ ] 3.5 Apply author/date filters (FR-41) pre-queue population
  - [ ] 3.6 Deduplicate by hash & persist inventory with initial status=PENDING
  - [ ] 3.7 Implement dry-run estimator (expected WebP size heuristics)
  - [ ] 3.8 Aggregate dry-run totals & store snapshot
  - [ ] 3.9 Expose API endpoint for dry-run trigger & retrieval
  - [ ] 3.10 Add tests for inventory + dry-run logic

- [ ] 4.0 Optimization & Conversion Engine (WebP + AVIF Flag)
  - [ ] 4.1 Implement Sharp-based conversion (downscale >2560px, size-only small graphics quality=85 else 75)
  - [ ] 4.2 Preserve / strip ICC per policy (≤2KB preserved)
  - [ ] 4.3 Implement AVIF optional generation (flag check)
  - [ ] 4.4 Filename generation `<basename>__opt.webp` + collision handling
  - [ ] 4.5 Upload optimized image via WordPress media endpoint
  - [ ] 4.6 Persist optimization record & byte savings
  - [ ] 4.7 Mark inventory status=OPTIMIZED or SKIPPED with reason
  - [ ] 4.8 Error handling + retry (transient classification)
  - [ ] 4.9 Unit tests for processor & collision logic

- [ ] 5.0 Post Rewrite & Rollback Mechanisms
  - [ ] 5.1 Implement content replacement (regex/DOM safe parse) for image src/srcset
  - [ ] 5.2 Update featured_media when applicable
  - [ ] 5.3 Store rewrite audit records (post_rewrites)
  - [ ] 5.4 Implement rollback preview (diff of replacements)
  - [ ] 5.5 Implement rollback execution script using mapping
  - [ ] 5.6 Tests for rewrite & rollback correctness

- [ ] 6.0 Dashboard (Next.js) & API Integration
  - [ ] 6.1 Scaffold Next.js app structure with protected routes
  - [ ] 6.2 Implement auth guard (Supabase session / server component check)
  - [ ] 6.3 Build progress cards (counts, bytes saved, % complete)
  - [ ] 6.4 Implement filter bar (author/date, status)
  - [ ] 6.5 Implement image table (pagination, sorting, status badges)
  - [ ] 6.6 Dry-run report page (charts + export buttons CSV/JSON)
  - [ ] 6.7 Image detail page (original vs optimized metadata & bytes)
  - [ ] 6.8 Settings page (toggle AVIF, schedule window, concurrency cap)
  - [ ] 6.9 API client wrappers with error normalization
  - [ ] 6.10 Basic accessibility & responsive checks

- [ ] 7.0 Concurrency, Scheduling & Adaptive Controls
  - [ ] 7.1 Implement adaptive scaling metric collector (success/error ring buffer)
  - [ ] 7.2 Scale up logic (<1% errors) & revert logic (>3% transient errors)
  - [ ] 7.3 Scheduling window evaluator (site timezone) gating job start
  - [ ] 7.4 Configuration overrides to disable adaptive behavior
  - [ ] 7.5 Tests covering scaling edge cases & pause/resume

- [ ] 8.0 Logging, Monitoring & Verification (Sampling + Reports)
  - [ ] 8.1 Structured logger with redaction (credentials, tokens)
  - [ ] 8.2 Sampling verification (5% or ≤250 threshold) HTTP checks
  - [ ] 8.3 Final summary report aggregator (optimized, skipped by reason, failures)
  - [ ] 8.4 Export mapping & summary endpoints
  - [ ] 8.5 Dashboard surfacing of verification results
  - [ ] 8.6 Tests for sampler and summary logic

- [ ] 9.0 Security, Configuration & Secrets Management
  - [ ] 9.1 Implement secret loading (no exposure on client)
  - [ ] 9.2 Ensure WP credentials only used server-side
  - [ ] 9.3 Role-based dashboard access (admin group check)
  - [ ] 9.4 Redaction middleware for logs
  - [ ] 9.5 Config validation tests (invalid env scenarios)

- [ ] 10.0 QA, Validation & Launch Readiness
  - [ ] 10.1 Seed staging environment & perform full dry-run
  - [ ] 10.2 Execute limited-scope (one author/date slice) optimization test
  - [ ] 10.3 Perform rollback simulation & verify integrity
  - [ ] 10.4 Load/performance spot test (concurrency=3→5 ramp)
  - [ ] 10.5 Security review (secrets, logs, access)
  - [ ] 10.6 Documentation: operations guide + rollback guide
  - [ ] 10.7 Final acceptance checklist (FR traceability matrix)
  - [ ] 10.8 Post-launch monitoring plan (24h heightened watch)

```

```
