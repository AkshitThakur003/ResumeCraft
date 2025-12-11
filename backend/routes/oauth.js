// 🟡 OAuth integration - OAuth routes
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const {
  getEnabledProviders,
  findEnabledProvider,
  getProviderSummaries,
} = require('../config/oauthProviders');
const { authRateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const getFrontendUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000';

router.get('/providers', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const providers = getProviderSummaries(baseUrl);

  res.json({
    success: true,
    data: providers,
  });
});

router.use((req, res, next) => {
  if (!getEnabledProviders().length) {
    return res.status(503).json({
      success: false,
      message: 'OAuth is not configured. Please set provider environment variables.',
    });
  }
  next();
});

router.param('provider', (req, res, next, providerKey) => {
  const provider = findEnabledProvider(providerKey);
  if (!provider) {
    return res.status(404).json({
      success: false,
      message: `OAuth provider '${providerKey}' is not supported.`,
    });
  }
  req.oauthProvider = provider;
  next();
});

router.get('/:provider', authRateLimit, (req, res, next) => {
  const provider = req.oauthProvider;
  return passport.authenticate(provider.key, {
    scope: provider.scope,
    session: false,
  })(req, res, next);
});

router.get('/:provider/callback', authRateLimit,
  (req, res, next) => {
    const provider = req.oauthProvider;
    const frontendUrl = getFrontendUrl();
    return passport.authenticate(provider.key, {
      failureRedirect: `${frontendUrl}/login?error=oauth_failed&provider=${provider.key}`,
      session: false,
    })(req, res, next);
  },
  async (req, res) => {
    try {
      if (!process.env.JWT_OAUTH_CODE_SECRET) {
        throw new Error('Missing JWT_OAUTH_CODE_SECRET');
      }

      if (!req.user.isActive) {
const frontendUrl = getFrontendUrl();
        return res.redirect(`${frontendUrl}/login?error=account_deactivated&provider=${req.oauthProvider.key}`);
      }

      req.user.lastLogin = new Date();
      await req.user.save();

      const oauthCode = jwt.sign(
        { userId: req.user._id, provider: req.oauthProvider.key },
        process.env.JWT_OAUTH_CODE_SECRET,
        { expiresIn: '2m' }
      );

      const frontendUrl = getFrontendUrl();
      res.redirect(`${frontendUrl}/oauth-success?code=${oauthCode}&provider=${req.oauthProvider.key}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = getFrontendUrl();
      const providerKey = req.oauthProvider?.key;
      res.redirect(`${frontendUrl}/login?error=oauth_callback_failed${providerKey ? `&provider=${providerKey}` : ''}`);
    }
  }
);

module.exports = router;
