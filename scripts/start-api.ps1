# Build and start the API via Docker (no local Go install required).
# Usage: .\scripts\start-api.ps1

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

Write-Host "Building and starting API + web..."
Write-Host "  API: http://localhost:8080"
Write-Host "  Web: http://localhost:5173"
docker compose -f $ComposeFile up --build api web
