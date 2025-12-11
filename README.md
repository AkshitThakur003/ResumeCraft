# ResumeCraft - AI-Powered Resume Analysis Platform

![ResumeCraft Logo](https://img.shields.io/badge/ResumeCraft-AI--Powered-blue?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![React](https://img.shields.io/badge/React-18+-blue?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)
![Docker](https://img.shields.io/badge/Docker-Ready-blue?style=flat-square&logo=docker)
![Redis](https://img.shields.io/badge/Redis-Caching-red?style=flat-square&logo=redis)

> **Transform your resume with the power of artificial intelligence**

ResumeCraft is a modern, full-stack web application that uses AI to analyze resumes, match them with job descriptions, generate cover letters, and provide intelligent recommendations to improve your chances of landing your dream job.

**🚀 Production Ready** - Includes Docker configuration, comprehensive testing, and deployment guides for Render + Vercel!

---

## 🌟 What Does ResumeCraft Do?

ResumeCraft helps job seekers by:
- **Analyzing resumes** with AI to identify strengths and weaknesses
- **Matching resumes** with job descriptions to calculate compatibility scores
- **Generating cover letters** tailored to specific job applications
- **Providing actionable recommendations** on how to improve your resume
- **Admin dashboard** for user management and system monitoring
- **Real-time notifications** for important updates

Think of it as your personal career advisor powered by AI! 🤖

---

## 🚀 Key Features

### 📄 **Smart Resume Analysis**
- Upload resumes in PDF or DOC/DOCX format
- AI-powered analysis using OpenAI GPT models
- Detailed scoring for skills, experience, formatting, and ATS compatibility
- Specific, actionable recommendations for improvement
- Version tracking to compare different resume iterations
- Export analysis reports as PDF

### 🎯 **Job Description Matching**
- Compare your resume against any job posting
- AI extracts key requirements from job descriptions
- Skill gap analysis showing what you have and what's missing
- Compatibility scoring with detailed breakdown
- Targeted improvement suggestions for better matching
- Side-by-side comparison view

### 📝 **AI-Powered Cover Letters**
- Generate personalized cover letters for specific jobs
- AI analyzes job requirements and your resume
- Multiple cover letter templates and styles
- Edit and customize generated content
- Analytics tracking for cover letter performance
- Export cover letters as PDF or DOCX

### 📊 **Career Tracking & Analytics**
- Track all job applications in one place
- Monitor application status and progress
- Analytics dashboard with visual insights
- Notes and reminders for follow-ups
- Calendar integration for important dates
- Performance metrics and trends

### 🔐 **User Authentication & Security**
- Secure email/password authentication
- OAuth integration (Google)
- JWT-based token authentication with refresh tokens
- Email verification system
- Password reset functionality
- Profile management with Cloudinary image uploads

### 👥 **Admin Panel**
- User management (view, edit, activate/deactivate users)
- System statistics and metrics
- Activity logs and audit trails
- User activity monitoring
- Bulk user operations
- Email management tools

### 🔔 **Real-time Notifications**
- Server-Sent Events (SSE) for real-time updates
- Notification center with read/unread status
- Email notifications for important events
- In-app notification system
- Notification preferences

### 🎨 **Modern User Interface**
- Responsive design (desktop, tablet, mobile)
- Dark/Light theme support
- Smooth animations with Framer Motion and GSAP
- Glassmorphism design elements
- Accessible UI components (Radix UI)
- Keyboard shortcuts for power users

---

## 🏗️ Tech Stack

### **Frontend** 🎨
- **React 18** - UI framework with hooks
- **Vite** - Fast build tool and dev server
- **React Router 6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **GSAP** - Advanced animations
- **Radix UI** - Accessible component primitives
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Hot Toast** - Toast notifications
- **Vitest** - Testing framework
- **Playwright** - E2E testing

### **Backend** 🧠
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database (MongoDB Atlas)
- **Mongoose** - MongoDB ODM
- **Redis** - Caching and rate limiting (with in-memory fallback)
- **OpenAI API** - AI-powered analysis (GPT-4o-mini)
- **JWT** - Authentication tokens
- **Passport.js** - OAuth authentication
- **Cloudinary** - File storage and CDN
- **Nodemailer** - Email service
- **Bull** - Job queue management
- **Winston** - Logging
- **Sentry** - Error tracking (optional)
- **Swagger** - API documentation
- **Jest** - Testing framework

### **Infrastructure & DevOps** 🚀
- **Docker** - Containerization
- **Docker Compose** - Local development
- **Render** - Backend hosting
- **Vercel** - Frontend hosting
- **MongoDB Atlas** - Cloud database
- **Redis Cloud/Render Redis** - Caching service

### **Security & Performance** 🛡️
- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Redis-backed with in-memory fallback
- **XSS Protection** - Input sanitization
- **MongoDB Injection Protection** - Query sanitization
- **Bcrypt** - Password hashing
- **JWT Secret Validation** - Strong secret enforcement
- **Input Validation** - Express Validator & Zod

---

## 📁 Project Structure

```
ResumeCraft/
├── 📂 backend/                     # Node.js/Express API
│   ├── 📂 __tests__/              # Backend tests
│   ├── 📂 config/                 # Configuration files
│   │   ├── cloudinary.js          # Cloudinary setup
│   │   ├── db.js                  # MongoDB connection
│   │   ├── email.js               # SMTP configuration
│   │   ├── oauthProviders.js      # OAuth providers
│   │   ├── passport.js            # Passport.js setup
│   │   ├── redis.js               # Redis connection
│   │   └── swagger.js             # API documentation
│   ├── 📂 controllers/            # Request handlers
│   │   ├── adminController.js    # Admin operations
│   │   ├── authController.js      # Authentication
│   │   ├── coverLetterController.js
│   │   ├── profileController.js
│   │   ├── resumeController.js
│   │   └── ...
│   ├── 📂 middleware/             # Express middleware
│   │   ├── authMiddleware.js     # JWT authentication
│   │   ├── errorHandler.js        # Error handling
│   │   ├── rateLimit.js          # Rate limiting
│   │   └── ...
│   ├── 📂 models/                 # Mongoose schemas
│   │   ├── User.js
│   │   ├── Resume.js
│   │   ├── ResumeAnalysis.js
│   │   ├── CoverLetter.js
│   │   ├── Notification.js
│   │   └── AuditLog.js
│   ├── 📂 routes/                 # API routes
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── coverLetter.js
│   │   ├── notifications.js
│   │   ├── oauth.js
│   │   ├── resume.js
│   │   └── user.js
│   ├── 📂 services/               # Business logic
│   │   ├── analysisService.js   # AI analysis
│   │   ├── coverLetterService.js
│   │   ├── resumeService.js
│   │   └── ...
│   ├── 📂 scripts/                # Utility scripts
│   │   ├── createAdmin.js        # Create admin user
│   │   ├── health-check.js        # Health check
│   │   └── test-redis.js         # Test Redis
│   ├── 📂 utils/                  # Helper functions
│   ├── Dockerfile                 # Docker configuration
│   ├── .dockerignore            # Docker ignore rules
│   └── server.js                 # Entry point
│
├── 📂 frontend/                    # React/Vite application
│   ├── 📂 src/
│   │   ├── 📂 components/         # React components
│   │   │   ├── 📂 admin/         # Admin components
│   │   │   ├── 📂 analysis/      # Analysis components
│   │   │   ├── 📂 auth/          # Auth components
│   │   │   ├── 📂 dashboard/     # Dashboard components
│   │   │   ├── 📂 layout/        # Layout components
│   │   │   ├── 📂 profile/       # Profile components
│   │   │   ├── 📂 resume/        # Resume components
│   │   │   ├── 📂 sections/      # Landing page sections
│   │   │   ├── 📂 ui/            # UI primitives
│   │   │   └── ErrorBoundary.jsx
│   │   ├── 📂 contexts/          # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── NotificationsContext.jsx
│   │   │   └── ...
│   │   ├── 📂 hooks/             # Custom React hooks
│   │   ├── 📂 pages/             # Page components
│   │   │   ├── AdminPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ResumeAnalysisPage.jsx
│   │   │   ├── CoverLetterPage.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   └── ...
│   │   ├── 📂 services/          # API services
│   │   ├── 📂 utils/             # Utility functions
│   │   └── App.jsx               # Main app component
│   ├── vercel.json               # Vercel configuration
│   └── vite.config.js            # Vite configuration
│
├── 📂 docs/                       # Documentation
│   ├── ADMIN_SETUP.md            # Admin user setup
│   └── CLOUDINARY_SMTP_SETUP.md  # Third-party setup
│
├── 📂 e2e/                        # End-to-end tests
│   ├── auth.spec.js
│   ├── dashboard.spec.js
│   └── resume.spec.js
│
├── docker-compose.yml            # Local Redis setup
├── docker-compose.secure.yml    # Secure Redis config
├── playwright.config.js          # Playwright config
│
├── 📄 Documentation Files
│   ├── README.md                 # This file
│   ├── SETUP_GUIDE.md            # Setup instructions
│   ├── DEPLOYMENT_GUIDE.md       # Deployment guide
│   ├── DOCKER_SETUP_INSTRUCTIONS.md
│   ├── SETUP_REDIS.md
│   ├── SETUP_SENTRY.md
│   └── GITIGNORE_SUMMARY.md
│
└── package.json                  # Root package.json
```

---

## 🛠️ Getting Started

### **Prerequisites** 📋

- **Node.js** 18 or higher
- **npm** or **yarn**
- **MongoDB** (local or MongoDB Atlas)
- **Redis** (optional - for caching, has in-memory fallback)
- **OpenAI API Key** (for AI features)
- **Cloudinary Account** (for file uploads)
- **SMTP Credentials** (for email verification)

### **Quick Start** ⚡

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ResumeCraft
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   - Backend: Create `backend/.env` (see [SETUP_GUIDE.md](./SETUP_GUIDE.md))
   - Frontend: Create `frontend/.env.development`

4. **Start Redis** (optional)
   ```bash
   docker-compose up -d redis
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173 (Vite default)
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

---

## ⚙️ Environment Setup

### **Backend Environment Variables** (`backend/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/resumecraft
# OR MongoDB Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/resumecraft

# JWT Secrets (generate strong secrets!)
# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_64_character_secret_here
JWT_REFRESH_SECRET=your_64_character_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# OR use REDIS_URL format:
# REDIS_URL=redis://:password@host:6379

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_RESUME_MODEL=gpt-4o-mini

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# SMTP (Email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# Client URL (for CORS)
CLIENT_URL=http://localhost:5173

# OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_OAUTH_CODE_SECRET=your-oauth-secret

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn
```

### **Frontend Environment Variables** (`frontend/.env.development`)

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ResumeCraft
VITE_APP_VERSION=1.0.0
VITE_SENTRY_DSN= (optional)
VITE_ENABLE_SENTRY=false
```

> 💡 **Detailed Setup**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete instructions.

---

## 📚 Available Scripts

### **Root Level**
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run start            # Start production build
npm run install:all      # Install all dependencies
npm test                 # Run all tests
npm run test:backend     # Run backend tests
npm run test:frontend    # Run frontend tests
npm run test:e2e         # Run E2E tests with Playwright
npm run test:e2e:ui      # Run E2E tests with UI
```

### **Backend Scripts** (`cd backend`)
```bash
npm start                # Start production server
npm run dev              # Start with nodemon (auto-reload)
npm test                 # Run Jest tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate test coverage
npm run health-check     # Check server health
npm run test:redis       # Test Redis connection
npm run create-admin     # Create admin user
```

### **Frontend Scripts** (`cd frontend`)
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run Vitest tests
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate test coverage
npm run lint             # Run ESLint
npm run format            # Format code with Prettier
```

### **Docker Commands** 🐳
```bash
# Start Redis locally
docker-compose up -d redis

# Build backend Docker image
cd backend
docker build -t resumecraft-backend .

# Run backend container
docker run -p 5000:5000 --env-file .env resumecraft-backend
```

---

## 🌐 API Endpoints

### **Authentication** 🔐
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/resend-verification` - Resend verification email

### **Password Management** 🔑
- `POST /api/password/forgot` - Request password reset
- `POST /api/password/reset` - Reset password with token
- `POST /api/password/change` - Change password (authenticated)

### **OAuth** 🟡
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback handler

### **User Profile** 👤
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/profile-picture` - Upload profile picture
- `GET /api/user/skills` - Get user skills
- `POST /api/user/skills` - Add skill
- `DELETE /api/user/skills/:id` - Remove skill

### **Resume Management** 📄
- `POST /api/resume/upload` - Upload resume file
- `GET /api/resume/list` - Get user's resumes
- `GET /api/resume/:id` - Get resume details
- `POST /api/resume/analyze` - Analyze resume with AI
- `POST /api/resume/analyze/jd` - Analyze resume against job description
- `DELETE /api/resume/:id` - Delete resume
- `GET /api/resume/:id/export` - Export resume analysis

### **Cover Letters** 📝
- `POST /api/cover-letter/create` - Create cover letter
- `GET /api/cover-letter/list` - Get user's cover letters
- `GET /api/cover-letter/:id` - Get cover letter details
- `PUT /api/cover-letter/:id` - Update cover letter
- `DELETE /api/cover-letter/:id` - Delete cover letter
- `GET /api/cover-letter/:id/export` - Export cover letter
- `GET /api/cover-letter/analytics` - Get cover letter analytics

### **Notifications** 🔔
- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

### **Admin** 👑
- `GET /api/admin/users` - Get all users (paginated)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id/status` - Update user status
- `PUT /api/admin/users/:id/role` - Update user role
- `GET /api/admin/stats` - Get system statistics
- `GET /api/admin/audit-logs` - Get audit logs
- `POST /api/admin/users/bulk-update` - Bulk update users

### **System** ⚙️
- `GET /health` - Health check endpoint
- `GET /api/metrics` - System metrics (optional auth)
- `GET /api-docs` - Swagger API documentation

---

## 🧪 Testing

### **Backend Tests**
- **Framework**: Jest
- **Coverage**: MongoDB Memory Server, Redis mocking
- **Location**: `backend/__tests__/`
- **Run**: `cd backend && npm test`

### **Frontend Tests**
- **Framework**: Vitest + React Testing Library
- **Location**: `frontend/src/` (alongside components)
- **Run**: `cd frontend && npm test`

### **E2E Tests**
- **Framework**: Playwright
- **Location**: `e2e/`
- **Run**: `npm run test:e2e`
- **UI Mode**: `npm run test:e2e:ui`

---

## 🚀 Deployment

### **Deployment Architecture**

```
Frontend (Vercel) → Backend (Render) → MongoDB Atlas
                              ↓
                         Redis (Render)
                              ↓
                        Cloudinary (Files)
```

### **Quick Deployment**

1. **Backend to Render**
   - Use Dockerfile in `backend/`
   - Set all environment variables
   - Connect to MongoDB Atlas
   - Set up Render Redis service

2. **Frontend to Vercel**
   - Connect GitHub repository
   - Set root directory to `frontend`
   - Configure build settings
   - Set environment variables

3. **Update CORS**
   - Set `CLIENT_URL` in backend to your Vercel URL

> 📖 **Complete Guide**: See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🔒 Security Features

- ✅ **JWT Authentication** with strong secret validation
- ✅ **Password Hashing** using bcrypt
- ✅ **Rate Limiting** (Redis-backed with in-memory fallback)
- ✅ **CORS Protection** with configurable origins
- ✅ **XSS Protection** with recursive input sanitization
- ✅ **MongoDB Injection Protection** with query sanitization
- ✅ **Helmet.js** security headers
- ✅ **Input Validation** with Express Validator & Zod
- ✅ **File Upload Validation** and scanning
- ✅ **Docker Security** (non-root user, minimal base image)

---

## 📊 Performance Optimizations

- **Redis Caching** - AI analysis results cached (with in-memory fallback)
- **Code Splitting** - Frontend chunks optimized for lazy loading
- **Connection Pooling** - Efficient MongoDB connections
- **Request Deduplication** - Prevents duplicate API calls
- **Image Optimization** - Cloudinary CDN for fast delivery
- **Database Indexing** - Optimized MongoDB queries
- **Graceful Degradation** - App works even if Redis is unavailable

---

## 📖 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deployment guide
- **[docs/ADMIN_SETUP.md](./docs/ADMIN_SETUP.md)** - Admin user setup
- **[docs/CLOUDINARY_SMTP_SETUP.md](./docs/CLOUDINARY_SMTP_SETUP.md)** - Third-party services
- **[DOCKER_SETUP_INSTRUCTIONS.md](./DOCKER_SETUP_INSTRUCTIONS.md)** - Docker setup
- **[SETUP_REDIS.md](./SETUP_REDIS.md)** - Redis configuration
- **[SETUP_SENTRY.md](./SETUP_SENTRY.md)** - Error tracking setup

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Add tests** for new functionality
5. **Run tests** to ensure everything passes
6. **Commit your changes** (`git commit -m 'Add amazing feature'`)
7. **Push to the branch** (`git push origin feature/amazing-feature`)
8. **Open a Pull Request**

### **Development Guidelines**
- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation when needed
- Ensure all tests pass before submitting

---

## 🐛 Troubleshooting

### **Common Issues**

**Backend won't start**
- Check all required environment variables are set
- Verify MongoDB connection string
- Ensure JWT secrets are strong enough (32+ chars)
- Check port 5000 is not in use

**Frontend can't connect to API**
- Verify `VITE_API_URL` is correct
- Check backend is running
- Verify CORS settings in backend
- Check browser console for errors

**Redis connection fails**
- App will work with in-memory fallback
- Verify Redis is running: `docker ps`
- Check `REDIS_HOST` and `REDIS_PORT`
- Test connection: `npm run test:redis`

**MongoDB connection fails**
- Verify connection string format
- Check network access in MongoDB Atlas
- Ensure database user has correct permissions

**AI analysis not working**
- Verify `OPENAI_API_KEY` is set correctly
- Check OpenAI API quota/credits
- Review backend logs for errors

> 💡 **More Help**: Check individual setup guides in the `docs/` folder.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### **Technologies & Libraries**
- **React** - UI framework
- **Node.js & Express** - Backend runtime
- **MongoDB** - Database
- **OpenAI** - AI capabilities
- **Redis** - Caching
- **Cloudinary** - File storage
- **Vercel & Render** - Hosting platforms
- **All open-source contributors** - For amazing libraries

---

## 🎯 Quick Reference

```bash
# Install everything
npm run install:all

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Deploy
# See DEPLOYMENT_GUIDE.md
```

---

**Built with ❤️ by the ResumeCraft Team**

*Transform your career with AI-powered resume analysis! 🚀*
