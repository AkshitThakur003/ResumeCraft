# Cloudinary & SMTP Setup Guide

## Cloudinary Setup (File Uploads)

Cloudinary handles profile picture and resume file uploads.

### Step 1: Create Account
1. Go to [cloudinary.com](https://cloudinary.com) and sign up (free tier available)
2. Verify your email

### Step 2: Get Credentials
1. Go to **Dashboard** after login
2. Find your credentials in the "Product Environment Credentials" section:
   - **Cloud Name**: Your unique cloud identifier
   - **API Key**: Public key
   - **API Secret**: Private key (click "Reveal" to see)

### Step 3: Add to .env
`env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your-api-secret-here
`

### Free Tier Limits
- 25 credits/month (~25GB storage or 25GB bandwidth)
- Sufficient for development and small projects

---

## SMTP Setup (Email Verification)

SMTP is used for sending verification emails and password resets.

### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account
2. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and your device, then click "Generate"
4. Copy the 16-character password

`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
EMAIL_FROM=your-email@gmail.com
`

### Option B: Mailtrap (Testing)

Great for testing without sending real emails.

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Create an inbox
3. Go to SMTP Settings and copy credentials

`env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
EMAIL_FROM=no-reply@resumecraft.app
`

### Option C: SendGrid / Mailgun (Production)

For production, use a dedicated email service:
- [SendGrid](https://sendgrid.com) - 100 emails/day free
- [Mailgun](https://mailgun.com) - 5,000 emails/month free

---

## Testing Your Setup

### Test Cloudinary
Upload a profile picture in the app. Check Cloudinary dashboard for the uploaded file.

### Test SMTP
Register a new account. You should receive a verification email.

---

## Troubleshooting

### Cloudinary
- **401 Error**: Check API key/secret are correct
- **Upload fails**: Verify cloud name is correct

### SMTP/Gmail
- **Authentication failed**: Use App Password, not your regular password
- **Connection refused**: Check SMTP_PORT (587 for TLS, 465 for SSL)
- **Less secure apps**: Don't use this; use App Passwords instead
