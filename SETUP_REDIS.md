# Redis Setup Guide for ResumeCraft

Redis is **required for production** to enable:
- Distributed caching (works across multiple server instances)
- Distributed rate limiting (prevents bypassing limits)
- Horizontal scaling capability

---

## 🪟 Windows Installation

### Option 1: Using WSL2 (Recommended for Development)

1. **Install WSL2** (if not already installed):
   ```powershell
   wsl --install
   ```
   Restart your computer after installation.

2. **Install Redis in WSL2**:
   ```bash
   # In WSL2 terminal
   sudo apt update
   sudo apt install redis-server
   ```

3. **Start Redis**:
   ```bash
   sudo service redis-server start
   ```

4. **Test Redis**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

5. **Configure Redis to start on boot**:
   ```bash
   sudo systemctl enable redis-server
   ```

### Option 2: Using Docker (Recommended for Production)

1. **Install Docker Desktop** (if not installed):
   - Download from: https://www.docker.com/products/docker-desktop

2. **Run Redis container**:
   ```powershell
   docker run -d --name redis-resumecraft -p 6379:6379 redis:7-alpine
   ```

3. **Test Redis**:
   ```powershell
   docker exec -it redis-resumecraft redis-cli ping
   # Should return: PONG
   ```

### Option 3: Memurai (Native Windows Redis)

1. **Download Memurai**:
   - Visit: https://www.memurai.com/get-memurai
   - Download the free developer edition

2. **Install Memurai**:
   - Run the installer
   - It will install as a Windows service

3. **Test Redis**:
   ```powershell
   # Memurai includes redis-cli
   redis-cli ping
   # Should return: PONG
   ```

---

## 🐧 Linux/macOS Installation

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

### Test Installation:
```bash
redis-cli ping
# Should return: PONG
```

---

## ⚙️ Configuration

### 1. Update Backend Environment Variables

Edit `backend/.env` and add:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty for local development, set password for production
```

### 2. For Production (with Password)

If you set a Redis password, update `backend/.env`:

```env
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password
```

### 3. Test Redis Connection

Create a test script or use the health check:

```bash
# In backend directory
node -e "const Redis = require('ioredis'); const r = new Redis({host: 'localhost', port: 6379}); r.ping().then(() => {console.log('✅ Redis connected!'); process.exit(0);}).catch(e => {console.error('❌ Redis error:', e.message); process.exit(1);});"
```

---

## 🔒 Production Security

### Set Redis Password (Recommended for Production)

1. **Edit Redis config** (location depends on installation):
   - WSL2: `/etc/redis/redis.conf`
   - Docker: Use environment variable
   - Memurai: Configuration file in installation directory

2. **Add password**:
   ```conf
   requirepass your_secure_redis_password
   ```

3. **Restart Redis**:
   ```bash
   # WSL2
   sudo service redis-server restart
   
   # Docker
   docker restart redis-resumecraft
   
   # Memurai
   # Restart via Windows Services
   ```

4. **Update backend/.env**:
   ```env
   REDIS_PASSWORD=your_secure_redis_password
   ```

---

## 🧪 Testing Redis Connection

### Manual Test

Run this in your backend directory:

```bash
node scripts/test-redis.js
```

Or create a simple test:

```javascript
// test-redis.js
const { getRedisClient, isRedisAvailable } = require('./config/redis');

(async () => {
  console.log('Testing Redis connection...');
  const available = await isRedisAvailable();
  if (available) {
    console.log('✅ Redis is available and connected!');
    const client = getRedisClient();
    await client.set('test', 'value');
    const result = await client.get('test');
    console.log('✅ Redis read/write test passed:', result);
    await client.del('test');
    process.exit(0);
  } else {
    console.error('❌ Redis is not available');
    console.log('⚠️  Application will use in-memory fallback (not suitable for production)');
    process.exit(1);
  }
})();
```

---

## 🐳 Docker Compose (Optional)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: resumecraft-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped

volumes:
  redis-data:
```

Start with:
```bash
docker-compose up -d redis
```

---

## 📊 Monitoring Redis

### Check Redis Status:
```bash
redis-cli info
```

### Monitor Commands:
```bash
redis-cli monitor
```

### Check Memory Usage:
```bash
redis-cli info memory
```

---

## 🚨 Troubleshooting

### Redis not connecting?

1. **Check if Redis is running**:
   ```bash
   # Windows (Docker)
   docker ps | grep redis
   
   # WSL2/Linux
   sudo systemctl status redis-server
   ```

2. **Check port 6379 is not blocked**:
   ```bash
   # Windows
   netstat -an | findstr 6379
   
   # Linux/macOS
   netstat -an | grep 6379
   ```

3. **Check firewall settings** (if connecting remotely)

4. **Verify environment variables** in `backend/.env`

### Application still using in-memory cache?

- Redis connection errors are logged but don't crash the app
- Check backend logs for Redis connection warnings
- Verify Redis is actually running and accessible
- Test connection using the test script above

---

## ✅ Verification Checklist

- [ ] Redis is installed and running
- [ ] `redis-cli ping` returns `PONG`
- [ ] `backend/.env` has Redis configuration
- [ ] Backend can connect to Redis (check logs)
- [ ] Cache is working (test cover letter generation)
- [ ] Rate limiting is working (test multiple requests)

---

## 📚 Additional Resources

- [Redis Official Documentation](https://redis.io/docs/)
- [ioredis (Node.js Redis client) Documentation](https://github.com/redis/ioredis)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Next Steps:**
1. Install Redis using one of the methods above
2. Update `backend/.env` with Redis configuration
3. Test the connection
4. Restart your backend server
5. Verify Redis is being used (check logs for "Redis client connected")

