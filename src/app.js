const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const hpp = require('hpp');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const env = require('./config/env');
const swaggerSpec = require('./config/swagger');
const { buildPostmanCollection, sendJsonDocument } = require('./utils/swagger-export');
const { createSessionMiddleware } = require('./config/session');
const { configurePassport } = require('./config/passport');
const routes = require('./routes');
const { errorConverter, errorHandler, notFound } = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { sessionMetadataMiddleware } = require('./config/session');
const SWAGGER_UI_VERSION = '5.31.0';
/**
 * Initialize Express application
 */
const createApp = () => {
  // Initialize Express app
  const app = express();
  const shouldDownload = (req) => ['1', 'true', 'yes'].includes(String(req.query.download || '').toLowerCase());

  // Trust proxy (required for secure cookies behind a proxy like Heroku/Render)
  if (env.isProduction) {
    app.set('trust proxy', 1);
  }

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Add cdnjs.cloudflare.com to styleSrc and scriptSrc
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", env.isProduction ? env.frontendUrl : "http://localhost:5173"]
      },
    },
  }));

  // CORS configuration
  const allowedOrigins = Array.from(new Set([
    env.frontendUrl,
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean)));

  app.use(cors({
    origin: allowedOrigins,
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Request logging
  if (env.isDevelopment) {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Serve uploaded avatars
  app.use('/uploads', (req, res, next) => {
    // Allow the frontend to embed avatar images served from the API origin.
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Rate limiting
  if (env.isProduction) {
    app.use('/api', apiLimiter);
  }

  // Session middleware
  app.use(createSessionMiddleware());

  // Passport initialization
  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(sessionMetadataMiddleware);

  // SWAGGER DOCUMENTATION
  const swaggerOptions = {
    explorer: true,
    // Fix for Vercel: Load assets from CDN
    customCssUrl: `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_UI_VERSION}/swagger-ui.min.css`,
    customJs: [
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_UI_VERSION}/swagger-ui-bundle.js`,
      `https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js`,
    ],
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #3b82f6 }
      .swagger-ui .wrapper { padding: 0 }
    `,
    customSiteTitle: 'Team Task Manager API Docs',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  };

  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerOptions)
  );
  // Serve OpenAPI spec as JSON
  app.get('/api/docs.json', (req, res) => {
    sendJsonDocument(
      res,
      swaggerSpec,
      'team-task-manager.openapi.json',
      shouldDownload(req)
    );
  });

  app.get('/api/docs/postman.json', (req, res) => {
    sendJsonDocument(
      res,
      buildPostmanCollection(swaggerSpec),
      'team-task-manager.postman_collection.json',
      shouldDownload(req)
    );
  });
  
  // API routes
  app.use('/api', routes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Team Task Manager API',
      version: '1.0.0',
      documentation: '/api/docs',
    });
  });

  // Handle 404
  app.use(notFound);

  // Error handling
  app.use(errorConverter);
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
