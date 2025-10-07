# Operations & Rollback Guide

Purpose
- Provide concise runbook steps for operators to perform dry-run review, staged optimization, and rollback.

Pre-Operations Checklist
- Ensure a current `artifacts/dry-run.json` exists and has been reviewed.
- Confirm backups for WordPress database and uploads are available (or ensure offload snapshots exist).
- Ensure an operator with `admin` role is available to approve ramp-ups and rollbacks.

Staged Optimization Run (recommended)
1. Seed staging data and run `discoverAndDryRun` to validate expected savings.
2. Execute limited-scope optimize for a single author/date slice and verify optimizations in `tests/artifacts/limited-optimize.json`.
3. Review verification sampler results and final summary for correctness.
4. If results pass, schedule a production run during allowed schedule window and start with concurrency=3.

Rollback Procedure
1. Run the preview: use `previewRewrites` (or tests/integration/rollback-simulate.test.ts) to verify affected posts and the mapping file `tests/artifacts/rollback-preview.json`.
2. If rollback is required, run `restoreHtmlFromMapping(mappingId)` (or equivalent script) against posts in a small batch.
3. Verify restored posts via sampler or spot checks.

Post-Operation Monitoring
- Monitor error rates and verifier results for 24 hours.
- If errors exceed thresholds (transient >3% or fatal >1%), revert concurrency to base and pause further runs.

Artifacts to include when marking 10.6 done
- Updated `artifacts/dry-run.json` (populated) and review notes.
- Confirmation that rollback script was exercised in staging (artifact `tests/artifacts/rollback-preview.json`).
