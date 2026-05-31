# Run database migrations via Docker (no local migrate CLI required).
# Usage: .\scripts\migrate-up.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "deploy\docker-compose.yml"

Write-Host "Starting Postgres (if not running)..."
docker compose -f $ComposeFile up -d postgres

Write-Host "Waiting for Postgres to be healthy..."
$retries = 30
while ($retries -gt 0) {
    $status = docker inspect --format='{{.State.Health.Status}}' wealthstack-postgres 2>$null
    if ($status -eq "healthy") { break }
    Start-Sleep -Seconds 1
    $retries--
}
if ($retries -eq 0) {
    Write-Error "Postgres did not become healthy in time."
}

Write-Host "Applying migrations..."
docker compose -f $ComposeFile run --rm migrate
Write-Host "Done."
