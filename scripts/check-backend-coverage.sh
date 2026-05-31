#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
COVERAGE_ARG="${1:-reports/coverage/backend/coverage.out}"

if [[ "${COVERAGE_ARG}" = /* ]]; then
  COVERAGE_FILE="${COVERAGE_ARG}"
else
  COVERAGE_FILE="${REPO_ROOT}/${COVERAGE_ARG}"
fi

MIN_COVERAGE="${MIN_BACKEND_COVERAGE:-1.0}"

if [[ ! -f "${COVERAGE_FILE}" ]]; then
  echo "Coverage file not found: ${COVERAGE_FILE}" >&2
  exit 1
fi

# go tool cover resolves module paths; run from the Go module root.
TOTAL="$(
  cd "${BACKEND_DIR}"
  go tool cover -func="${COVERAGE_FILE}" | awk '/^total:/ {gsub(/%/,"",$3); print $3}'
)"
echo "Backend total coverage: ${TOTAL}% (minimum ${MIN_COVERAGE}%)"

awk -v total="${TOTAL}" -v min="${MIN_COVERAGE}" 'BEGIN {
  if (total + 0 < min + 0) {
    printf("Backend coverage %.2f%% is below minimum %.2f%%\n", total, min) > "/dev/stderr"
    exit 1
  }
}'
