#!/bin/bash

# JNT Rekap - Quick Start Setup Script
# This script automates the setup process

echo "🚀 JNT Rekap - Quick Start Setup"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "\n${BLUE}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js v18+"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Setup Backend
echo -e "\n${BLUE}Setting up Backend...${NC}"
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your database credentials${NC}"
fi

echo "Installing dependencies..."
npm install

echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Setup Prisma
echo -e "\n${BLUE}Setting up Prisma...${NC}"
npm run prisma:generate
npm run prisma:push

echo "Seeding database..."
npm run prisma:seed

cd ..

# Setup Frontend
echo -e "\n${BLUE}Setting up Frontend...${NC}"
cd frontend

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cp .env.example .env.local
fi

echo "Installing dependencies..."
npm install

echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..

echo -e "\n${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "  1. Start Backend:  cd backend && npm run dev"
echo "  2. Start Frontend: cd frontend && npm run dev"
echo ""
echo "🌐 Access:"
echo "  Backend:  http://localhost:3000"
echo "  Frontend: http://localhost:3001"
echo ""
echo "📚 For detailed setup guide, see SETUP_GUIDE.md"
