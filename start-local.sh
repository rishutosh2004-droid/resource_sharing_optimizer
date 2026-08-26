#!/bin/bash
set -e

echo "===================================="
echo " RSO Platform - Local Dev Startup"
echo "===================================="

echo ""
echo "[1/3] Installing backend dependencies..."
cd backend
python3 -m venv venv 2>/dev/null || true
source venv/bin/activate
pip install -r requirements.txt -q

echo ""
echo "[2/3] Initializing database and seeding data..."
python -m app.database_init
python -m app.seed

echo ""
echo "[3/3] Starting backend server in background..."
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

cd ../frontend

echo ""
echo "[4/4] Installing frontend dependencies and starting dev server..."
npm install -q
npm run dev &
FRONTEND_PID=$!

echo ""
echo "===================================="
echo " RSO Platform is running!"
echo " Frontend: http://localhost:5173"
echo " Backend:  http://localhost:8000"
echo " API Docs: http://localhost:8000/docs"
echo "===================================="
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
