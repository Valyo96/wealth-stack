# Apply local-only demo seed (admin@nowhere.com / password123).
# Not run by docker compose up — invoke explicitly for local dev.
# Usage: .\scripts\seed-demo.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "deploy\docker-compose.yml"

Write-Host "Ensuring Postgres is running..."
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

Write-Host "Applying schema migrations..."
docker compose -f $ComposeFile run --rm migrate

Write-Host "Applying local seed migrations..."
docker compose -f $ComposeFile run --rm migrate-local

Write-Host ""
Write-Host "Demo user ready:"
Write-Host "  Email:    admin@nowhere.com"
Write-Host "  Password: password123"
Write-Host ""
Write-Host "Log out of the web app and sign in again to use the seeded data."
