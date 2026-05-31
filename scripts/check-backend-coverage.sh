#!/usr/bin/env bash
set -euo pipefail

COVERAGE_FILE="${1:-backend/coverage.out}"
MIN_COVERAGE="${MIN_BACKEND_COVERAGE:-1.0}"

if [[ ! -f "$COVERAGE_FILE" ]]; then
  echo "Coverage file not found: $COVERAGE_FILE" >&2
  exit 1
fi

TOTAL="$(go tool cover -func="$COVERAGE_FILE" | awk '/^total:/ {gsub(/%/,"",$3); print $3}')"
echo "Backend total coverage: ${TOTAL}% (minimum ${MIN_COVERAGE}%)"

awk -v total="$TOTAL" -v min="$MIN_COVERAGE" 'BEGIN {
  if (total + 0 < min + 0) {
    printf("Backend coverage %.2f%% is below minimum %.2f%%\n", total, min) > "/dev/stderr"
    exit 1
  }
}'
