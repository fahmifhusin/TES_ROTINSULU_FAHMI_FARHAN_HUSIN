const express = require('express');
const patientRoutes = require('./routes/patientRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const mockRoutes = require('./routes/mockRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const app = express();

// Middleware Parsing Body
app.use(express.json()); // read json request from FE
app.use(express.urlencoded({ extended: true }));

// Logging Middleware
app.use((req, res, next) => {
  logger.info(`[HTTP] ${req.method} ${req.url}`);
  next();
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Sistem Informasi Layanan Kesehatan Active',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/patients', patientRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/mock', mockRoutes);

// Error Handling
app.use(notFoundHandler); //404
app.use(errorHandler); //500

module.exports = app;
