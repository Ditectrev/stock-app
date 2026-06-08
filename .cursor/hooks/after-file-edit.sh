#!/usr/bin/env bash
# Formats the edited file and runs vitest related tests.
# Full format:check, lint, and test suite run on agent stop (stop-quality-check.sh).

set -euo pipefail

input=$(cat)
file_path=$(
  printf '%s' "$input" | python3 -c "import sys, json; print(json.load(sys.stdin).get('file_path', ''))"
)

if [[ -z "$file_path" || ! -f "$file_path" ]]; then
  exit 0
fi

case "$file_path" in
  *node_modules/* | */.next/* | */dist/* | */test-results/* | */playwright-report/*)
    exit 0
    ;;
esac

project_root="${CURSOR_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
cd "$project_root"

log() {
  echo "[cursor-hook:afterFileEdit] $*" >&2
}

format_file() {
  case "$file_path" in
    *.ts | *.tsx | *.js | *.jsx | *.json | *.css | *.md | *.mjs | *.cjs | *.yml | *.yaml)
      log "Formatting $file_path"
      bunx prettier --write "$file_path"
      ;;
  esac
}

run_related_tests() {
  case "$file_path" in
    *.ts | *.tsx | *.js | *.jsx)
      log "Running related tests for $file_path"
      if ! bun run test -- related "$file_path" --run; then
        log "Related tests failed for $file_path (see output above)"
      fi
      ;;
  esac
}

format_file
run_related_tests

exit 0
