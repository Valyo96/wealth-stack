# Run backend integration tests (requires Docker Desktop).
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot "ensure-go.ps1")

Push-Location (Join-Path $repoRoot "backend")
try {
    go test -tags=integration ./internal/integration/... -v -timeout 5m
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "`nBackend integration tests passed." -ForegroundColor Green
} finally {
    Pop-Location
}
