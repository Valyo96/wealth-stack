#!/usr/bin/env bash
# Generate Android JaCoCo coverage for SonarCloud.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="${REPO_ROOT}/android"
REPORT_DIR="${REPO_ROOT}/reports/coverage/android"
GRADLE="${ANDROID_DIR}/gradlew"

mkdir -p "${REPORT_DIR}"

if [[ ! -f "${GRADLE}" ]]; then
  echo "Missing Gradle wrapper at ${GRADLE}" >&2
  exit 1
fi

chmod +x "${GRADLE}"

cd "${ANDROID_DIR}"
"${GRADLE}" testDebugUnitTest jacocoTestReport --no-daemon

JACOCO_XML="${ANDROID_DIR}/app/build/reports/jacoco/jacocoTestReport/jacocoTestReport.xml"
if [[ ! -f "${JACOCO_XML}" ]]; then
  echo "Missing JaCoCo report at ${JACOCO_XML}" >&2
  exit 1
fi

cp "${JACOCO_XML}" "${REPORT_DIR}/jacocoTestReport.xml"
echo "Android JaCoCo report written to ${REPORT_DIR}/jacocoTestReport.xml"
