# Docker Setup Instructions for Redis

## ✅ Environment Variables - DONE!

Your environment variables have been automatically configured:
- ✅ `backend/.env` - Redis configuration added
- ✅ `frontend/.env.production` - Created with Sentry configuration

---

## 🐳 Install Docker Desktop

Since Docker is not currently installed, follow these steps:

### Step 1: Download Docker Desktop

1. Go to: **https://www.docker.com/products/docker-desktop**
2. Click "Download for Windows"
3. Run the installer

### Step 2: Install Docker Desktop

1. Run the installer (`Docker Desktop Installer.exe`)
2. Follow the installation wizard
3. **Important:** Make sure "Use WSL 2 instead of Hyper-V" is checked (if available)
4. Restart your computer when prompted

### Step 3: Start Docker Desktop

1. Launch Docker Desktop from Start Menu
2. Wait for Docker to start (whale icon in system tray)
3. You'll know it's ready when the icon stops animating

### Step 4: Verify Docker is Running

Open PowerShell and run:
```powershell
docker --version
docker ps
```

You should see Docker version and an empty container list.

---

## 🚀 Start Redis with Docker

Once Docker is installed and running, you have **two options**:

### Option A: Use the Setup Script (Easiest)

```powershell
.\setup-redis-docker.ps1
```

This script will:
- Check if Docker is running
- Create and start Redis container
- Test the connection

### Option B: Use Docker Compose (Recommended)

```powershell
docker-compose up -d redis
```

This will:
- Pull Redis image (if needed)
- Create Redis container
- Start it in the background
- Set up data persistence

### Option C: Manual Docker Command

```powershell
docker run -d --name resumecraft-redis -p 6379:6379 --restart unless-stopped redis:7-alpine
```

---

## ✅ Verify Redis is Running

### Check Container Status:
```powershell
docker ps
```

You should see `resumecraft-redis` in the list.

### Test Redis Connection:
```powershell
docker exec resumecraft-redis redis-cli ping
```

Should return: `PONG`

### Test from Your Application:
```powershell
cd backend
npm run test:redis
```

---

## 📋 What Was Configured

### Backend Environment (`backend/.env`)

Added these lines:
```env
# Redis Configuration (REQUIRED for production)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MongoDB Connection Pool (Optional - defaults are good)
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
```

### Frontend Environment (`frontend/.env.production`)

Created with:
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Application Configuration
VITE_APP_NAME=ResumeCraft
VITE_APP_VERSION=1.0.0

# Error Tracking (Optional - Sentry)
VITE_SENTRY_DSN=
VITE_ENABLE_SENTRY=false
```

---

## 🔄 Quick Commands Reference

```powershell
# Start Redis
docker-compose up -d redis

# Stop Redis
docker-compose down redis

# Restart Redis
docker restart resumecraft-redis

# View Redis logs
docker logs resumecraft-redis

# Test Redis connection
docker exec resumecraft-redis redis-cli ping

# Test from application
cd backend
npm run test:redis
```

---

## 🆘 Troubleshooting

### Docker won't start?
- Make sure virtualization is enabled in BIOS
- Check Windows features: WSL 2 and Virtual Machine Platform
- Restart your computer

### Redis container won't start?
```powershell
# Check logs
docker logs resumecraft-redis

# Remove and recreate
docker rm resumecraft-redis
docker-compose up -d redis
```

### Port 6379 already in use?
```powershell
# Find what's using the port
netstat -ano | findstr :6379

# Or use a different port in docker-compose.yml
# Change: "6379:6379" to "6380:6379"
# Then update backend/.env: REDIS_PORT=6380
```

---

## ✅ Next Steps After Docker is Installed

1. **Install Docker Desktop** (see Step 1-3 above)
2. **Run the setup script:**
   ```powershell
   .\setup-redis-docker.ps1
   ```
3. **Test Redis:**
   ```powershell
   cd backend
   npm run test:redis
   ```
4. **Start your backend:**
   ```powershell
   cd backend
   npm start
   ```
5. **Check logs** for "Redis client connected"

---

## 🎯 Alternative: Use WSL2 (If Docker Fails)

If Docker doesn't work, you can use WSL2:

```bash
# In WSL2 terminal
sudo apt update
sudo apt install redis-server
sudo service redis-server start
```

Then your `backend/.env` is already configured correctly!

---

## 📚 Additional Resources

- [Docker Desktop Documentation](https://docs.docker.com/desktop/)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Status:** ✅ Environment variables configured  
**Next:** Install Docker Desktop and run `.\setup-redis-docker.ps1`


