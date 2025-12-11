const nodemailer = require('nodemailer');

let transporterCache;

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    console.warn('Email transport is not configured. Set SMTP_HOST and SMTP_PORT to enable emails.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    } : undefined,
  });
};

const getTransporter = () => {
  if (transporterCache === undefined) {
    transporterCache = createTransporter();
  }
  return transporterCache;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();

  if (!transporter) {
    console.log('[Email disabled]', { to, subject });
    return;
  }

  const fromAddress = process.env.EMAIL_FROM || 'no-reply@resumecraft.app';

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
};

