# Product Requirements Document (PRD)

**Feature / Project Name:** MediaRefinery (Historical Media Optimization Pipeline)
**Version:** 1.0 (MVP)
**Date:** 2025-09-05
**Owner:** TBD

---

## 1. Introduction / Overview

The MediaRefinery project provides a batch pipeline to migrate all historical WordPress media assets (images referenced in posts and featured images) to optimized modern formats (WebP initially, with optional AVIF support behind a flag) using a new-filename approach ("Approach B"). This minimizes editorial disruption, avoids CDN purge complexity, and ensures rollback safety.

Problem: Existing legacy JPEG/PNG images inflate page weight, harming Core Web Vitals, SEO, and bandwidth efficiency. Manual re-uploads are impractical at current scale.

Goal: Safely convert and relink all referenced historical images to optimized variants with zero broken images, preserving accessibility metadata and enabling a manual rollback window, with optional phased (author/date-range) rollout and low-traffic execution scheduling.

---

## 2. Goals

1. Provide a dry-run sizing and savings report (aggregate + per-image) before making changes.
2. Convert all referenced non-WebP historical images to WebP using new filenames with a deterministic pattern `<basename>__opt.webp`.
3. Support an optional AVIF generation flag (off by default) for future adoption without blocking MVP.
4. Ensure zero broken image references (sample validation) and preserve alt text, captions, and descriptions.
5. Maintain a reversible mapping (original → optimized) for at least 90 days to allow rollback.
6. Offer a plugin-free (or minimal-bridge) deployment, exposing operational metrics via an external Next.js dashboard backed by Supabase.
7. Avoid modifying or deleting original files during MVP (only mark/record them) until an explicit post-migration confirmation.

---

## 3. User Stories

1. As a **Performance Analyst**, I want a dry-run report showing total potential size reduction so I can justify the migration.
2. As a **Content Editor**, I want assurance that all updated posts still display images so that editorial integrity is maintained.
3. As an **SEO Analyst**, I want no loss of alt text or captions so that accessibility and search relevance are preserved.
4. As a **Project Owner**, I want a reversible mapping so we can roll back if regressions or unforeseen issues arise.
5. As a **Developer**, I want a deterministic filename scheme for optimized images so I can deduplicate and manage cache coherently.
6. As a **Stakeholder**, I want a dashboard summarizing progress (pending, optimized, skipped, failed) to monitor migration status without logging into WordPress admin.
7. As a **Developer**, I want an optional AVIF feature flag to test newer formats without forcing a site-wide change.

---

## 4. Functional Requirements

(Each requirement is mandatory for MVP unless marked OPTIONAL.)

### Discovery & Reporting

FR-1. The system MUST inventory all images referenced in published posts (including featured images) and build a unique image list (deduplicated by hash).
FR-2. The system MUST classify each image with: original URL, attachment ID (if any), file type, byte size, dimensions, first-referenced post ID, and SHA-256 hash.
FR-3. The system MUST produce a dry-run report including: total image count, total bytes, projected bytes after optimization (simulated heuristic), and estimated % savings.
FR-4. The system MUST export the dry-run report as downloadable CSV and JSON via the dashboard.

### Optimization & Conversion

FR-5. The system MUST optimize only non-WebP images (JPEG, PNG) and skip already WebP images with a logged reason "already-webp".
FR-6. The system MUST downscale images wider than a configurable max width (default 2560px) while preserving aspect ratio.
FR-7. The system MUST convert images to WebP with default quality 75 for photographic content and 85 for small graphics (size-only heuristic: <150KB original size). (Color complexity heuristic deferred to later phase.)
FR-8. The system MUST record pre- and post-optimization byte sizes and compute reduction % per image.
FR-9. The system MUST preserve original alt text, caption, and description where the attachment metadata exists.
FR-10. The system MUST generate new filenames using `<basename>__opt.webp` (collision-free; if existing file with same name exists add `-n` increment) while retaining the original base name portion.
FR-11. The system MUST create new WordPress media attachments for each optimized file via REST, letting existing storage offload plugin handle Azure blob replication.
FR-12. The system MUST support an AVIF generation toggle (code path present in MVP; flag OFF by default operationally); when enabled it SHOULD produce an AVIF variant using quality ~48 and store its metadata (even if not yet linked in posts) for future rollout decisions.

