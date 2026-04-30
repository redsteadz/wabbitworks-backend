const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { Pool } = require('pg');
const env = require('./env');

/**
 * Parse user agent to extract device info
 */
const parseUserAgent = (userAgent) => {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }

  let deviceType = 'desktop';
  if (/mobile/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (/tablet|ipad/i.test(userAgent)) {
    deviceType = 'tablet';
  }

  let browser = 'unknown';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = 'Safari';
  } else if (/edge/i.test(userAgent)) {
    browser = 'Edge';
  } else if (/msie|trident/i.test(userAgent)) {
    browser = 'Internet Explorer';
  }

  let os = 'unknown';
  if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = 'macOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  }

  return { deviceType, browser, os };
};

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
      secure: env.isProduction,
      httpOnly: true,
      maxAge: env.session.maxAge,
      sameSite: env.isProduction ? 'none' : 'lax',
    },
  };

  // Use PostgreSQL session store in production/staging
  if (!env.isDevelopment) {
    const pgPool = new Pool({
      connectionString: env.database.url,
      ssl: env.isProduction ? { rejectUnauthorized: false } : false,
    });

    sessionConfig.store = new PgSession({
      pool: pgPool,
      tableName: 'session',
      createTableIfMissing: false,
    });

    console.log('Using PostgreSQL session store');
  } else {
    console.log('Using in-memory session store (development only)');
  }

  return session(sessionConfig);
};

/**
 * Middleware to track session metadata
 */
const sessionMetadataMiddleware = (req, res, next) => {
  if (req.session && req.user) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const { deviceType, browser, os } = parseUserAgent(userAgent);

    // Store metadata in session
    req.session.metadata = {
      userId: req.user.id,
      ipAddress,
      userAgent,
      deviceType,
      browser,
      os,
    };
  }
  next();
};

module.exports = { 
  createSessionMiddleware, 
  sessionMetadataMiddleware,
  parseUserAgent,
};