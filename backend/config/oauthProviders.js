const GoogleStrategy = require('passport-google-oauth20').Strategy;
const logger = require('../utils/logger');

const getDisplayNameParts = (profile) => {
  const givenName = profile?.name?.givenName;
  const familyName = profile?.name?.familyName;

  if (givenName || familyName) {
    return {
      firstName: givenName || 'User',
      lastName: familyName || '',
    };
  }

  const displayName = profile?.displayName || 'User';
  const [firstName, ...rest] = displayName.split(' ');
  return {
    firstName: firstName || 'User',
    lastName: rest.join(' '),
  };
};

/**
 * Get OAuth callback URL
 * In production, requires GOOGLE_CALLBACK_URL to be set
 * In development, constructs from environment or uses localhost fallback
 */
const getGoogleCallbackURL = () => {
  // If explicitly set, use it
  if (process.env.GOOGLE_CALLBACK_URL) {
    return process.env.GOOGLE_CALLBACK_URL;
  }

  const isProduction = process.env.NODE_ENV === 'production';

  // In production, require explicit callback URL
  if (isProduction) {
    logger.error('❌ GOOGLE_CALLBACK_URL must be set in production environment');
    throw new Error('GOOGLE_CALLBACK_URL environment variable is required in production');
  }

  // In development, construct from available environment variables
  const apiUrl = process.env.API_URL || process.env.BACKEND_URL;
  if (apiUrl) {
    return `${apiUrl}/auth/google/callback`;
  }

  // Development fallback: use CLIENT_URL or default localhost
  const clientUrl = process.env.CLIENT_URL;
  if (clientUrl) {
    // Extract protocol and host from CLIENT_URL, use backend port
    try {
      const url = new URL(clientUrl);
      const port = process.env.PORT || '5000';
      return `${url.protocol}//${url.hostname}:${port}/auth/google/callback`;
    } catch {
      // If CLIENT_URL is invalid, fall through to default
    }
  }

  // Last resort: development localhost fallback
  const port = process.env.PORT || '5000';
  const fallbackUrl = `http://localhost:${port}/auth/google/callback`;
  logger.warn(`⚠️  Using default OAuth callback URL: ${fallbackUrl}`);
  logger.warn('   Set GOOGLE_CALLBACK_URL environment variable to override');
  return fallbackUrl;
};

const providers = [
  {
    key: 'google',
    name: 'Google',
    icon: 'google',
    Strategy: GoogleStrategy,
    scope: ['profile', 'email'],
    enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    getStrategyOptions: () => {
      const callbackURL = getGoogleCallbackURL();
      return {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
      };
    },
    mapProfile: (profile) => {
      const email = profile?.emails?.[0]?.value;
      const { firstName, lastName } = getDisplayNameParts(profile);
      const photo = profile?.photos?.[0]?.value;

      return {
        id: profile.id,
        email,
        firstName,
        lastName,
        avatarUrl: photo,
      };
    },
  },
];

const getEnabledProviders = () => providers.filter((provider) => provider.enabled);

const findEnabledProvider = (key) => getEnabledProviders().find((provider) => provider.key === key);

const getProviderSummaries = (baseUrl) =>
  getEnabledProviders().map((provider) => ({
    id: provider.key,
    name: provider.name,
    icon: provider.icon,
    authUrl: `${baseUrl}/auth/${provider.key}`,
  }));

module.exports = {
  providers,
  getEnabledProviders,
  findEnabledProvider,
  getProviderSummaries,
};
