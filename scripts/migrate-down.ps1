# Roll back the last migration via Docker.
# Usage: .\scripts\migrate-down.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "deploy\docker-compose.yml"

Write-Host "Rolling back one migration..."
docker compose -f $ComposeFile run --rm migrate `
  -path /migrations `
  -database "postgres://wealthstack:wealthstack@postgres:5432/wealthstack?sslmode=disable" `
  down 1
Write-Host "Done."
