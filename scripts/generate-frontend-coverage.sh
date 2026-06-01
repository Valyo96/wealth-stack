#!/usr/bin/env bash
# Generate frontend coverage for SonarCloud (lcov + Cobertura XML).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${REPO_ROOT}/reports/coverage/web"

mkdir -p "${REPORT_DIR}"

cd "${REPO_ROOT}"
npm ci
npm run build -w @wealth-stack/shared

cd "${REPO_ROOT}/web"
npm run coverage:sonar

if [[ ! -f "${REPORT_DIR}/lcov.info" ]]; then
  echo "Missing ${REPORT_DIR}/lcov.info" >&2
  exit 1
fi

echo "Frontend coverage reports written to ${REPORT_DIR}"
