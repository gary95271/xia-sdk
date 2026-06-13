@echo off
REM xia-serve.cmd - double-click to run a XIA Sandbox over your LAN (Windows).
REM Requires Node.js on PATH. The packaging flow produces a standalone .exe that
REM needs no Node install (see README.md); this .cmd is the dev/no-bundle path.
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on PATH.
  echo   Install Node.js ^(https://nodejs.org^) or use the packaged xia-serve.exe.
  echo.
  pause
  exit /b 1
)

echo Starting XIA Sandbox server...  (close this window or press Ctrl+C to stop)
echo.
node "%~dp0xia-serve.mjs" %*

echo.
echo Server stopped.
pause
endlocal
