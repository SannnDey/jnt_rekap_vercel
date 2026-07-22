@echo off
REM ========================================
REM JNT Rekap - Backend Setup & Run Script
REM ========================================

setlocal enabledelayedexpansion

REM Colors setup
cls
title JNT Rekap - Backend Setup

echo.
echo ════════════════════════════════════════════════════
echo   JNT REKAP - Backend Setup & Run
echo ════════════════════════════════════════════════════
echo.

REM Check Node.js
echo [STEP 1/4] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ✗ ERROR: Node.js not found!
    echo   Please install Node.js v18+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM Navigate to backend
cd /d "%~dp0backend"
if %ERRORLEVEL% NEQ 0 (
    echo ✗ ERROR: Cannot find backend directory!
    pause
    exit /b 1
)

REM Install dependencies
echo [STEP 2/4] Installing dependencies...
echo   (This may take a minute...)
call npm install >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ ERROR: Failed to install dependencies!
    call npm install
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Setup database
echo [STEP 3/4] Setting up database...
echo   - Generating Prisma Client...
call npm run prisma:generate >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ ERROR: Failed to generate Prisma Client!
    call npm run prisma:generate
    pause
    exit /b 1
)

echo   - Pushing schema to database...
call npm run prisma:push -- --skip-generate >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ ERROR: Failed to push schema to database!
    echo.
    echo   Troubleshooting tips:
    echo   1. Make sure MySQL Server is running
    echo   2. Check DATABASE_URL in .env file
    echo   3. Verify username (root) and password (root)
    echo.
    call npm run prisma:push
    pause
    exit /b 1
)

echo   - Seeding database...
call npm run prisma:seed >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ✗ WARNING: Seeding encountered an issue
    call npm run prisma:seed
    REM Don't exit, continue anyway
)
echo ✓ Database setup completed
echo.

REM Start backend
echo [STEP 4/4] Starting backend server...
echo.
echo ════════════════════════════════════════════════════
echo   🚀 Backend Server Starting
echo ════════════════════════════════════════════════════
echo.

call npm run dev

REM If server exits
echo.
echo ✗ Server stopped
pause
