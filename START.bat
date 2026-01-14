@echo off
REM SeattleSocial - Quick Start Script for Windows

echo.
echo 🔥 SeattleSocial - Starting Local Server...
echo.

REM Check if we're in the right directory
if not exist "client\dist" (
    echo ❌ Error: client\dist directory not found
    echo Please run this script from the SeattleSocial root directory
    pause
    exit /b 1
)

cd client\dist

echo 📁 Serving from: %CD%
echo.
echo 🌐 Starting server...
echo.
echo ✅ Server will start on: http://localhost:8000
echo.
echo 📖 To view the site:
echo    1. Open your web browser
echo    2. Go to: http://localhost:8000
echo.
echo ⚠️  Press Ctrl+C to stop the server
echo.
echo ---
echo.

REM Start Python HTTP server
python -m http.server 8000

pause
