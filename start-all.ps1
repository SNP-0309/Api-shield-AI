Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      Starting API Shield Local Services (No Docker)" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "`n[1/3] Starting Python ML Service (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ml-service'; python app.py"

Start-Sleep -Seconds 2

Write-Host "[2/3] Starting Express Security Gateway (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "[3/3] Starting React Security Dashboard (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "[+] All API Shield services are now running locally!" -ForegroundColor Green
Write-Host "  - React Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "  - Express Gateway: http://localhost:5000" -ForegroundColor White
Write-Host "  - ML Service:      http://localhost:8000" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Green
