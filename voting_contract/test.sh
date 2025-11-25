#!/bin/bash

# Ballpit Contract Test Suite
# Industry standard shell script for Solana program testing

set -e          # Exit on error
set -u          # Error on unset variables
set -o pipefail # Catch errors in piped commands

# Configuration
PROGRAM_ID="5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4"
RPC_URL="http://127.0.0.1:8899"
WS_URL="ws://127.0.0.1:8900"
LEDGER_DIR=".anchor/test-ledger"

echo "--------------------------------------------------"
echo "Starting Ballpit Contract Test Suite"
echo "--------------------------------------------------"

# Cleanup function to ensure validator is stopped
cleanup() {
    EXIT_CODE=$?
    echo "--------------------------------------------------"
    echo "Cleaning up environment..."
    if [ ! -z "${VALIDATOR_PID:-}" ]; then
        kill "$VALIDATOR_PID" > /dev/null 2>&1 || true
    fi
    pkill -f solana-test-validator > /dev/null 2>&1 || true
    echo "Cleanup complete."
    exit "$EXIT_CODE"
}

trap cleanup EXIT INT TERM

# 1. Clean up existing processes
echo "Checking for stale processes..."
pkill -f solana-test-validator || true
rm -rf "$LEDGER_DIR"
sleep 1

# 2. Start the validator
echo "Starting Solana Agave validator..."
solana-test-validator --reset --quiet --bind-address 127.0.0.1 --rpc-port 8899 > /dev/null 2>&1 &
VALIDATOR_PID=$!

# 3. Wait for validator to be ready
echo "Waiting for validator readiness..."
MAX_RETRIES=30
COUNT=0
READY=false

while [ $COUNT -lt $MAX_RETRIES ]; do
    if solana cluster-version --url $RPC_URL > /dev/null 2>&1; then
        READY=true
        echo "Validator is ready."
        break
    fi
    sleep 1
    COUNT=$((COUNT + 1))
    printf "."
done
printf "\n"

if [ "$READY" = false ]; then
    echo "Error: Timeout waiting for validator."
    exit 1
fi

# 4. Ensure wallet has funds
echo "Providing funds to test wallet..."
solana airdrop 10 --url $RPC_URL > /dev/null 2>&1

# 5. Build and Deploy
echo "Building and deploying program..."
anchor build
anchor deploy --provider.cluster $RPC_URL

# 6. Run Mocha tests
echo "Running test suite cases..."
export ANCHOR_PROVIDER_URL=$RPC_URL
export ANCHOR_WALLET=$(solana config get | grep "Keypair Path" | awk '{print $3}')

# Use ts-mocha directly to avoid Anchor CLI overhead/issues
npm run test:mocha

echo "--------------------------------------------------"
echo "Tests completed successfully."
echo "--------------------------------------------------"
