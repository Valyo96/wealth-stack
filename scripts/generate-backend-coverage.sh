#!/usr/bin/env bash
# Generate backend coverage for SonarCloud (Go native coverprofile).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="${REPO_ROOT}/backend"
REPORT_DIR="${REPO_ROOT}/reports/coverage/backend"

mkdir -p "${REPORT_DIR}"

cd "${BACKEND_DIR}"

TEST_PACKAGES=""
while IFS= read -r pkg; do
  dir="$(go list -f '{{.Dir}}' "${pkg}")"
  if compgen -G "${dir}/*_test.go" > /dev/null; then
    TEST_PACKAGES="${TEST_PACKAGES} ${pkg}"
  fi
done < <(go list ./... | grep -v /integration)

# Only run packages that contain tests; empty packages corrupt merged cover profiles.
go test ${TEST_PACKAGES} -coverprofile=coverage.out -covermode=atomic -coverpkg=./...

cp coverage.out "${REPORT_DIR}/coverage.out"
echo "Backend coverage report written to ${REPORT_DIR}/coverage.out"