### Post Update & Integrity

FR-13. The system MUST rewrite post content to replace old image `src` (and `srcset` occurrences where needed) with the new WebP URL.
FR-14. The system MUST update `featured_media` for posts whose featured image was optimized, linking to the new attachment ID.
FR-15. The system MUST avoid altering other media references (videos, PDFs, non-image attachments) and log them as "non-image-skip".
FR-16. The system MUST ensure that if an error occurs during a batch, partially updated posts are flagged for retry.

### Mapping & Rollback

FR-17. The system MUST store a mapping: original_attachment_id → optimized_attachment_id, original_url → new_url, original_hash, optimized_hash, timestamp.
FR-18. The system MUST allow export of the mapping for rollback scripting.
FR-19. The system MUST support a rollback script that restores original URLs in posts (inline content and featured images) using the mapping without deleting optimized attachments.
FR-20. The system MUST retain mapping & logs for at least 90 days (configurable) before eligible for pruning.

### Dashboard & Interfaces

FR-21. The system MUST provide an external dashboard (Next.js) accessing Supabase to show: total images, processed, skipped, failed, cumulative bytes saved, progress %.
FR-22. The dashboard MUST expose filters (status: pending, optimized, skipped, failed) and a detail view for a single image’s metrics.
FR-23. The dashboard MUST provide a dry-run vs actual results comparison view.
FR-24. The dashboard MUST require authenticated access (Supabase Auth or protected route) and MUST NOT expose WordPress credentials to the browser.
FR-25. The system SHOULD expose a minimal health/status read endpoint (secured) to facilitate uptime probes.

### Logging & Error Handling

FR-26. The system MUST log: start/end timestamps, error category, retry count, and final status per image.
FR-27. The system MUST implement a retry policy (default 3 attempts for transient network 5xx or timeout errors) with exponential backoff.
FR-28. The system MUST categorize skip reasons (already-webp, non-image, size-below-threshold, convert-failure, other) for reporting.

### Edge Case Handling

FR-29. The system MUST skip non-image attachments gracefully (no failure state) and log skip reason.
FR-30. The system MUST downscale large images >10MB or >2560px (whichever condition triggers first) before conversion.
FR-31. The system MUST detect already WebP originals and mark as skip.
FR-32. The system MUST NOT attempt to optimize file types outside JPEG/PNG (unless AVIF flag also transforms JPEG into AVIF variant concurrently, still creating WebP primary).

### Security & Access

FR-33. The system MUST store the WordPress Application Password (or future auth token) only in backend environment variables (not client). If Supabase is used, secrets must reside in server-side functions / edge functions only.
FR-34. The system MUST restrict dashboard access to authorized users (role-based: at minimum “admin” group in Supabase).
FR-35. The system SHOULD redact credentials from logs and MUST NOT log full URLs with embedded credentials.

### Performance & Concurrency

FR-36. The system MUST run with a configurable concurrency (default 3 parallel conversions) and MAY adapt up to 5 if rolling 10-minute error rate <1% (adaptive concurrency) unless locked via config. If the rolling 10-minute transient error rate exceeds 3%, the system MUST revert to base concurrency and pause ramp-up behavior until operators acknowledge or error rate drops below threshold.
FR-37. The system SHOULD ensure queue backpressure to prevent overwhelming WordPress or Azure endpoints.
FR-38. The system SHOULD target stable operation over speed (no explicit SLA for completion time in MVP) and SHOULD allow scheduling main processing within a defined low-traffic window.
FR-41. The system MUST allow filtering optimization scope by author IDs and/or published date range prior to queue population (phased rollout support). The dashboard and API MUST expose these filters and the system MUST enforce them during discovery and queue population.

### Validation & Quality

FR-39. The system MUST perform post-rewrite verification (HTTP 200 check on new image URLs) for at least a configurable sample percentage (default 5%).
FR-40. The system MUST produce a final summary report including zero-broken-image validation result.

---

## 5. Non-Goals (Out of Scope for MVP)

