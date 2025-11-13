#!/bin/bash

# Production Test Runner for Memphora TypeScript SDK
# This script runs comprehensive integration tests against the production API

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🧪 Memphora TypeScript SDK - Production Tests${NC}\n"

# Check if API URL is set
if [ -z "$MEMPHORA_API_URL" ]; then
    echo -e "${YELLOW}⚠️  MEMPHORA_API_URL not set, using default${NC}"
    export MEMPHORA_API_URL="https://memphora-backend-h7h5s5lkza-uc.a.run.app/api/v1"
fi

# Check if API Key is set
if [ -z "$MEMPHORA_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  MEMPHORA_API_KEY not set, using test key${NC}"
    export MEMPHORA_API_KEY="test-key-$(date +%s)"
fi

echo -e "${GREEN}Configuration:${NC}"
echo "  API URL: $MEMPHORA_API_URL"
echo "  API Key: ${MEMPHORA_API_KEY:0:20}..."
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}📦 Installing dependencies...${NC}"
    npm install
fi

# Build the SDK
echo -e "${GREEN}🔨 Building SDK...${NC}"
npm run build

# Run tests
echo -e "${GREEN}🚀 Running integration tests...${NC}\n"
npm test -- tests/prod-integration.test.ts --verbose

# Check exit code
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Tests failed!${NC}"
    exit 1
fi
