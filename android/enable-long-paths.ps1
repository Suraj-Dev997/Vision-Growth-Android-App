# Run once as Administrator — required for React Native New Architecture builds on Windows.
# Right-click PowerShell -> Run as administrator, then:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   & "D:\Netcastservices\Vision Growth\mobile\android\enable-long-paths.ps1"

$ErrorActionPreference = "Stop"
Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -Type DWord -Force

$val = (Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled").LongPathsEnabled

if ($val -eq 1) {
  Write-Host "OK: Windows LongPathsEnabled is ON. Restart the terminal (or reboot), then rebuild the app."
} else {
  Write-Host "FAILED: LongPathsEnabled is still $val. Re-run this script as Administrator."
  exit 1
}
