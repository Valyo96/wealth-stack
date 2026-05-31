#!/usr/bin/env bash
# Generate backend coverage for SonarCloud (Go native format + Cobertura XML).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
REPORT_DIR="${REPO_ROOT}/reports/coverage/backend"

mkdir -p "${REPORT_DIR}"

cd "${BACKEND_DIR}"
PACKAGES="$(go list ./... | grep -v /integration)"
go test ${PACKAGES} -coverprofile=coverage.out -covermode=atomic -coverpkg=./...

cp coverage.out "${REPORT_DIR}/coverage.out"

if command -v gocover-cobertura >/dev/null 2>&1; then
  gocover-cobertura -coverprofile=coverage.out > "${REPORT_DIR}/cobertura.xml"
else
  go install github.com/boumenot/gocover-cobertura/v2@latest
  "$(go env GOPATH)/bin/gocover-cobertura" -coverprofile=coverage.out > "${REPORT_DIR}/cobertura.xml"
fi

echo "Backend coverage reports written to ${REPORT_DIR}"
