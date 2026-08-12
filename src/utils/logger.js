/**
 * Logger utility sederhana untuk aplikasi layanan kesehatan.
 * Mendukung level INFO, WARN, ERROR, DEBUG dengan format timestamp.
 */

function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

const logger = {
  info: (message, meta = '') => {
    console.log(`[${getTimestamp()}] [INFO] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (message, meta = '') => {
    console.warn(`[${getTimestamp()}] [WARN] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  error: (message, meta = '') => {
    console.error(`[${getTimestamp()}] [ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
  },
  debug: (message, meta = '') => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[${getTimestamp()}] [DEBUG] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
};

module.exports = logger;
