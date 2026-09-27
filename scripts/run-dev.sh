#!/usr/bin/env bash
# ==============================================================================
# PARVAAH (SIH26191) Development Environment Runner
# Runs both the Node.js/Express Backend and Vite/React Frontend concurrently
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Starting PARVAAH Development Environment from $ROOT_DIR..."

# Function to kill child background jobs upon exit
cleanup() {
  echo "Shutting down PARVAAH services..."
  kill $(jobs -p) 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 1. Start Backend
echo "Starting Backend on port 5000..."
cd "$ROOT_DIR/backend"
npm run dev &

# 2. Start Frontend
echo "Starting Frontend on port 5173..."
cd "$ROOT_DIR/frontend"
npm run dev &

wait
