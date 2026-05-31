# Start the full stack: Postgres, migrations, API, and web UI.
# Usage: .\scripts\start-stack.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "deploy\docker-compose.yml"

Write-Host "Building and starting full stack..."
Write-Host "  API: http://localhost:8080"
Write-Host "  Web: http://localhost:5173"
docker compose -f $ComposeFile up --build
