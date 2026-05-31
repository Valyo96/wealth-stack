# Run backend unit tests (works even when 'go' is not on IDE terminal PATH).
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path $PSScriptRoot -Parent
. (Join-Path $PSScriptRoot "ensure-go.ps1")

Push-Location (Join-Path $repoRoot "backend")
try {
    go test ./...
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "`nBackend unit tests passed." -ForegroundColor Green
} finally {
    Pop-Location
}
