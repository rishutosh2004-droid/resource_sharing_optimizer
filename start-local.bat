@echo off
echo ====================================
echo  RSO Platform - Local Dev Startup
echo ====================================

echo.
echo [1/3] Installing backend dependencies...
cd backend
python -m venv venv 2>nul
call venv\Scripts\activate.bat
pip install -r requirements.txt --quiet

echo.
echo [2/3] Initializing database and seeding data...
python -m app.database_init
python -m app.seed

echo.
echo [3/3] Starting backend server...
start "RSO Backend" cmd /k "call venv\Scripts\activate.bat && uvicorn app.main:app --reload --port 8000"

cd ..\frontend

echo.
echo [4/4] Installing frontend dependencies and starting dev server...
call npm install --silent
start "RSO Frontend" cmd /k "npm run dev"

echo.
echo ====================================
echo  RSO Platform is starting up!
echo  Frontend: http://localhost:5173
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo ====================================
echo.
echo NOTE: Make sure Redis is running locally (redis-server)
echo       or update REDIS_URL in backend\.env
echo.
pause
