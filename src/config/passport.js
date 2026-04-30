const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const env = require('./env');
const userService = require('../modules/users/user.service');
const { comparePassword } = require('../utils/bcrypt');

/**
 * Configure Passport.js with Local Strategy
 */
const configurePassport = () => {
  // Local Strategy for email/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // Find user by email
          const user = await userService.findByEmail(email);
          
          if (!user) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Check if user is active
          if (!user.is_active) {
            return done(null, false, { message: 'Account is deactivated' });
          }

          // Verify password
          if (!user.password) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          const isValidPassword = await comparePassword(password, user.password);
          
          if (!isValidPassword) {
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Update last login
          await userService.updateLastLogin(user.id);

          // Return user without password
          const { password: _, ...userWithoutPassword } = user;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.google.clientId,
        clientSecret: env.google.clientSecret,
        callbackURL: env.google.callbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const avatarUrl = profile.photos?.[0]?.value || null;
          const firstName = profile.name?.givenName || 'Google';
          const lastName = profile.name?.familyName || 'User';

          if (!email) {
            return done(null, false, { message: 'Google account email is required' });
          }

          // 1. Try to find user by Google ID
          let user = await userService.findByGoogleId(profile.id);

          if (user) {
            if (!user.is_active) {
              return done(null, false, { message: 'Account is deactivated' });
            }

            // Update last login
            await userService.updateLastLogin(user.id);
            const { password: _, ...userWithoutPassword } = user;
            return done(null, userWithoutPassword);
          }

          // 2. If not found by Google ID, try to find by email
          user = await userService.findByEmail(email);

          if (user) {
            if (!user.is_active) {
              return done(null, false, { message: 'Account is deactivated' });
            }

            // User exists, link Google ID to the account
            const updatedUser = await userService.update(user.id, {
              google_id: profile.id,
              avatar_url: avatarUrl || user.avatar_url,
            });

            // Update last login
            await userService.updateLastLogin(updatedUser.id);
            const { password: _, ...userWithoutPassword } = updatedUser;
            return done(null, userWithoutPassword);
          }

          // 3. User does not exist, create a new account
          const newUser = await userService.create({
            email,
            google_id: profile.id,
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            email_verified: true, // Google emails are already verified
            is_active: true,
          });

          // Update last login
          await userService.updateLastLogin(newUser.id);
          const { password: _, ...userWithoutPassword } = newUser;
          return done(null, userWithoutPassword);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Serialize user to session (store only user id)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await userService.findById(id);
      
      if (!user) {
        return done(null, false);
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      done(null, userWithoutPassword);
    } catch (error) {
      done(error);
    }
  });

  return passport;
};

module.exports = { configurePassport, passport };
