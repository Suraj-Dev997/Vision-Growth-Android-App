# Build/install on a connected Android device with short Gradle cache (fixes Windows 260-char paths).
# Usage (from mobile folder):
#   .\run-android.ps1
#   .\run-android.ps1 --device <adbId>

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

New-Item -ItemType Directory -Force -Path "C:\g" | Out-Null
$env:GRADLE_USER_HOME = "C:\g"

# Prefer project Ninja 1.12 on PATH for any tooling that resolves `ninja`
$ninjaDir = Join-Path $here "android\tools\ninja"
if (Test-Path (Join-Path $ninjaDir "ninja.exe")) {
  $env:PATH = "$ninjaDir;$env:PATH"
}

Write-Host "GRADLE_USER_HOME=$env:GRADLE_USER_HOME"
Write-Host "Project root: $here"

# adb may print "daemon starting" to stderr — don't treat that as fatal
$prevEap = $ErrorActionPreference
$ErrorActionPreference = "Continue"
adb start-server 2>$null | Out-Null
adb reverse tcp:8081 tcp:8081 2>$null | Out-Null
adb reverse tcp:4000 tcp:4000 2>$null | Out-Null
$ErrorActionPreference = $prevEap

npx react-native run-android @args
