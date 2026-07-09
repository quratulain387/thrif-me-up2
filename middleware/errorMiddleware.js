// middleware/errorMiddleware.js
// Centralized error handling so controllers don't repeat try/catch boilerplate.

// Handles requests to routes that don't exist
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Catches all errors passed via next(error) and formats a clean JSON response
const errorHandler = (err, req, res, next) => {
  // Sometimes an error comes in with a 200 status by mistake — force 500 in that case
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Handle common Mongoose errors with friendlier messages
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development, never in production
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
