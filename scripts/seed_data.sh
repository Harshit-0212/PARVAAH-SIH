#!/usr/bin/env bash
# ==============================================================================
# PARVAAH (SIH26191) Database & Demo Telemetry Seeder
# Seeds mock sensors, incidents, shelters, and risk profiles
# ==============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "Executing PARVAAH Seeding Scripts..."

cd "$ROOT_DIR/scripts"

if command -v npx >/dev/null 2>&1; then
  echo "Running seed.ts..."
  npx tsx seed.ts || node seed.js || true
  
  echo "Running seedPreparedness.ts..."
  npx tsx seedPreparedness.ts || node seedPreparedness.js || true
else
  echo "Node.js / npx not found in PATH. Please run npm install in the project root."
fi

echo "Seeding completed successfully."
