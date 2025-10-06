#!/usr/bin/env bash
# Interactive script to commit and push the initial files for MediaRefinery.
# It does NOT run automatically — you must review and approve each step.

set -euo pipefail
IFS=$'\n\t'

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

BRANCH=${1:-feat/docs-and-codeowners}
COMMIT_MSG_TITLE=${2:-"chore: add README and CODEOWNERS"}

echo "[mediarefinery] Working in: $REPO_ROOT"

# Ensure working tree clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: Your working tree is not clean. Please commit or stash changes first." >&2
  git status --porcelain
  exit 1
fi

echo "Creating branch: $BRANCH"
git checkout -b "$BRANCH"

read -r -p "Run tests (if available) before committing? [Y/n] " run_tests
run_tests=${run_tests:-Y}
if [[ "$run_tests" =~ ^(Y|y|YES|yes|) ]]; then
  if command -v npx >/dev/null 2>&1; then
    echo "Running npx jest (may fail if tests not present)..."
    npx jest || echo "jest exited non-zero — continue? (you can inspect failures)"
  else
    echo "npx not found; skipping jest. Run tests manually if needed."
  fi
fi

# Files to add (edit this list if you have additional files)
FILES=(README.md .github/CODEOWNERS tasks/tasks-0001-prd-media-refinery.md tasks/0001-prd-media-refinery.md)

echo "About to stage files:"
for f in "${FILES[@]}"; do
  echo "  - $f"
done

read -r -p "Stage and commit these files? [y/N] " confirm
if [[ ! "$confirm" =~ ^(y|Y)$ ]]; then
  echo "Aborted by user. No changes staged."
  exit 0
fi

git add "${FILES[@]}"

git commit -m "$COMMIT_MSG_TITLE" \
  -m "- Adds README.md with quickstart, env vars, and next steps" \
  -m "- Adds .github/CODEOWNERS mapping (@excelle @BCAndrei)" \
  -m "Related to PRD: 0001 MediaRefinery"

echo "Commit created on branch $BRANCH."

read -r -p "Push branch to origin and create PR? (push only if 'y') [y/N] " push_and_pr
if [[ "$push_and_pr" =~ ^(y|Y)$ ]]; then
  echo "Pushing branch to origin..."
  git push -u origin "$BRANCH"

  if command -v gh >/dev/null 2>&1; then
    echo "Creating PR with gh CLI"
    gh pr create --title "$COMMIT_MSG_TITLE" \
      --body "Adds initial README and CODEOWNERS. See PRD 0001 for context." \
      --reviewer excelle --reviewer BCAndrei --base main --head "$BRANCH" || echo "gh pr create failed; create the PR manually on GitHub." 
  else
    echo "gh CLI not found — branch pushed. Create a PR at: https://github.com/mediarefinery/mediarefinery/pull/new/$BRANCH"
  fi
else
  echo "Branch committed locally. You can push later with: git push -u origin $BRANCH"
fi

echo "Done."
