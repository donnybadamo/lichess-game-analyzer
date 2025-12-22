@echo off
REM Lichess Game Analyzer - Installation Script (Windows)
REM This script sets up the Chrome extension for first-time use

echo.
echo 🎯 Lichess Game Analyzer - Installation Script
echo ================================================
echo.

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo 📁 Working directory: %SCRIPT_DIR%
echo.

REM Check if icons directory exists
if not exist "icons" (
    echo 📁 Creating icons directory...
    mkdir icons
)

REM Check if icons exist
if not exist "icons\icon16.png" (
    echo 🎨 Icons need to be generated...
    echo.
    echo Please:
    echo 1. Open create-icons.html in your browser
    echo 2. Click "Generate Icons"
    echo 3. Download and save all three icons to the icons\ folder
    echo.
) else (
    echo ✓ Icons already exist
)

echo.
echo 🔍 Verifying extension files...
echo.

set "MISSING=0"

if exist "manifest.json" (
    echo ✓ manifest.json
) else (
    echo ✗ manifest.json (MISSING)
    set MISSING=1
)

if exist "content.js" (
    echo ✓ content.js
) else (
    echo ✗ content.js (MISSING)
    set MISSING=1
)

if exist "background.js" (
    echo ✓ background.js
) else (
    echo ✗ background.js (MISSING)
    set MISSING=1
)

if exist "analysis.html" (
    echo ✓ analysis.html
) else (
    echo ✗ analysis.html (MISSING)
    set MISSING=1
)

if exist "analysis.js" (
    echo ✓ analysis.js
) else (
    echo ✗ analysis.js (MISSING)
    set MISSING=1
)

if exist "analysis.css" (
    echo ✓ analysis.css
) else (
    echo ✗ analysis.css (MISSING)
    set MISSING=1
)

if exist "popup.html" (
    echo ✓ popup.html
) else (
    echo ✗ popup.html (MISSING)
    set MISSING=1
)

if exist "popup.js" (
    echo ✓ popup.js
) else (
    echo ✗ popup.js (MISSING)
    set MISSING=1
)

if %MISSING%==1 (
    echo.
    echo ❌ Error: Missing required files!
    pause
    exit /b 1
)

echo.
echo ✅ All files verified!
echo.

echo 🌐 Chrome Extension Installation Instructions:
echo ==============================================
echo.
echo 📱 Windows Installation:
echo 1. Open Google Chrome
echo 2. Navigate to: chrome://extensions/
echo 3. Enable "Developer mode" (toggle in top right)
echo 4. Click "Load unpacked"
echo 5. Select this folder: %SCRIPT_DIR%
echo.

echo 🎮 Usage:
echo =========
echo 1. Play a game on lichess.org
echo 2. When the game finishes, a new tab will automatically open with analysis
echo 3. Or click the extension icon and click "Analyze Current Game"
echo.

echo ✨ Installation complete!
echo.
pause

