# PowerShell script to set up Redis using Docker
# This script checks for Docker and sets up Redis container

Write-Host "🐳 Setting up Redis with Docker..." -ForegroundColor Cyan

# Check if Docker is installed
$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if (-not $dockerInstalled) {
    Write-Host "`n❌ Docker is not installed!" -ForegroundColor Red
    Write-Host "`n📥 Please install Docker Desktop:" -ForegroundColor Yellow
    Write-Host "   1. Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor White
    Write-Host "   2. Install Docker Desktop" -ForegroundColor White
    Write-Host "   3. Start Docker Desktop" -ForegroundColor White
    Write-Host "   4. Run this script again" -ForegroundColor White
    Write-Host "`n   Or use WSL2/Memurai instead (see SETUP_REDIS.md)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker is installed" -ForegroundColor Green

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again" -ForegroundColor Yellow
    exit 1
}

# Check if Redis container already exists
$redisExists = docker ps -a --filter "name=resumecraft-redis" --format "{{.Names}}" | Select-String "resumecraft-redis"

if ($redisExists) {
    Write-Host "`n⚠️  Redis container already exists" -ForegroundColor Yellow
    
    # Check if it's running
    $redisRunning = docker ps --filter "name=resumecraft-redis" --format "{{.Names}}" | Select-String "resumecraft-redis"
    
    if ($redisRunning) {
        Write-Host "✅ Redis container is already running" -ForegroundColor Green
        Write-Host "`n🧪 Testing Redis connection..." -ForegroundColor Cyan
        docker exec resumecraft-redis redis-cli ping
    } else {
        Write-Host "   Starting existing container..." -ForegroundColor Yellow
        docker start resumecraft-redis
        Start-Sleep -Seconds 2
        Write-Host "✅ Redis container started" -ForegroundColor Green
        Write-Host "`n🧪 Testing Redis connection..." -ForegroundColor Cyan
        docker exec resumecraft-redis redis-cli ping
    }
} else {
    Write-Host "`n🚀 Creating Redis container..." -ForegroundColor Cyan
    
    # Use docker-compose if available, otherwise use docker run
    $dockerComposeInstalled = Get-Command docker-compose -ErrorAction SilentlyContinue
    
    if ($dockerComposeInstalled -and (Test-Path "docker-compose.yml")) {
        Write-Host "   Using docker-compose..." -ForegroundColor Yellow
        docker-compose up -d redis
    } else {
        Write-Host "   Using docker run..." -ForegroundColor Yellow
        docker run -d `
            --name resumecraft-redis `
            -p 6379:6379 `
            --restart unless-stopped `
            redis:7-alpine
    }
    
    Start-Sleep -Seconds 3
    
    Write-Host "✅ Redis container created and started" -ForegroundColor Green
    Write-Host "`n🧪 Testing Redis connection..." -ForegroundColor Cyan
    docker exec resumecraft-redis redis-cli ping
}

Write-Host "`n✅ Redis setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run: .\setup-env.ps1 (to set up environment variables)" -ForegroundColor White
Write-Host "   2. Test: cd backend && npm run test:redis" -ForegroundColor White
Write-Host "   3. Start backend: cd backend && npm start" -ForegroundColor White


