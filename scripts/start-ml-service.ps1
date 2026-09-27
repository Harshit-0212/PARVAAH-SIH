# scripts/start-ml-service.ps1
# Starts the PARVAAH XGBoost ML Service on port 8001
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectRoot = Split-Path -Parent $ScriptDir
$MlDir = Join-Path $ProjectRoot "ml-service"
$VenvPython = Join-Path $MlDir ".venv\Scripts\python.exe"

Write-Host "Starting PARVAAH XGBoost ML Service on http://127.0.0.1:8001..." -ForegroundColor Cyan
Set-Location $MlDir
& $VenvPython -m uvicorn app.main:app --host 127.0.0.1 --port 8001
