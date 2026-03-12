const sanitizeHtml = require('sanitize-html');
const ApiError = require('../utils/ApiError');

/**
 * Middleware factory for validating request body/query/params using Joi
 * @param {Object} schema - Joi schema object with optional body, query, params keys
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Return all errors, not just the first
      allowUnknown: true, // Allow unknown keys that will be removed
      stripUnknown: true, // Remove unknown keys from the validated data
    };

    const errors = [];

    // Validate body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.body = value;
      }
    }

    // Validate query
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.query = value;
      }
    }

    // Validate params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details.map((d) => d.message));
      } else {
        req.params = value;
      }
    }

    if (errors.length > 0) {
      throw ApiError.badRequest(errors.join(', '));
    }

    next();
  };
};

/**
 * Middleware to sanitize request body to prevent XSS
 */
const sanitize = (req, res, next) => {
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {},
      });
    }
    if (Array.isArray(value)) {
      return value.map(sanitizeValue);
    }
    if (value && typeof value === 'object') {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = sanitizeValue(value[key]);
      }
      return sanitized;
    }
    return value;
  };

  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  next();
};

module.exports = {
  validate,
  sanitize,
};