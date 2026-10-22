# Windows Android build (path length fix)

## Why builds failed
React Native’s New Architecture + Ninja 1.10 fail when paths exceed **260 characters**.
Cursor’s default Gradle cache under `AppData\Local\Temp\cursor-sandbox-cache\...` makes this worse.

## What we set up
1. Project lives at short path: `D:\Netcastservices\VG` (not `Vision Growth`)
2. Ninja **1.12.1** in `mobile/android/tools/ninja` (and copied into Android SDK cmake bin)
3. Windows **LongPathsEnabled** = ON
4. Short Gradle home: `C:\g` via `run-android.ps1` / `run-android.cmd`

## Build from VS Code / Cursor terminal
```powershell
cd D:\Netcastservices\VG\mobile
.\run-android.ps1
```

Or manually:
```powershell
$env:GRADLE_USER_HOME = "C:\g"
cd D:\Netcastservices\VG\mobile
npm start
# other terminal:
npm run android
```

## Open this folder in Cursor
Open **`D:\Netcastservices\VG`** (not the old `Vision Growth` folder).

The old folder can be deleted after you confirm everything works here.
