@echo off
REM JNT Rekap - Quick Start Setup Script for Windows
REM This script automates the setup process

echo.
echo JNT Rekap - Quick Start Setup
echo ==================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js not found. Please install Node.js v18+
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo SUCCESS: Node.js %%i

REM Setup Backend
echo.
echo Setting up Backend...
cd backend

if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
    echo WARNING: Please edit backend\.env with your database credentials
)

echo Installing dependencies...
call npm install

echo SUCCESS: Backend dependencies installed

REM Setup Prisma
echo.
echo Setting up Prisma...
call npm run prisma:generate
call npm run prisma:push

echo Seeding database...
call npm run prisma:seed

cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend

if not exist ".env.local" (
    echo Creating .env.local file...
    copy .env.example .env.local
)

echo Installing dependencies...
call npm install

echo SUCCESS: Frontend dependencies installed

cd ..

echo.
echo SUCCESS: Setup Complete!
echo.
echo Next Steps:
echo   1. Start Backend:  cd backend ^&^& npm run dev
echo   2. Start Frontend: cd frontend ^&^& npm run dev
echo.
echo Access:
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:3001
echo.
echo Documentation: See SETUP_GUIDE.md for detailed setup guide

pause
