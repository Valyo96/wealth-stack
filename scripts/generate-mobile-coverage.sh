#!/usr/bin/env bash
# Generate mobile Jest LCOV coverage for SonarCloud.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${REPO_ROOT}/reports/coverage/mobile"

mkdir -p "${REPORT_DIR}"

cd "${REPO_ROOT}"
npm run build -w @wealth-stack/shared
cd "${REPO_ROOT}/mobile"
npm run coverage:sonar
cp coverage/lcov.info "${REPORT_DIR}/lcov.info"
echo "Mobile coverage report written to ${REPORT_DIR}/lcov.info"
