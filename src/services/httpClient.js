/**
 * HTTP Client Service menggunakan Axios.
 * Mendukung:
 * 1. Bearer Token Authentication
 * 2. Custom Timeout
 * 3. Logging & Detailed Error Handling
 * 4. Selective Retry dengan Exponential Backoff
 *    - Hanya melakukan retry pada Error 5xx / Network Timeout / ECONNABORTED
 *    - TIDAK melakukan retry pada Client Error 4xx (Auth failure 401/403, Bad Request 400, 404, dll)
 */

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Menentukan apakah error layak untuk di-retry.
 * @param {Error} error Axios error object
 * @returns {boolean}
 */
function isRetryableError(error) {
  // Jika tidak ada response, kemungkinan network error atau timeout
  if (!error.response) {
    return true; // Network error, ECONNABORTED, ETIMEDOUT
  }

  const status = error.response.status;

  // Retry pada HTTP Status 5xx (Server Error) atau 429 (Too Many Requests)
  if (status >= 500 || status === 429) {
    return true;
  }

  // JANGAN retry pada HTTP Status 4xx (400, 401, 403, 404, 422, dll)
  return false;
}

/**
 * Fungsi pembantu delay / sleep
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Kelas HealthcareHttpClient
 */
class HealthcareHttpClient {
  /**
   * @param {Object} options
   * @param {string} options.baseURL
   * @param {string} [options.token] Bearer token
   * @param {number} [options.timeout] Timeout dalam ms (default 5000)
   * @param {number} [options.maxRetries] Maksimal percobaan retry (default 3)
   * @param {number} [options.initialDelayMs] Delay awal retry dalam ms (default 300)
   */
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3000';
    this.token = options.token || null;
    this.timeout = options.timeout || 5000;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : 3;
    this.initialDelayMs = options.initialDelayMs || 300;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      }
    });
  }

  /**
   * Set atau update Bearer Token
   */
  setToken(token) {
    this.token = token;
    this.client.defaults.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Eksekusi request dengan Selective Retry & Exponential Backoff
   */
  async requestWithRetry(requestConfig) {
    let lastError = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`[HTTP Client] Percobaan ke-${attempt} untuk ${requestConfig.method || 'GET'} ${requestConfig.url}`);
        }

        const response = await this.client(requestConfig);
        return {
          success: true,
          status: response.status,
          data: response.data,
          attempts: attempt + 1
        };
      } catch (error) {
        lastError = error;
        const status = error.response ? error.response.status : 'NETWORK_ERROR/TIMEOUT';

        logger.warn(`[HTTP Client] Request gagal (Status: ${status}, Message: ${error.message}) - Attempt ${attempt + 1}/${this.maxRetries + 1}`);

        // Cek apakah error ini layak di-retry
        const canRetry = isRetryableError(error);

        if (!canRetry) {
          logger.warn(`[HTTP Client] Error status ${status} tidak di-retry (Client Error / Auth Error)`);
          break; // Hentikan retry loop untuk 4xx error
        }

        if (attempt < this.maxRetries) {
          // Hitung delay exponential backoff: initial * (2 ^ attempt)
          const delay = this.initialDelayMs * Math.pow(2, attempt);
          logger.info(`[HTTP Client] Menunggu ${delay}ms sebelum retry berikutnya...`);
          await sleep(delay);
        }
      }
    }

    // Jika seluruh retry gagal atau tidak layak di-retry
    const status = lastError.response ? lastError.response.status : 500;
    const errorData = lastError.response ? lastError.response.data : { message: lastError.message };

    return {
      success: false,
      status,
      error: errorData,
      isAuthError: status === 401 || status === 403,
      isClientError: status >= 400 && status < 500,
      isServerError: status >= 500
    };
  }

  /**
   * Helper method GET
   */
  async get(url, config = {}) {
    return this.requestWithRetry({ method: 'GET', url, ...config });
  }

  /**
   * Helper method POST
   */
  async post(url, data, config = {}) {
    return this.requestWithRetry({ method: 'POST', url, data, ...config });
  }
}

module.exports = {
  HealthcareHttpClient,
  isRetryableError
};
