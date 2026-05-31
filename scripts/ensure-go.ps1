# Ensures Go is on PATH for the current PowerShell session.
# IntelliJ (and other IDEs) often keep an old PATH until the IDE is fully restarted.

$goBin = "C:\Program Files\Go\bin"
$goExe = Join-Path $goBin "go.exe"

if (-not (Test-Path $goExe)) {
    Write-Error "Go not found at $goExe. Install from https://go.dev/dl/ and reopen your IDE."
    exit 1
}

if ($env:Path -notlike "*$goBin*") {
    $env:Path = "$env:Path;$goBin"
}

Write-Host "Go: $(& $goExe version)"
