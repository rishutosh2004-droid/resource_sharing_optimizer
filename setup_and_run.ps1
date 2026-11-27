# setup_and_run.ps1
# All-in-one setup: installs Python venv, installs deps, seeds DB, starts backend
# Run this from PowerShell in the project root:
#   Set-ExecutionPolicy -Scope Process Bypass
#   .\setup_and_run.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Resource Sharing Optimizer - Full Local Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── BACKEND ──────────────────────────────────────────────────────────────────
Write-Host ">>> BACKEND SETUP" -ForegroundColor Magenta

Set-Location $BackendDir

# Create venv
if (-Not (Test-Path "venv\Scripts\python.exe")) {
    Write-Host "[1/5] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "      Done." -ForegroundColor Green
} else {
    Write-Host "[1/5] Virtual environment already exists. Skipping." -ForegroundColor Green
}

# Install requirements
Write-Host "[2/5] Installing Python packages (this may take 1-2 min)..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install -r requirements.txt --quiet
Write-Host "      Done." -ForegroundColor Green

# Init DB (SQLite — no PostgreSQL needed)
Write-Host "[3/5] Creating database tables (SQLite)..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m app.database_init
Write-Host "      Done." -ForegroundColor Green

# Seed data
Write-Host "[4/5] Seeding demo data..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m app.seed
Write-Host "      Done." -ForegroundColor Green

# Start backend in new window
Write-Host "[5/5] Starting FastAPI backend in a new window..." -ForegroundColor Yellow
$backendCmd = "Set-Location '$BackendDir'; & '.\venv\Scripts\uvicorn.exe' app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

Write-Host ""
Write-Host ">>> FRONTEND SETUP" -ForegroundColor Magenta

Set-Location $FrontendDir

# Check if node is available
$nodeExists = Get-Command node -ErrorAction SilentlyContinue
if (-Not $nodeExists) {
    Write-Host ""
    Write-Host "[!] Node.js not found. Please install it from:" -ForegroundColor Red
    Write-Host "    https://nodejs.org/en/download (LTS v24)" -ForegroundColor Yellow
    Write-Host "    After installing, re-run this script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    The backend is already running at http://localhost:8000" -ForegroundColor Green
    Write-Host "    Test the API docs at http://localhost:8000/docs" -ForegroundColor Cyan
} else {
    Write-Host "[1/2] Installing Node dependencies..." -ForegroundColor Yellow
    & npm install
    Write-Host "[2/2] Starting React frontend in a new window..." -ForegroundColor Yellow
    $frontendCmd = "Set-Location '$FrontendDir'; npm run dev"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd
    Write-Host ""
    Write-Host ">>> Everything is running!" -ForegroundColor Green
    Write-Host "    Frontend  : http://localhost:5173" -ForegroundColor Cyan
    Write-Host "    Backend   : http://localhost:8000" -ForegroundColor Cyan
    Write-Host "    API Docs  : http://localhost:8000/docs" -ForegroundColor Cyan
}

Write-Host ""
Write-Host ">>> Demo Login Credentials:" -ForegroundColor Magenta
Write-Host "    Demo Member : admin@institution.edu        / admin123" -ForegroundColor White
Write-Host "    CS Admin    : cs.admin@institution.edu     / admin123" -ForegroundColor White
Write-Host "    CS Member   : john.doe@institution.edu     / member123" -ForegroundColor White
Write-Host ""

Set-Location $ProjectRoot
