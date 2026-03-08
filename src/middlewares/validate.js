const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map((detail) => detail.message).join(', ');
    return next(ApiError.badRequest(details));
  }
  req.body = value;
  return next();
};

module.exports = validate;
