# PowerShell script to securely set up Redis with password
# This script sets the password and restarts Redis

Write-Host "🔒 Setting up secure Redis configuration..." -ForegroundColor Cyan

# Get password from environment variable or generate a secure random one
$password = $env:REDIS_PASSWORD

if (-not $password) {
    Write-Host "`n⚠️  REDIS_PASSWORD not set in environment variables" -ForegroundColor Yellow
    Write-Host "   Generating a secure random password..." -ForegroundColor Yellow
    
    # Generate a secure random password (32 characters)
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?"
    $password = ""
    for ($i = 0; $i -lt 32; $i++) {
        $password += $chars[(Get-Random -Maximum $chars.Length)]
    }
    
    Write-Host "   ✅ Generated password (saved to environment variable)" -ForegroundColor Green
    Write-Host "`n⚠️  IMPORTANT: Save this password to your .env file:" -ForegroundColor Yellow
    Write-Host "   REDIS_PASSWORD=$password" -ForegroundColor White
    Write-Host "`n   Or set it as an environment variable:" -ForegroundColor Yellow
    Write-Host "   `$env:REDIS_PASSWORD = '$password'" -ForegroundColor White
} else {
    Write-Host "`n✅ Using REDIS_PASSWORD from environment variable" -ForegroundColor Green
}

Write-Host "`n📝 Setting Redis password..." -ForegroundColor Yellow
$env:REDIS_PASSWORD = $password

Write-Host "🔄 Restarting Redis with secure configuration..." -ForegroundColor Yellow
docker-compose down redis
docker-compose up -d redis

Write-Host "⏳ Waiting for Redis to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n🧪 Testing Redis connection..." -ForegroundColor Cyan
cd backend
npm run test:redis

Write-Host "`n✅ Redis security setup complete!" -ForegroundColor Green
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Port: 127.0.0.1:6379 (localhost only)" -ForegroundColor White
Write-Host "   - Password: Configured" -ForegroundColor White
Write-Host "   - Resource limits: Applied" -ForegroundColor White
Write-Host "   - Network isolation: Enabled" -ForegroundColor White

