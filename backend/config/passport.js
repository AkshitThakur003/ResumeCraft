// 🟡 OAuth integration - Passport configuration
const passport = require('passport');
const User = require('../models/User');
const { getEnabledProviders } = require('./oauthProviders');

const enabledProviders = getEnabledProviders();

if (!enabledProviders.length) {
  console.warn('OAuth providers are not configured. Set provider credentials to enable social login.');
}

enabledProviders.forEach((provider) => {
  const strategyOptions = provider.getStrategyOptions?.();

  if (!strategyOptions) {
    console.warn(`Skipping OAuth provider "${provider.key}" due to missing configuration.`);
    return;
  }

  const Strategy = provider.Strategy;

  const strategy = new Strategy(strategyOptions, async (accessToken, refreshToken, profile, done) => {
    try {
      const mappedProfile = provider.mapProfile ? provider.mapProfile(profile) : {};
      const email = mappedProfile.email;

      if (!email) {
        return done(new Error(`Unable to retrieve email from ${provider.name} profile`));
      }

      let user = await User.findOne({
        oauthProvider: provider.key,
        oauthId: mappedProfile.id || profile.id,
      });

      if (user) {
        return done(null, user);
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        existingUser.oauthProvider = provider.key;
        existingUser.oauthId = mappedProfile.id || profile.id;
        if (!existingUser.profilePicture?.url && mappedProfile.avatarUrl) {
          existingUser.profilePicture = existingUser.profilePicture || {};
          existingUser.profilePicture.url = mappedProfile.avatarUrl;
        }
        if (!existingUser.isEmailVerified) {
          existingUser.isEmailVerified = true;
          existingUser.emailVerifiedAt = new Date();
        }
        await existingUser.save();
        return done(null, existingUser);
      }

      user = await User.create({
        firstName: mappedProfile.firstName || 'User',
        lastName: mappedProfile.lastName || '',
        email,
        oauthProvider: provider.key,
        oauthId: mappedProfile.id || profile.id,
        profilePicture: mappedProfile.avatarUrl ? { url: mappedProfile.avatarUrl } : undefined,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });

      return done(null, user);
    } catch (error) {
      console.error(`${provider.name} OAuth error:`, error);
      return done(error, null);
    }
  });

  strategy.name = provider.key;
  passport.use(strategy);
});

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
