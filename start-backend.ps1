# Script to start SoccerHub backend

Write-Host "Starting SoccerHub Backend..." -ForegroundColor Green
Write-Host ""

# Change to project directory
Set-Location C:\Users\pg114544\SoccerHub

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = docker ps 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker Desktop is not running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start Docker Desktop manually:" -ForegroundColor Yellow
    Write-Host "1. Click Windows Start"
    Write-Host "2. Type 'Docker'"
    Write-Host "3. Click 'Docker Desktop'"
    Write-Host "4. Wait 30-60 seconds for it to start"
    Write-Host "5. Then run this script again"
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Docker is running!" -ForegroundColor Green
Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start services
docker-compose -f docker-compose.dev.yml up

Write-Host ""
Write-Host "✅ Services are running!" -ForegroundColor Green
Write-Host "API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Database: localhost:5432" -ForegroundColor Cyan
Write-Host "Cache: localhost:6379" -ForegroundColor Cyan
