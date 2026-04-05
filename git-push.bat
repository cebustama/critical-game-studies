@echo off
setlocal
cd /d "%~dp0"

REM ── Generate fresh tree before committing ──
echo Updating tree.txt...
call make-tree-unity.bat

REM ── Stage everything ──
echo.
echo Staging changes...
git add -A
if not "%ERRORLEVEL%"=="0" (
  echo Failed to stage files.
  pause
  exit /b %ERRORLEVEL%
)

REM ── Show what's about to be committed ──
echo.
echo ── Changes to commit ──
git status --short
echo.

REM ── Prompt for commit message ──
set /p MSG="Commit message (or press Enter for default): "
if "%MSG%"=="" set "MSG=session update %date% %time:~0,5%"

REM ── Commit ──
git commit -m "%MSG%"
if not "%ERRORLEVEL%"=="0" (
  echo Nothing to commit or commit failed.
  pause
  exit /b %ERRORLEVEL%
)

REM ── Push ──
echo.
echo Pushing to remote...
git push
if not "%ERRORLEVEL%"=="0" (
  echo Push failed. Check your remote configuration.
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Done. Committed and pushed: "%MSG%"
pause
