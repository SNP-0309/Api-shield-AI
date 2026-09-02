@echo off
echo ========================================================
echo       Starting API Shield Local Services (No Docker)
echo ========================================================
echo.

echo [1/3] Launching Python ML Inference Service (Port 8000)...
start "API Shield - ML Service" cmd /k "cd ml-service && python app.py"

timeout /t 2 /nobreak >nul

echo [2/3] Launching Express Security Gateway (Port 5000)...
start "API Shield - Express Gateway" cmd /k "cd backend && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] Launching React Security Dashboard (Port 5173)...
start "API Shield - React Dashboard" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo [+] All services launched locally!
echo [+] React Dashboard: http://localhost:5173
echo [+] Express Gateway: http://localhost:5000
echo [+] ML Service:      http://localhost:8000
echo ========================================================
echo.
pause
