/**
 * Controller Mock API External & Integration Test Handler
 */
const { HealthcareHttpClient } = require('../services/httpClient');
const logger = require('../utils/logger');

// Counter percobaan request ke mock endpoint (untuk simulasi retry)
let mockCallCount = 0;

/**
 * Mock Endpoint External Hospital Referral API
 * HTTP POST /api/mock/external-hospital
 */
function mockExternalHospitalEndpoint(req, res) {
  mockCallCount++;
  logger.info(`[MockExternalAPI] Request diterima (Percobaan #${mockCallCount})`);

  const authHeader = req.headers['authorization'];
  const simulateError = req.headers['x-simulate-error'] || req.query.force_error;
  const simulateTimeout = req.headers['x-simulate-timeout'] === 'true';
  const failAttempts = parseInt(req.query.fail_first_n_times || '0', 10);

  // 1. Cek Auth Header
  if (!authHeader || authHeader !== 'Bearer external-secret-key') {
    return res.status(401).json({
      success: false,
      message: 'Mock External Error: Bearer token invalid or missing'
    });
  }

  // 2. Simulasi Timeout jika diminta
  if (simulateTimeout) {
    logger.warn('[MockExternalAPI] Mensimulasikan timeout (delay 6 detik)');
    return setTimeout(() => {
      res.status(504).json({ success: false, message: 'Gateway Timeout' });
    }, 6000);
  }

  // 3. Simulasi Server Error sementara (misal fail 2 kali pertama, ke-3 sukses)
  if (failAttempts > 0 && mockCallCount <= failAttempts) {
    logger.warn(`[MockExternalAPI] Mensimulasikan Server Error 500 (Percobaan ${mockCallCount}/${failAttempts})`);
    return res.status(500).json({
      success: false,
      message: `Mock Server Error 500 (Simulasi transient failure ${mockCallCount})`
    });
  }

  // 4. Simulasi Server Error permanen jika dipaksa
  if (simulateError === '500') {
    return res.status(500).json({
      success: false,
      message: 'Mock Server Error 500 Internal Server Error'
    });
  }

  // Sukses
  return res.status(200).json({
    success: true,
    message: 'Rujukan pasien berhasil diterima oleh Rumah Sakit Rujukan Mock',
    referral_code: `REF-HOSP-${Date.now()}`,
    received_data: req.body
  });
}

/**
 * Controller internal untuk memicu HTTP Client dengan Retry & Backoff
 * HTTP POST /api/send-referral
 */
async function sendReferralExternal(req, res) {
  const { targetUrl, token, patient_data, options } = req.body;

  const port = process.env.PORT || 3000;
  const baseUrl = targetUrl || `http://localhost:${port}`;
  const authToken = token || 'external-secret-key';

  const client = new HealthcareHttpClient({
    baseURL: baseUrl,
    token: authToken,
    timeout: (options && options.timeout) || 3000,
    maxRetries: (options && options.maxRetries) || 3,
    initialDelayMs: (options && options.initialDelayMs) || 100
  });

  logger.info('[SendReferral] Mengirim rujukan ke external API...');

  const result = await client.post('/api/mock/external-hospital', patient_data || { nama: 'Pasien Test' }, {
    headers: options && options.headers ? options.headers : {}
  });

  if (result.success) {
    return res.status(200).json({
      success: true,
      message: 'Pengiriman rujukan eksternal sukses',
      attempts: result.attempts,
      external_response: result.data
    });
  } else {
    return res.status(result.status || 500).json({
      success: false,
      message: 'Gagal mengirim rujukan eksternal setelah retry',
      isAuthError: result.isAuthError,
      isServerError: result.isServerError,
      external_error: result.error
    });
  }
}

function resetMockCallCount() {
  mockCallCount = 0;
}

function getMockCallCount() {
  return mockCallCount;
}

module.exports = {
  mockExternalHospitalEndpoint,
  sendReferralExternal,
  resetMockCallCount,
  getMockCallCount
};