1. Automatic deletion or purging of original attachments.
2. Real-time on-upload optimization (handled in a future phase).
3. Automatic `<picture>` element multi-format markup insertion.
4. AI-based alt text generation (Phase 2 enhancement).
5. Automated CDN purge (not required with new filenames strategy).
6. Image sitemap updates or SEO schema modifications.
7. Advanced perceptual quality tuning (Butteraugli/SSIM heuristics) beyond basic quality heuristics.
8. Automated orphan detection & deletion of unused originals (post-migration cleanup is manual evaluation phase).

---

## 6. Design Considerations

- **Filename Pattern:** `<basename>__opt.webp` ensures recognizability and prevents baseline conflict; collision handling with `-1`, `-2` suffix if needed.
- **Dashboard UX:** Emphasize clarity: progress bar, cards for metrics, sortable table with lazy loading. Status color codes (pending-gray, optimized-green, skipped-blue, failed-red).
- **Accessibility:** Ensure alt text transferred; dashboard WCAG AA color contrast; no removal of `alt` attributes.
- **Color Profiles:** Preserve embedded ICC profiles for photographic images when present if the profile adds ≤2KB overhead; otherwise strip to save bytes (aligns with common media outlet practice). Future config toggle may refine.
- **AVIF Flag:** Hidden behind environment variable or config toggle; stored but not referenced in posts (pre-seeding for future `<picture>` rollout).

---

## 7. Technical Considerations

- **Language / Tools:** Node.js + Sharp (libvips) for conversions; Next.js (App Router) for dashboard; Supabase (Postgres + Auth + Storage) for metadata/logs.
- **Auth to WordPress:** REST API + Application Password initially; pluggable to future token mechanism.
- **Data Model (Supabase):**
  - `media_inventory`: id, original_attachment_id, original_url, mime_type, bytes_original, width, height, sha256, first_post_id, status, created_at, updated_at.
  - `media_optimization`: inventory_id (fk), optimized_attachment_id, new_url, bytes_optimized, quality_profile, reduction_pct, avif_generated (bool), retries, error_code, error_message, completed_at.
  - `post_rewrites`: id, post_id, replacements_count, verified (bool), created_at.
  - `config`: key, value (for dynamic thresholds & flags).
- **Queue:** In-memory + persistent status in DB; optional later Redis for scale.
- **Resilience:** Idempotent by hash and existing mapping check before processing.
- **Rollback Script:** Uses mapping to reverse `src` replacements; requires read-only DB access & WP REST writes.

---

## 8. Success Metrics

Primary (Mandatory):

- SM-1: 0 broken image references in sampled verification set (target sample ≥5% or 250 images, whichever smaller).
  Secondary (Reported, Not Acceptance Gating):
- SM-2: Aggregate image byte reduction % (reported; baseline target >30% informational only).
- SM-3: Completion summary with counts: optimized / skipped (already-webp / small / non-image) / failed (<2% fail target, excluding skips).

---

## 9. Open Questions / Follow-ups

All prior open questions resolved via user decisions. Pending clarifications (non-blocking for MVP build):

1. Author/date filter is SHOULD (FR-41) — confirm if escalation to MUST before implementation freeze.
2. Adaptive concurrency: confirm telemetry thresholds (currently error rate <1% over 10 minutes); success metric for ramp-down not yet specified (assume >3% transient errors triggers revert to base concurrency).
3. Scheduling window representation: specify config keys (e.g., `SCHEDULE_START_HHMM`, `SCHEDULE_END_HHMM`, timezone). Default: disabled. The scheduling window SHOULD be interpreted in the site's timezone by default.
4. ICC rule accepted; future toggle naming convention confirmed: `PRESERVE_ICC=auto|always|never`.
5. AVIF artifacts storage path naming convention confirmed: append `__opt.avif` symmetrical to the WebP naming pattern.

---

## 10. Appendix: Name & Future Roadmap

**Chosen Name:** MediaRefinery (MVP)  
**Alternates (internal use):** MediaRefinery Pipeline, MediaRefinery Core  
**Phase 2 Candidates:**

- AI alt text generation & enrichment pipeline.
- Automatic orphan detection & safe purge workflow.
- `<picture>` multi-format rollout (WebP+AVIF) with analytics toggle.
- Perceptual adaptive quality (SSIM / structural metrics for dynamic quality tuning).
- Real-time hook for on-upload optimization.
- Grafana/Prometheus metrics exporter (processing latency, queue depth).
- Formal phased rollout UI controls if not fully implemented in MVP.

---

**End of Document**
