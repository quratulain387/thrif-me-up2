// middleware/asyncHandler.js
// Wraps async controller functions so any thrown error / rejected promise
// is automatically passed to Express's error handler (errorMiddleware.js)
// instead of needing try/catch in every single controller.

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
