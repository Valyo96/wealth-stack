# Install dependencies (first time) and start the web dev server.
# Usage: .\scripts\start-web.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$WebDir = Join-Path $Root "web"

Set-Location $WebDir

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..."
    npm install
}

Write-Host "Starting web app at http://localhost:5173"
Write-Host "Ensure the API is running at http://localhost:8080"
npm run dev
