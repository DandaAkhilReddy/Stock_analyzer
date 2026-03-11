#!/usr/bin/env bash
# Build script for production deployment.
# Builds the React frontend and copies output into backend/static/
# so FastAPI can serve the SPA.

set -euo pipefail

echo "=== Installing backend dependencies ==="
cd backend
pip install -r requirements.txt
cd ..

echo "=== Installing frontend dependencies ==="
cd frontend
npm ci

echo "=== Building frontend ==="
npm run build
cd ..

echo "=== Copying frontend build to backend/static ==="
rm -rf backend/static
cp -r frontend/dist backend/static

echo "=== Build complete ==="
echo "Run with: cd backend && uvicorn main:app --host 0.0.0.0 --port \$PORT"
