# Task List Management

Guidelines for managing task lists in markdown files to track progress on completing a PRD

## Task Implementation

- **One sub-task at a time:** Do **NOT** start the next sub‑task until you ask the user for permission and they say "yes" or "y"
- **Completion protocol:**
  1. When you finish a **sub‑task**, immediately mark it as completed by changing `[ ]` to `[x]`.
  2. If **all** subtasks underneath a parent task are now `[x]`, follow this sequence:
  - **First**: Run the full test suite (`pytest`, `npm test`, `bin/rails test`, etc.)
  - **Only if all tests pass**: Stage changes (`git add .`)
  - **Clean up**: Remove any temporary files and temporary code before committing
  - **Commit**: Use a descriptive commit message that:
    - Uses conventional commit format (`feat:`, `fix:`, `refactor:`, etc.)
    - Summarizes what was accomplished in the parent task
    - Lists key changes and additions
    - References the task number and PRD context
    - **Formats the message as a single-line command using `-m` flags**, e.g.:

      ```
      git commit -m "feat: add payment validation logic" -m "- Validates card type and expiry" -m "- Adds unit tests for edge cases" -m "Related to T123 in PRD"
      ```
  3. Once all the subtasks are marked completed and changes have been committed, mark the **parent task** as completed.

- Stop after each sub‑task and wait for the user's go‑ahead.

## Task List Maintenance

1. **Update the task list as you work:**
   - Mark tasks and subtasks as completed (`[x]`) per the protocol above.
   - Add new tasks as they emerge.

2. **Maintain the "Relevant Files" section:**
   - List every file created or modified.
   - Give each file a one‑line description of its purpose.

## AI Instructions

When working with task lists, the AI must:

1. Regularly update the task list file after finishing any significant work.
2. Follow the completion protocol:
   - Mark each finished **sub‑task** `[x]`.
   - Mark the **parent task** `[x]` once **all** its subtasks are `[x]`.
3. Add newly discovered tasks.
4. Keep "Relevant Files" accurate and up to date.
5. Before starting work, check which sub‑task is next.
6. After implementing a sub‑task, update the file and then pause for user approval.

## Recent QA status (10.0 series)

Note: per the PRD runbook, QA subtasks 10.1–10.4 must be tracked and only marked complete after their tests pass and artifacts are produced.

- 10.1 Seed staging environment & perform full dry-run: PENDING
   - Reason: `artifacts/dry-run.json` exists but is empty (no images). Staging seed must be confirmed and dry-run re-run to populate results.
- 10.2 Execute limited-scope optimization test: DONE
   - Evidence: `tests/integration/limited-optimize.test.ts` executed successfully; artifact: `tests/artifacts/limited-optimize.json` (may be empty if no pending items).
- 10.3 Perform rollback simulation & verify integrity: DONE
   - Evidence: `tests/integration/rollback-simulate.test.ts` executed; artifact: `tests/artifacts/rollback-preview.json`.
- 10.4 Load/performance spot test (concurrency=3→5 ramp): DONE
   - Evidence: `tests/integration/load-spot.test.ts` executed; artifact: `tests/artifacts/load-spot.json` (contains throughput/latency/metrics).

Follow-up: once 10.1 is validated with a populated `artifacts/dry-run.json`, mark 10.1 as complete and then proceed to 10.5.

## 10.5 / 10.6 Next steps and artifacts

To complete 10.5 (Security review):
- Run through `docs/security-review.md` and check each item.
- Produce a short summary in this doc with any remediation steps and `npm audit` output.
- Required artifacts: `docs/security-review.md` updated, `npm audit` or SCA report attached.

Status: `npm audit --audit-level=high` was executed. Results: 2 moderate vulnerabilities (lint-staged -> micromatch ReDoS). No high or critical vulnerabilities found. Recommendation: upgrade `lint-staged`/`micromatch` to patched versions or run `npm audit fix` where safe, then re-run tests and update `docs/security-review.md` with remediation notes.

To complete 10.6 (Operations & rollback guide):
- Review and, if needed, adapt `docs/operations-rollback-guide.md` to your production ops processes.
- Ensure `artifacts/dry-run.json` is populated and `tests/artifacts/rollback-preview.json` exists from staging.
- Required artifacts: updated `docs/operations-rollback-guide.md`, populated `artifacts/dry-run.json`.

When both documents are updated and artifacts exist, mark 10.5 and 10.6 as done in the PRD tasks file and commit per the completion protocol.
