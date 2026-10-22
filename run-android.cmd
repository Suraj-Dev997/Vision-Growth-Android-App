@echo off
setlocal
cd /d "%~dp0"
if not exist "C:\g" mkdir "C:\g"
set GRADLE_USER_HOME=C:\g
set PATH=%~dp0android\tools\ninja;%PATH%
echo GRADLE_USER_HOME=%GRADLE_USER_HOME%
adb reverse tcp:8081 tcp:8081 >nul 2>&1
adb reverse tcp:4000 tcp:4000 >nul 2>&1
call npx react-native run-android %*
