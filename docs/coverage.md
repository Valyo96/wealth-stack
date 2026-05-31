# Test coverage for SonarCloud

SonarCloud **does not run tests or compute coverage**. Each stack must generate a report that Sonar imports.

## Important: JaCoCo is JVM-only

**JaCoCo** instruments JVM bytecode. It works for **Android (Kotlin)** but **cannot** instrument:

- **Backend (Go)** — compiled to native Go binaries, not JVM bytecode
- **Frontend (TypeScript)** — runs in Node/V8, not the JVM

SonarCloud requires the **language-specific importer** for each stack. This repo generates all three using a unified layout under `reports/coverage/`.

## Report layout

```
reports/coverage/
  backend/
    coverage.out      ← Sonar import (Go native)
    cobertura.xml     ← XML artifact (local/CI tooling)
  web/
    lcov.info         ← Sonar import (Vitest/V8)
    cobertura-coverage.xml
  android/
    jacocoTestReport.xml  ← Sonar import (JaCoCo)
```

## Generate locally

```bash
# All stacks
bash scripts/generate-all-coverage.sh

# Or individually
bash scripts/generate-backend-coverage.sh
bash scripts/generate-frontend-coverage.sh
bash scripts/generate-android-coverage.sh
```

Windows (Git Bash or WSL):

```powershell
bash scripts/generate-all-coverage.sh
```

## Sonar property mapping

| Stack | Generator | Sonar property |
|-------|-----------|----------------|
| Backend | `go test -coverprofile` | `sonar.go.coverage.reportPaths` |
| Frontend | Vitest lcov | `sonar.javascript.lcov.reportPaths` |
| Android | Gradle JaCoCo | `sonar.coverage.jacoco.xmlReportPaths` |

See [`sonar-project.properties`](../sonar-project.properties) for exclusions (config, DTOs, generated code).
