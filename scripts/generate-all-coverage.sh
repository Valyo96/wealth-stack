#!/usr/bin/env bash
# Generate all stack coverage reports for SonarCloud.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

bash "${REPO_ROOT}/scripts/generate-backend-coverage.sh"
bash "${REPO_ROOT}/scripts/generate-frontend-coverage.sh"
bash "${REPO_ROOT}/scripts/generate-mobile-coverage.sh"

echo "All Sonar coverage reports are under ${REPO_ROOT}/reports/coverage/"
