# PowerShell script to set up environment variables for ResumeCraft
# This script creates/updates .env files with Redis configuration

Write-Host "🚀 Setting up ResumeCraft environment variables..." -ForegroundColor Cyan

# Backend .env setup
$backendEnvPath = "backend\.env"
$backendEnvExample = "ENV_EXAMPLE_BACKEND.md"

Write-Host "`n📝 Setting up backend environment variables..." -ForegroundColor Yellow

if (Test-Path $backendEnvPath) {
    Write-Host "   ⚠️  backend\.env already exists. Checking for Redis configuration..." -ForegroundColor Yellow
    
    $backendContent = Get-Content $backendEnvPath -Raw
    
    if ($backendContent -notmatch "REDIS_HOST") {
        Write-Host "   ➕ Adding Redis configuration to backend\.env..." -ForegroundColor Green
        Add-Content $backendEnvPath "`n# Redis Configuration (REQUIRED for production)"
        Add-Content $backendEnvPath "REDIS_HOST=localhost"
        Add-Content $backendEnvPath "REDIS_PORT=6379"
        Add-Content $backendEnvPath "REDIS_PASSWORD="
        Add-Content $backendEnvPath ""
        Add-Content $backendEnvPath "# MongoDB Connection Pool (Optional - defaults are good)"
        Add-Content $backendEnvPath "MONGODB_MAX_POOL_SIZE=10"
        Add-Content $backendEnvPath "MONGODB_MIN_POOL_SIZE=2"
    } else {
        Write-Host "   ✅ Redis configuration already exists in backend\.env" -ForegroundColor Green
    }
} else {
    Write-Host "   📄 Creating backend\.env from example..." -ForegroundColor Green
    Copy-Item $backendEnvExample $backendEnvPath -ErrorAction SilentlyContinue
    
    # Add Redis config if not in example
    $content = Get-Content $backendEnvPath -Raw
    if ($content -notmatch "REDIS_HOST") {
        Add-Content $backendEnvPath "`n# Redis Configuration (REQUIRED for production)"
        Add-Content $backendEnvPath "REDIS_HOST=localhost"
        Add-Content $backendEnvPath "REDIS_PORT=6379"
        Add-Content $backendEnvPath "REDIS_PASSWORD="
    }
}

# Frontend .env.production setup
$frontendEnvPath = "frontend\.env.production"
$frontendEnvExample = "ENV_EXAMPLE_FRONTEND.md"

Write-Host "`n📝 Setting up frontend environment variables..." -ForegroundColor Yellow

if (-not (Test-Path $frontendEnvPath)) {
    Write-Host "   📄 Creating frontend\.env.production..." -ForegroundColor Green
    
    # Create basic frontend .env.production
    @"
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=ResumeCraft
VITE_APP_VERSION=1.0.0

# Error Tracking (Optional - Sentry)
VITE_SENTRY_DSN=
VITE_ENABLE_SENTRY=false
"@ | Out-File -FilePath $frontendEnvPath -Encoding utf8
    
    Write-Host "   ✅ Created frontend\.env.production" -ForegroundColor Green
} else {
    Write-Host "   ✅ frontend\.env.production already exists" -ForegroundColor Green
}

Write-Host "`n✅ Environment variables setup complete!" -ForegroundColor Green
Write-Host "`n📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor White
Write-Host "   2. Run: docker-compose up -d redis" -ForegroundColor White
Write-Host "   3. Test: cd backend && npm run test:redis" -ForegroundColor White


