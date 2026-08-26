# run_backend.ps1 — Run from the 'backend' folder
# Usage: Right-click PowerShell > "Run as Administrator" is NOT needed.
# In terminal: cd "d:\github\SE project\backend" && powershell -ExecutionPolicy Bypass -File run_backend.ps1

Write-Host "================================================" -ForegroundColor Cyan
Write-Host " RSO Platform - Backend Setup & Run" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Step 1: Create virtual environment if needed
if (-Not (Test-Path "venv")) {
    Write-Host "`n[1/4] Creating Python virtual environment..." -ForegroundColor Yellow
    python -m venv venv
} else {
    Write-Host "`n[1/4] Virtual environment already exists." -ForegroundColor Green
}

# Step 2: Activate and install packages
Write-Host "`n[2/4] Installing dependencies..." -ForegroundColor Yellow
& ".\venv\Scripts\pip.exe" install -r requirements.txt

# Step 3: Initialize DB and seed
Write-Host "`n[3/4] Setting up database..." -ForegroundColor Yellow
& ".\venv\Scripts\python.exe" -m app.database_init
& ".\venv\Scripts\python.exe" -m app.seed

# Step 4: Start server
Write-Host "`n[4/4] Starting FastAPI server on http://localhost:8000" -ForegroundColor Green
Write-Host "      API Docs: http://localhost:8000/docs" -ForegroundColor Green
Write-Host "      Press Ctrl+C to stop.`n" -ForegroundColor Gray
& ".\venv\Scripts\uvicorn.exe" app.main:app --reload --port 8000
