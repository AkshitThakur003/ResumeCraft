# Sentry Error Tracking Setup Guide

Sentry provides real-time error tracking and monitoring for your application. It's **optional but highly recommended** for production.

---

## 🚀 Quick Setup

### 1. Create Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (or sign in if you have one)
3. Create a new project:
   - Select **React** for the frontend
   - Select **Node.js** for the backend

### 2. Get Your DSN (Data Source Name)

After creating a project, Sentry will show you a DSN that looks like:
```
https://abc123def456@o123456.ingest.sentry.io/1234567
```

Copy this DSN - you'll need it for configuration.

---

## 🔧 Backend Configuration

### 1. Update `backend/.env`

Add your Sentry DSN:

```env
# Error Tracking (Optional - Sentry)
SENTRY_DSN=https://your-dsn-here@o123456.ingest.sentry.io/1234567
```

### 2. Verify Backend Integration

The backend already has Sentry integrated in:
- `backend/utils/errorTracker.js`
- `backend/middleware/errorHandler.js`

No code changes needed! Just set the environment variable.

### 3. Test Backend Error Tracking

The backend will automatically capture:
- Unhandled exceptions
- API errors (500+)
- Database connection errors
- Authentication errors

---

## 🎨 Frontend Configuration

### 1. Create Frontend Project in Sentry

1. In Sentry dashboard, create a new project
2. Select **React** as the platform
3. Copy the DSN

### 2. Update `frontend/.env.production`

Create or edit `frontend/.env.production`:

```env
# Error Tracking (Optional - Sentry)
VITE_SENTRY_DSN=https://your-frontend-dsn-here@o123456.ingest.sentry.io/1234567
VITE_ENABLE_SENTRY=false  # Set to true to enable in development
```

### 3. For Development (Optional)

If you want to test Sentry in development, create `frontend/.env.development`:

```env
VITE_SENTRY_DSN=https://your-frontend-dsn-here@o123456.ingest.sentry.io/1234567
VITE_ENABLE_SENTRY=true  # Enable in development for testing
```

### 4. Verify Frontend Integration

The frontend Sentry integration is already set up in:
- `frontend/src/utils/sentry.js`
- `frontend/src/main.jsx`
- `frontend/src/components/ErrorBoundary.jsx`
- `frontend/src/utils/api.js`

No code changes needed! Just set the environment variables.

---

## 🧪 Testing Sentry

### Test Backend Error Tracking

1. **Trigger a test error** (temporarily):
   ```javascript
   // In any backend route handler
   throw new Error('Test Sentry error');
   ```

2. **Check Sentry dashboard** - you should see the error appear within seconds

### Test Frontend Error Tracking

1. **Trigger a test error** (in browser console):
   ```javascript
   // In browser console
   throw new Error('Test Sentry error');
   ```

2. **Or trigger an API error**:
   - Make a request to a non-existent endpoint
   - Check Sentry for the error

---

## 📊 What Gets Tracked

### Backend
- ✅ Unhandled exceptions
- ✅ API errors (500+)
- ✅ Database errors
- ✅ Authentication failures
- ✅ Rate limit violations
- ✅ OpenAI API errors

### Frontend
- ✅ React component errors (ErrorBoundary)
- ✅ API errors (500+)
- ✅ Network errors
- ✅ Unhandled promise rejections
- ✅ JavaScript runtime errors

---

## 🔒 Security & Privacy

### Sensitive Data Filtering

Sentry is configured to automatically filter:
- ✅ Authentication tokens
- ✅ Passwords
- ✅ API keys
- ✅ Personal information

### What's NOT Sent to Sentry

- Request bodies (only metadata)
- Full stack traces in production (sanitized)
- User passwords or tokens
- Database connection strings

---

## 📈 Sentry Features

### Free Tier Includes:
- ✅ 5,000 errors/month
- ✅ 10,000 performance units/month
- ✅ 1 project
- ✅ 30-day error history
- ✅ Email alerts

### Paid Features (Optional):
- More errors/performance units
- Multiple projects
- Longer retention
- Advanced analytics
- Team collaboration

---

## 🎯 Best Practices

1. **Use Different DSNs** for frontend and backend
2. **Set up Alerts** for critical errors
3. **Review Errors Regularly** to catch issues early
4. **Use Tags** to categorize errors (already configured)
5. **Set Release Versions** to track which version has errors

---

## 🔍 Viewing Errors

1. **Go to Sentry Dashboard**: [https://sentry.io](https://sentry.io)
2. **Select your project**
3. **View Issues** tab to see all errors
4. **Click on an error** to see:
   - Stack trace
   - User information
   - Browser/device info
   - Request details
   - Timeline

---

## 🚨 Troubleshooting

### Errors not appearing in Sentry?

1. **Check DSN is correct** in environment variables
2. **Verify environment variables are loaded** (restart server)
3. **Check Sentry project settings** - make sure it's active
4. **Check browser console** for Sentry initialization errors
5. **Verify network** - Sentry needs internet connection

### Too many errors?

1. **Set up filters** in Sentry to ignore known issues
2. **Use ignoreErrors** (already configured in code)
3. **Adjust sample rate** for performance monitoring

---

## ✅ Verification Checklist

- [ ] Sentry account created
- [ ] Backend project created in Sentry
- [ ] Frontend project created in Sentry
- [ ] Backend DSN added to `backend/.env`
- [ ] Frontend DSN added to `frontend/.env.production`
- [ ] Test error triggered and appears in Sentry
- [ ] Alerts configured (optional)

---

## 📚 Additional Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [React Error Tracking](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Node.js Error Tracking](https://docs.sentry.io/platforms/node/)

---

**Next Steps:**
1. Create Sentry account
2. Create projects (frontend + backend)
3. Add DSNs to environment files
4. Restart your servers
5. Test error tracking
6. Set up alerts for critical errors

