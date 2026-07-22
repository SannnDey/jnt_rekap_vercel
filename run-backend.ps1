# JNT Rekap - Backend Quick Setup & Run
# PowerShell script untuk Windows

$ErrorActionPreference = "Continue"

function Write-Header {
    param([string]$text)
    $border = "=" * 60
    Write-Host "`n$border`n  $text`n$border" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$text)
    Write-Host "✓ $text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$text)
    Write-Host "✗ $text" -ForegroundColor Red
}

function Write-Info {
    param([string]$text)
    Write-Host "ℹ $text" -ForegroundColor Yellow
}

# Main Setup
Write-Header "JNT REKAP - Backend Setup & Run"

# Check Node.js
Write-Info "Checking Node.js..."
$nodeCheck = node -v 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Success "Node.js $nodeCheck found"
} else {
    Write-Error-Custom "Node.js not found! Please install Node.js v18+ from https://nodejs.org/"
    Read-Host "Press Enter to exit"
    exit 1
}

# Navigate to backend
$backendPath = Join-Path $PSScriptRoot "backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    Write-Success "Navigated to backend directory"
} else {
    Write-Error-Custom "Backend directory not found!"
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Info "Installing dependencies..."
npm install 2>&1 | Where-Object { $_ -match "^(npm|added|up to date)" }
if ($LASTEXITCODE -eq 0) {
    Write-Success "Dependencies installed"
} else {
    Write-Error-Custom "Failed to install dependencies"
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup Prisma
Write-Info "Setting up Prisma..."
npm run prisma:generate >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Prisma client generated"
} else {
    Write-Error-Custom "Failed to generate Prisma client"
    npm run prisma:generate
    Read-Host "Press Enter to continue"
}

# Push schema
Write-Info "Pushing schema to database..."
npm run prisma:push -- --skip-generate >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Schema pushed successfully"
} else {
    Write-Error-Custom "Failed to push schema"
    Write-Host "`nTroubleshooting tips:"
    Write-Host "  1. Ensure MySQL Server is running"
    Write-Host "  2. Check DATABASE_URL in .env"
    Write-Host "  3. Verify credentials (root/root)"
    Read-Host "Press Enter to continue"
    npm run prisma:push
}

# Seed database
Write-Info "Seeding database..."
npm run prisma:seed >$null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Success "Database seeded with sample data"
} else {
    Write-Error-Custom "Seeding encountered an issue (this is OK)"
    npm run prisma:seed
}

# Start server
Write-Header "🚀 BACKEND SERVER STARTING"
npm run dev
