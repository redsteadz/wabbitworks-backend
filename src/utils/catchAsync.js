/**
 * Wrapper function to catch async errors and pass to error handler
 * Eliminates the need for try-catch blocks in controllers
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;