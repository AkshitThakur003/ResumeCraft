# 🚀 ResumeCraft Deployment Guide

Complete guide for deploying ResumeCraft to **Render** (Backend) and **Vercel** (Frontend).

---

## 📋 Deployment Architecture

```
┌─────────────────┐
│   Vercel        │  Frontend (React/Vite)
│   Static Site   │  https://your-app.vercel.app
└────────┬────────┘
         │ API Calls
         ▼
┌─────────────────┐
│   Render        │  Backend (Node.js/Express)
│   Web Service   │  https://your-backend.onrender.com
└────────┬────────┘
         │
    ┌────┴────┬──────────────┐
    ▼         ▼              ▼
┌────────┐ ┌────────┐  ┌─────────────┐
│ Render │ │ MongoDB│  │  Cloudinary │
│ Redis  │ │ Atlas  │  │  (Files)    │
└────────┘ └────────┘  └─────────────┘
```

---

## 🎯 Prerequisites

Before starting, ensure you have:

- ✅ GitHub repository with your code
- ✅ MongoDB Atlas account and cluster
- ✅ Cloudinary account (for file uploads)
- ✅ OpenAI API key (for AI features)
- ✅ SMTP credentials (Gmail App Password or SendGrid)
- ✅ Render account (free tier available)
- ✅ Vercel account (free tier available)

---

## 📦 Step 1: Prepare Your Repository

### 1.1 Push Code to GitHub

```bash
git add .
git commit -m "Add deployment files"
git push origin main
```

### 1.2 Verify Files

Make sure these files exist:
- ✅ `backend/Dockerfile`
- ✅ `backend/.dockerignore`
- ✅ `backend/.env.example`
- ✅ `frontend/.env.production.example`

---

## 🐳 Step 2: Deploy Backend to Render

### 2.1 Create Redis Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Redis"**
3. Configure:
   - **Name**: `resumecraft-redis`
   - **Plan**: Free (25MB) or Starter ($7/month for 100MB)
   - **Region**: Choose closest to your backend
4. Click **"Create Redis"**
5. **Copy the connection details**:
   - Internal Redis URL (for services on Render)
   - External Redis URL (if needed)
   - Password

### 2.2 Create Backend Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure the service:

   **Basic Settings:**
   - **Name**: `resumecraft-backend`
   - **Region**: Same as Redis
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `backend/Dockerfile` (or leave default)

   **Build & Deploy:**
   - **Build Command**: (Leave empty - Docker handles this)
   - **Start Command**: (Leave empty - Dockerfile CMD handles this)

   **Environment Variables:**
   Add all these variables (click "Add Environment Variable" for each):

   ```env
   # Server
   NODE_ENV=production
   PORT=5000

   # MongoDB (from MongoDB Atlas)
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumecraft?retryWrites=true&w=majority

   # JWT Secrets (generate strong secrets!)
   JWT_ACCESS_SECRET=<generate-strong-secret-64-chars>
   JWT_REFRESH_SECRET=<generate-strong-secret-64-chars>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Redis (from Render Redis service)
   REDIS_URL=redis://:password@host:6379
   # OR use individual variables:
   # REDIS_HOST=<redis-host>
   # REDIS_PORT=6379
   # REDIS_PASSWORD=<redis-password>

   # Frontend URL (for CORS) - UPDATE AFTER VERCEL DEPLOYMENT
   CLIENT_URL=https://your-app.vercel.app

   # OpenAI
   OPENAI_API_KEY=sk-your-openai-key

   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret

   # SMTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

   **Generate JWT Secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Run this twice to get two different secrets.

3. Click **"Create Web Service"**
4. Render will start building and deploying your backend
5. Wait for deployment to complete (5-10 minutes)
6. **Copy your backend URL**: `https://your-backend.onrender.com`

### 2.3 Test Backend

1. Check health endpoint:
   ```bash
   curl https://your-backend.onrender.com/health
   ```
   Should return JSON with `"success": true`

2. Check logs in Render dashboard for:
   - ✅ "MongoDB connected"
   - ✅ "Redis client ready"
   - ✅ "ResumeCraft API Server Started"

---

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure project:

   **Project Settings:**
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

   **Environment Variables:**
   Add these variables:

   ```env
   VITE_API_URL=https://your-backend.onrender.com/api
   VITE_APP_NAME=ResumeCraft
   VITE_APP_VERSION=1.0.0
   VITE_SENTRY_DSN= (optional)
   VITE_ENABLE_SENTRY=false
   ```

5. Click **"Deploy"**
6. Wait for deployment (2-5 minutes)
7. **Copy your frontend URL**: `https://your-app.vercel.app`

### 3.2 Update Backend CORS

