const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`========================================================`);
  logger.info(` Server Sistem Informasi Layanan Kesehatan Rotinsulu`);
  logger.info(` on: http://localhost:${PORT}`);
  logger.info(` cek kesehatan: http://localhost:${PORT}/api/health`);
  logger.info(`========================================================`);
});
