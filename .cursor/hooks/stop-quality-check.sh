#!/usr/bin/env bash
# Full quality gate when the agent finishes a turn: format check, lint, unit tests.

set -euo pipefail

# Cursor hook processes often inherit a minimal PATH; bun is usually in ~/.bun/bin.
export PATH="${HOME}/.bun/bin:/opt/homebrew/bin:/usr/local/bin:${PATH:-}"

cat >/dev/null

project_root="${CURSOR_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$project_root"

log() {
  echo "[cursor-hook:stop] $*" >&2
}

failures=()

log "Running format:check..."
if ! bun run format:check; then
  failures+=("format:check")
fi

log "Running lint..."
if ! bun run lint; then
  failures+=("lint")
fi

log "Running unit tests..."
if ! bun run test -- --run; then
  failures+=("test")
fi

if ((${#failures[@]} > 0)); then
  log "Quality gate failed: ${failures[*]}"
  # Stop hooks are observational; exit 0 so the session is not blocked.
  exit 0
fi

log "Quality gate passed."
exit 0
