require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  
  // Database
  database: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    url: process.env.DATABASE_URL,
  },
  
  // Session
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: parseInt(process.env.SESSION_MAX_AGE, 10) || 24 * 60 * 60 * 1000, // 24 hours
  },
  
  // CORS
  frontendUrl: process.env.FRONTEND_URL,
  
  // Bcrypt
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  
  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

module.exports = env;