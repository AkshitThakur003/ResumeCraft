# ResumeCraft - AI-Powered Resume Analysis Platform

![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)
![Redis](https://img.shields.io/badge/Redis-Caching-red?style=flat-square&logo=redis)

> **Transform your resume with AI-powered analysis, job matching, and cover letter generation**

**🚀 Production Ready** - Dockerized backend, comprehensive testing, and deployment guides for Render + Vercel!

---

## ✨ Features

- **📄 AI Resume Analysis** - Upload PDF/DOCX resumes, get detailed scoring and actionable recommendations
- **🎯 Job Description Matching** - Compare resumes with job postings, calculate compatibility scores
- **📝 AI Cover Letters** - Generate personalized cover letters tailored to specific jobs
- **📊 Analytics Dashboard** - Track applications, monitor progress, visualize performance
- **🔐 Secure Auth** - Email/password + OAuth (Google), JWT tokens, email verification
- **👥 Admin Panel** - User management, system stats, activity logs
- **🔔 Real-time Notifications** - SSE-based notifications with email alerts
- **🎨 Modern UI** - Responsive design, dark/light theme, smooth animations

---

## 🏗️ Tech Stack

**Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Radix UI  
**Backend:** Node.js, Express, MongoDB, Redis, OpenAI API, JWT, Passport.js  
**Infrastructure:** Docker, Render, Vercel, MongoDB Atlas, Cloudinary

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+, MongoDB (Atlas or local), Redis (optional), OpenAI API Key

### Installation

```bash
# Clone repository
git clone https://github.com/AkshitThakur003/ResumeCraft.git
cd ResumeCraft

# Install dependencies
npm run install:all

# Setup environment variables
# Backend: Copy backend/.env.example to backend/.env
# Frontend: Create frontend/.env.development

# Start Redis (optional)
docker-compose up -d redis

# Start development servers
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/resumecraft
JWT_ACCESS_SECRET=your_64_char_secret
JWT_REFRESH_SECRET=your_64_char_secret
OPENAI_API_KEY=sk-your-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env.development`)
```env
VITE_API_URL=http://localhost:5000/api
```

> 📖 **Detailed Setup:** See [SETUP_GUIDE.md](./SETUP_GUIDE.md)

---

## 📚 Scripts

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Frontend only
npm run dev:backend     # Backend only

# Testing
npm test                 # Run all tests
npm run test:e2e         # E2E tests

# Backend
cd backend
npm run create-admin     # Create admin user
npm run test:redis       # Test Redis connection

# Docker
docker-compose up -d redis
```

---

## 🌐 API Overview

**Authentication:** `/api/auth/*` - Register, login, OAuth, email verification  
**Resumes:** `/api/resume/*` - Upload, analyze, match with job descriptions  
**Cover Letters:** `/api/cover-letter/*` - Generate, edit, export  
**User:** `/api/user/*` - Profile, skills, preferences  
**Admin:** `/api/admin/*` - User management, stats, audit logs  
**Notifications:** `/api/notifications` - Real-time notifications

> 📖 **Full API Docs:** http://localhost:5000/api-docs (Swagger)

---

## 🚀 Deployment

### Architecture
```
Frontend (Vercel) → Backend (Render) → MongoDB Atlas
                              ↓
                         Redis (Render)
```

### Quick Deploy
1. **Backend (Render):** Use `backend/Dockerfile`, set environment variables
2. **Frontend (Vercel):** Connect repo, set root to `frontend/`, configure build
3. **Update CORS:** Set `CLIENT_URL` in backend to Vercel URL

> 📖 **Complete Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🔒 Security

- JWT authentication with strong secret validation
- Password hashing (bcrypt)
- Rate limiting (Redis-backed)
- CORS protection
- XSS & injection protection
- Input validation & sanitization
- Helmet.js security headers

---

## 📖 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Complete setup instructions
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment guide
- [DOCKER_SETUP_INSTRUCTIONS.md](./DOCKER_SETUP_INSTRUCTIONS.md) - Docker guide
- [SETUP_REDIS.md](./SETUP_REDIS.md) - Redis configuration

---

## 🐛 Troubleshooting

**Backend won't start?** Check environment variables, MongoDB connection, JWT secrets (32+ chars)  
**Frontend can't connect?** Verify `VITE_API_URL`, check CORS settings  
**Redis fails?** App works with in-memory fallback  
**AI not working?** Verify `OPENAI_API_KEY`, check API quota

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file

---

**Built with ❤️ - Transform your career with AI! 🚀**
