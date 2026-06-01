# Start the Expo mobile dev server (Metro on port 8082).
# Prerequisite: Docker stack running (API on http://localhost:8080).
# Usage: .\scripts\start-mobile.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$lanIp = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.IPAddress -notmatch '^127\.' -and
    $_.IPAddress -notmatch '^169\.254\.' -and
    $_.InterfaceAlias -notmatch 'vEthernet|WSL|Loopback|Virtual'
  } |
  Select-Object -First 1 -ExpandProperty IPAddress
)

if (-not (Test-Path "mobile\.env")) {
  Copy-Item "mobile\.env.example" "mobile\.env"
  Write-Host "Created mobile\.env from .env.example - edit EXPO_PUBLIC_API_BASE_URL for your setup."
}

$envContent = Get-Content "mobile\.env" -Raw -ErrorAction SilentlyContinue
if ($envContent -match '10\.0\.2\.2' -and $lanIp) {
  Write-Host ""
  Write-Host "NOTE: mobile/.env uses 10.0.2.2 (Android emulator only)." -ForegroundColor Yellow
  Write-Host "  For a physical phone, set:" -ForegroundColor Yellow
  Write-Host "  EXPO_PUBLIC_API_BASE_URL=http://${lanIp}:8080" -ForegroundColor Yellow
  Write-Host "  Then restart Expo (stop Metro and run this script again)." -ForegroundColor Yellow
  Write-Host ""
}

Write-Host "Installing dependencies and building shared package..."
npm install
npm run build -w @wealth-stack/shared

Write-Host ""
Write-Host "Starting Expo (Metro) on http://localhost:8082"
Write-Host "  API must be running: http://localhost:8080 (docker compose up)"
Write-Host "  Press a for Android emulator, scan QR for Expo Go, or i for iOS (Mac)"
Write-Host "  Do not press w - web is not configured for this app"
Write-Host ""

npm run start -w wealth-stack-mobile
