/**
 * Middleware untuk validasi Bearer Token.
 */
const logger = require('../utils/logger');

const VALID_TOKEN = process.env.API_BEARER_TOKEN || 'secret-health-token-123';

function authenticateBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    logger.warn(`[AuthMiddleware] Request ditolak: Header Authorization tidak ditemukan (${req.originalUrl})`);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Header Authorization tidak ditemukan. Silakan berikan Bearer Token.'
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn(`[AuthMiddleware] Request ditolak: Format Authorization salah (${authHeader})`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Format header harus 'Bearer <token>'"
    });
  }

  const token = parts[1];
  if (token !== VALID_TOKEN) {
    logger.warn(`[AuthMiddleware] Request ditolak: Token tidak valid (${token})`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Token tidak valid atau tidak memiliki akses.'
    });
  }

  req.user = { role: 'admin', token };
  next();
}

module.exports = {
  authenticateBearerToken,
  VALID_TOKEN
};
