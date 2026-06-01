#!/usr/bin/env bash
# Generate shared package Jest LCOV coverage for SonarCloud.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_DIR="${REPO_ROOT}/reports/coverage/shared"

mkdir -p "${REPORT_DIR}"

cd "${REPO_ROOT}"
npm run coverage:sonar -w @wealth-stack/shared
cp packages/shared/coverage/lcov.info "${REPORT_DIR}/lcov.info"
echo "Shared coverage report written to ${REPORT_DIR}/lcov.info"
