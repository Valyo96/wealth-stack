# Start the full stack: Postgres, migrations, API, and web UI.
# Usage: .\scripts\start-stack.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $Root "deploy\docker-compose.yml"

Write-Host "Building and starting full stack (migrations run automatically)..."
Write-Host "  Postgres + schema migrations + demo seed + API + Web"
Write-Host "  API:  http://localhost:8080"
Write-Host "  Web:  http://localhost:5173"
Write-Host ""
Write-Host "Mobile is separate — in a second terminal run:"
Write-Host "  .\scripts\start-mobile.ps1"
Write-Host "  (Metro on http://localhost:8082)"
Write-Host ""
docker compose -f $ComposeFile up --build
