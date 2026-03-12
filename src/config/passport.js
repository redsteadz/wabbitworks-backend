const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
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