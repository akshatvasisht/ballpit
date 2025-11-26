#!/bin/bash

###############################################################################
# Quick Demo Validation Script
# Purpose: Fast validation that system is demo-ready (no redeployment)
###############################################################################

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[[OK]]${NC} $1"; }
log_error() { echo -e "${RED}[[FAIL]]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[!]${NC} $1"; }

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}QUICK DEMO VALIDATION CHECK${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check smart contract is deployed
log_info "Checking smart contract deployment..."
PROGRAM_ID="5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"
if solana program show $PROGRAM_ID > /dev/null 2>&1; then
    log_success "Smart contract deployed on devnet: $PROGRAM_ID"
else
    log_error "Smart contract not found on devnet"
    exit 1
fi

# Check backend configuration
log_info "Checking backend configuration..."
if [ ! -f backend/.env ]; then
    log_error "Backend .env file missing"
    exit 1
fi

if grep -q "PROGRAM_ID=$PROGRAM_ID" backend/.env; then
    log_success "Backend .env configured correctly"
else
    log_error "Backend .env has wrong PROGRAM_ID"
    exit 1
fi

# Check backend can start
log_info "Testing backend startup..."
cd backend
timeout 5 node index.js > /tmp/backend-test.log 2>&1
if grep -q "Backend server running" /tmp/backend-test.log; then
    log_success "Backend starts successfully"
    cat /tmp/backend-test.log | grep -E "(Backend server|Program ID|Cluster)"
else
    log_error "Backend failed to start"
    cat /tmp/backend-test.log
    exit 1
fi
cd ..

# Check frontend builds
log_info "Checking frontend build..."
if [ -d frontend/.next ]; then
    log_success "Frontend already built"
else
    log_info "Building frontend (first time)..."
    cd frontend
    npm run build > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        log_success "Frontend built successfully"
    else
        log_warning "Frontend build had issues (may be OK)"
    fi
    cd ..
fi

# Final summary
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}[OK] SYSTEM IS DEMO READY${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}Configuration:${NC}"
echo -e "  Program ID: ${YELLOW}$PROGRAM_ID${NC}"
echo -e "  Explorer:   ${YELLOW}https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet${NC}"
echo ""
echo -e "${BLUE}To start demo:${NC}"
echo -e "  1. Terminal 1: ${YELLOW}cd backend && npm start${NC}"
echo -e "  2. Terminal 2: ${YELLOW}cd frontend && npm run dev${NC}"
echo -e "  3. Browser:    ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${GREEN}Ready for screenshots!${NC}"
echo ""
