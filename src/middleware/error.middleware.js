const env = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Convert non-ApiError errors to ApiError
 */
const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // In production, don't expose internal errors
  if (env.isProduction && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  // Log error
  if (env.isDevelopment || !err.isOperational) {
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    status: err.status,
    message,
    ...(env.isDevelopment && { stack: err.stack }),
  });
};

/**
 * Handle 404 for unmatched routes
 */
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Cannot ${req.method} ${req.originalUrl}`));
};

module.exports = {
  errorConverter,
  errorHandler,
  notFound,
};