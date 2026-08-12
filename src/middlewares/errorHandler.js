/**
 * Global Error Handling Middleware untuk Express REST API
 */
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`[ErrorHandler] ${err.message}`, err.stack);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server',
    errors: err.errors || []
  });
}

function notFoundHandler(req, res) {
  logger.warn(`[NotFound] Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
