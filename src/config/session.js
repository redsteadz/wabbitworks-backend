const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const env = require('./env');

/**
 * Creates and configures the session middleware
 * Uses PostgreSQL store in production, memory store in development
 */
const createSessionMiddleware = () => {
  const sessionConfig = {
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId',
    cookie: {
      secure: env.isProduction, // Only send cookie over HTTPS in production
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      maxAge: env.session.maxAge,
      sameSite: env.isProduction ? 'none' : 'lax', // Required for cross-site cookies
    },
  };

  // Use PostgreSQL session store in production/staging, memory in development
  if (!env.isDevelopment) {
    const pgPool = new Pool({
      connectionString: env.database.url,
      ssl: env.isProduction
        ? { rejectUnauthorized: false }
        : false,
    });

    sessionConfig.store = new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: false, // We create it via migration
    });

    console.log('Using PostgreSQL session store');
  } else {
    console.log('Using in-memory session store (development only)');
  }

  return session(sessionConfig);
};

module.exports = { createSessionMiddleware };