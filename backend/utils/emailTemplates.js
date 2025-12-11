const buildVerificationEmail = ({ firstName, verifyUrl }) => {
  const safeName = firstName || 'there';

  return {
    subject: 'Verify your ResumeCraft email address',
    text: `Hi ${safeName},\n\nThanks for signing up for ResumeCraft!\n\nPlease confirm your email by visiting: ${verifyUrl}\n\nIf you did not create an account, ignore this email.\n`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Welcome to ResumeCraft, ${safeName}!</h2>
        <p>Thanks for signing up. To start using your account, please confirm your email address.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Verify Email Address
          </a>
        </p>
        <p>If the button above doesn\'t work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;"><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p style="color: #6b7280; font-size: 12px;">If you did not create a ResumeCraft account, you can safely ignore this email.</p>
      </div>
    `,
  };
};

const buildPasswordResetEmail = ({ firstName, resetUrl }) => {
  const safeName = firstName || 'there';

  return {
    subject: 'Reset your ResumeCraft password',
    text: `Hi ${safeName},\n\nWe received a request to reset your ResumeCraft password.\n\nReset your password by visiting: ${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Password reset requested</h2>
        <p>Hi ${safeName},</p>
        <p>We received a request to reset your ResumeCraft password. Use the button below to set a new password. This link will expire in 1 hour.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px;">
            Reset password
          </a>
        </p>
        <p>If the button above doesn\'t work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color: #6b7280; font-size: 12px;">If you did not request this change, you can safely ignore this email. Your password will remain the same.</p>
      </div>
    `,
  };
};

module.exports = {
  buildVerificationEmail,
  buildPasswordResetEmail,
};

