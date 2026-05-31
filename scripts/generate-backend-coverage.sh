#!/usr/bin/env bash
# Generate backend coverage for SonarCloud (Go native coverprofile).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
REPORT_DIR="${REPO_ROOT}/reports/coverage/backend"

mkdir -p "${REPORT_DIR}"

cd "${BACKEND_DIR}"
PACKAGES="$(go list ./... | grep -v /integration)"
go test ${PACKAGES} -coverprofile=coverage.out -covermode=atomic -coverpkg=./...

cp coverage.out "${REPORT_DIR}/coverage.out"
echo "Backend coverage report written to ${REPORT_DIR}/coverage.out"
