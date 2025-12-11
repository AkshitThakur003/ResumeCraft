# ResumeCraft Setup Guide

This guide will help you set up ResumeCraft from scratch.

## Prerequisites

- **Node.js** (version 18 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **npm** or **yarn** package manager
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ResumeCraft
```

### 2. Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run install:all
```

Or install them separately:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Environment Setup

#### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/resumecraft

# JWT Configuration
# Generate strong secrets using: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_super_secret_jwt_access_key_minimum_32_characters_long
JWT_REFRESH_SECRET=your_super_secret_jwt_refresh_key_minimum_32_characters_long
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_RESUME_MODEL=gpt-4o-mini

# Cloudinary Configuration (Required for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Client Configuration
CLIENT_URL=http://localhost:3000

# Optional: Error Tracking (Sentry)
SENTRY_DSN=your_sentry_dsn_here
```

#### Frontend Environment Variables

Create a `.env.development` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=ResumeCraft
VITE_APP_VERSION=1.0.0
```

### 4. Database Setup

#### Local MongoDB

1. Install MongoDB locally or use Docker:
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

2. Update `MONGODB_URI` in your `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/resumecraft
   ```

#### MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resumecraft
   ```

### 5. Start the Application

#### Development Mode

Start both backend and frontend simultaneously:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

#### Production Mode

```bash
npm run build
npm start
```

## Docker Setup

### Using Docker Compose

1. Create a `.env` file in the root directory with all required environment variables (see backend `.env` example above)

2. Start all services:
   ```bash
   docker-compose up -d
   ```

3. Check service health:
   ```bash
   docker-compose ps
   ```

4. View logs:
   ```bash
   docker-compose logs -f backend
   ```

## Testing

### Backend Tests

```bash
cd backend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Health Check

Check if the backend is running:

```bash
curl http://localhost:5000/health
```

Or use the npm script:

```bash
cd backend
npm run health-check
```

## Troubleshooting

### MongoDB Connection Issues

- Ensure MongoDB is running: `mongosh` or check Docker container
- Verify `MONGODB_URI` is correct in `.env`
- Check firewall settings if using MongoDB Atlas

### Port Already in Use

- Change `PORT` in backend `.env` file
- Update `VITE_API_URL` in frontend `.env.development` accordingly

### JWT Secret Errors

- Ensure JWT secrets are at least 32 characters long
- Generate new secrets: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### File Upload Issues

- Verify Cloudinary credentials are correct
- Check file size limits (default: 10MB for resumes)

## Additional Resources

- [MongoDB Setup Guide](https://docs.mongodb.com/manual/installation/)
- [Cloudinary Setup](docs/CLOUDINARY_SMTP_SETUP.md)
- [OAuth Setup](OAUTH_SETUP.md)

## Support

For issues or questions, please open an issue on GitHub.

