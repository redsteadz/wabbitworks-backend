const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const env = require('./config/env');
const { db } = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

const frontendOrigin = env.frontendUrl || 'http://localhost:5173';

app.use(helmet());
app.use(hpp());
app.use(
  cors({
    origin: frontendOrigin,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

if (env.isDevelopment) {
  app.use(morgan('dev'));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

const pgConnectionString = env.database.url
  ? env.database.url
  : `postgres://${env.database.user}:${env.database.password}@${env.database.host}:${env.database.port}/${env.database.name}`;

app.use(
  session({
    store: new pgSession({
      conString: pgConnectionString,
      tableName: 'session',
    }),
    name: 'wabbitworks.sid',
    secret: env.session.secret || 'dev-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.isProduction,
      maxAge: env.session.maxAge,
    },
  })
);

app.get('/api/health', async (req, res) => {
  const result = await db.raw('SELECT 1');
  res.json({ status: 'ok', db: result ? 'connected' : 'unknown' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
