const { test, describe } = require('node:test');
const assert = require('node:assert');
const { isRetryableError, HealthcareHttpClient } = require('../src/services/httpClient');

describe('Unit Test: HTTP Client & Selective Retry Logic', () => {
  describe('isRetryableError', () => {
    test('harus return TRUE untuk Network Error / Timeout (tanpa response)', () => {
      const error = new Error('Network Error');
      assert.strictEqual(isRetryableError(error), true);
    });

    test('harus return TRUE untuk Server Error (HTTP 500, 502, 503, 504)', () => {
      const err500 = { response: { status: 500 } };
      const err503 = { response: { status: 503 } };
      assert.strictEqual(isRetryableError(err500), true);
      assert.strictEqual(isRetryableError(err503), true);
    });

    test('harus return FALSE untuk Client Error / Auth Error (HTTP 400, 401, 403, 404)', () => {
      const err400 = { response: { status: 400 } };
      const err401 = { response: { status: 401 } };
      const err403 = { response: { status: 403 } };
      const err404 = { response: { status: 404 } };

      assert.strictEqual(isRetryableError(err400), false);
      assert.strictEqual(isRetryableError(err401), false);
      assert.strictEqual(isRetryableError(err403), false);
      assert.strictEqual(isRetryableError(err404), false);
    });
  });

  describe('HealthcareHttpClient Instance', () => {
    test('harus mengeset Bearer Token di Header', () => {
      const client = new HealthcareHttpClient({ token: 'test-token-xyz' });
      assert.strictEqual(client.token, 'test-token-xyz');
      assert.strictEqual(client.client.defaults.headers['Authorization'], 'Bearer test-token-xyz');
    });

    test('harus bisa mengupdate token secara dinamis', () => {
      const client = new HealthcareHttpClient();
      client.setToken('new-token-123');
      assert.strictEqual(client.token, 'new-token-123');
      assert.strictEqual(client.client.defaults.headers['Authorization'], 'Bearer new-token-123');
    });
  });
});