1. Go back to Render dashboard
2. Edit your backend service
3. Update environment variable:
   ```env
   CLIENT_URL=https://your-app.vercel.app
   ```
4. Save and redeploy (or it will auto-redeploy)

---

## ✅ Step 4: Verify Deployment

### 4.1 Test Frontend

1. Visit `https://your-app.vercel.app`
2. Try to register a new account
3. Check if API calls work

### 4.2 Test Backend API

```bash
# Health check
curl https://your-backend.onrender.com/health

# API docs
open https://your-backend.onrender.com/api-docs
```

### 4.3 Create Admin User

SSH into Render or use Render Shell:

```bash
# In Render dashboard, go to your backend service
# Click "Shell" tab, then run:
cd /opt/render/project/src/backend
node scripts/createAdmin.js admin@example.com Admin@123 Admin User
```

Or use Render's scheduled commands feature.

---

## 🔧 Step 5: Post-Deployment Configuration

### 5.1 MongoDB Atlas

1. Go to MongoDB Atlas dashboard
2. **Network Access**: Add Render's IP or allow all (0.0.0.0/0) for testing
3. **Database Access**: Ensure your user has read/write permissions

### 5.2 Cloudinary

1. Verify uploads work by uploading a profile picture
2. Check Cloudinary dashboard for uploaded files

### 5.3 SMTP/Email

1. Test email verification by registering a new account
2. Check spam folder if email doesn't arrive

### 5.4 Redis

Check backend logs for:
```
✅ Redis client ready and connected to <host>:<port>
```

If you see warnings about Redis, the app will still work with in-memory fallback.

---

## 🐛 Troubleshooting

### Backend Issues

**Problem: Build fails**
- Check Dockerfile syntax
- Verify all files are in repository
- Check Render build logs

**Problem: Backend won't start**
- Check environment variables are set correctly
- Verify MongoDB connection string
- Check JWT secrets are strong enough (32+ chars)

**Problem: Redis connection fails**
- Verify REDIS_URL or REDIS_HOST/PORT/PASSWORD
- Check Redis service is running in Render
- App will work with in-memory fallback

**Problem: CORS errors**
- Verify CLIENT_URL matches your Vercel URL exactly
- Check for trailing slashes
- Redeploy backend after changing CLIENT_URL

### Frontend Issues

**Problem: API calls fail**
- Verify VITE_API_URL is correct
- Check backend is running
- Check browser console for errors
- Verify CORS is configured

**Problem: Build fails**
- Check Node.js version (should be 18+)
- Verify all dependencies are in package.json
- Check Vercel build logs

---

## 📊 Monitoring

### Render

- **Logs**: Available in Render dashboard
- **Metrics**: Basic metrics in free tier
- **Health Checks**: Automatic via Dockerfile HEALTHCHECK

### Vercel

- **Analytics**: Available in Vercel dashboard
- **Logs**: Function logs available
- **Performance**: Built-in analytics

---

## 🔄 Updating Deployment

### Update Backend

1. Push changes to GitHub
2. Render auto-deploys on push to main branch
3. Monitor deployment in Render dashboard

### Update Frontend

1. Push changes to GitHub
2. Vercel auto-deploys on push
3. Monitor deployment in Vercel dashboard

---

## 💰 Cost Estimation

### Free Tier (Development/Small Projects)

- **Render Backend**: Free (spins down after 15 min inactivity)
- **Render Redis**: Free (25MB)
- **Vercel Frontend**: Free (unlimited)
- **MongoDB Atlas**: Free (512MB)
- **Cloudinary**: Free (25 credits/month)
- **Total**: $0/month

### Paid Tier (Production)

- **Render Backend**: $7/month (always on)
- **Render Redis**: $7/month (100MB)
- **Vercel Frontend**: Free or Pro ($20/month)
- **MongoDB Atlas**: $9/month (M0 cluster)
- **Cloudinary**: Pay as you go
- **Total**: ~$23-43/month

---

## 🔒 Security Checklist

- [ ] JWT secrets are strong (64+ characters, high entropy)
- [ ] MongoDB connection string uses strong password
- [ ] Redis password is set and strong
- [ ] CORS is configured correctly (CLIENT_URL set)
- [ ] Environment variables are not committed to Git
- [ ] MongoDB network access is restricted
- [ ] HTTPS is enabled (automatic on Render/Vercel)

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [Cloudinary Setup](docs/CLOUDINARY_SMTP_SETUP.md)
- [Admin Setup](docs/ADMIN_SETUP.md)

---

## 🆘 Support

If you encounter issues:

1. Check Render/Vercel logs
2. Verify all environment variables
3. Test locally first
4. Check this guide's troubleshooting section
5. Review backend/frontend logs

---

**🎉 Congratulations! Your ResumeCraft application is now deployed!**

