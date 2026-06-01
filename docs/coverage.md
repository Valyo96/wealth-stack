# Coverage & SonarCloud

SonarCloud **does not run your tests** — it **imports** coverage reports produced in CI.

## Report paths

| Stack | Generator | Sonar property | Path |
|-------|-----------|----------------|------|
| Backend | `scripts/generate-backend-coverage.sh` | `sonar.go.coverage.reportPaths` | `reports/coverage/backend/coverage.out` |
| Shared | `scripts/generate-shared-coverage.sh` | `sonar.javascript.lcov.reportPaths` | `reports/coverage/shared/lcov.info` |
| Web | `scripts/generate-frontend-coverage.sh` | `sonar.javascript.lcov.reportPaths` | `reports/coverage/web/lcov.info` |
| Mobile | `scripts/generate-mobile-coverage.sh` | `sonar.javascript.lcov.reportPaths` | `reports/coverage/mobile/lcov.info` |

## Local generation

```bash
bash scripts/generate-all-coverage.sh
```

Or per stack:

```bash
bash scripts/generate-backend-coverage.sh
bash scripts/generate-frontend-coverage.sh
bash scripts/generate-mobile-coverage.sh
```

## Notes

- Go and TypeScript cannot use JaCoCo (JVM-only).
- Web and mobile both contribute to `sonar.javascript.lcov.reportPaths` (comma-separated in `sonar-project.properties`).
- Shared package tests run via `npm run test -w @wealth-stack/shared` and are included in Sonar sources under `packages/shared/src`.
