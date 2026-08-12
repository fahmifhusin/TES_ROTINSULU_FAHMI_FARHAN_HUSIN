const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../src/app');
const { resetPatientsDB } = require('../src/controllers/patientController');
const { resetRegistrationsDB } = require('../src/controllers/registrationController');
const { resetMockCallCount } = require('../src/controllers/mockController');
const { resetGenerator } = require('../src/utils/idGenerator');

let server;
let baseUrl;
const PORT = 3099;
const VALID_TOKEN = 'secret-health-token-123';

describe('Integration Test: Express REST API Endpoints', () => {
  before(async () => {
    resetPatientsDB();
    resetRegistrationsDB();
    resetMockCallCount();
    resetGenerator();

    await new Promise((resolve) => {
      server = app.listen(PORT, () => {
        baseUrl = `http://localhost:${PORT}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('GET /api/health', () => {
    test('harus mengembalikan status 200 OK dan status active', async () => {
      const res = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.message.includes('Active'));
    });
  });

  describe('POST /api/patients (Authentication & Validation)', () => {
    test('harus return 401 jika tanpa Authorization Header', async () => {
      const res = await fetch(`${baseUrl}/api/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: 'Ahmad' })
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.message.includes('Unauthorized'));
    });

    test('harus return 400 jika data tidak valid', async () => {
      const res = await fetch(`${baseUrl}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VALID_TOKEN}`
        },
        body: JSON.stringify({
          nama: 'Ah', // < 3 karakter
          nik: '123'  // < 16 digit
        })
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.ok(body.errors.length > 0);
    });

    test('harus return 201 Created dan auto generate Patient ID jika data valid', async () => {
      const newPatient = {
        nama: 'Budi Santoso',
        nik: '3271012005900001',
        no_hp: '081234567891',
        tgl_lahir: '1990-05-20',
        jenis_kelamin: 'L',
        tipe_pasien: 'BPJS',
        no_bpjs: '0001234567891',
        alamat: 'Jl. Merdeka No. 10'
      };

      const res = await fetch(`${baseUrl}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VALID_TOKEN}`
        },
        body: JSON.stringify(newPatient)
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.id.startsWith('PAS-'));
      assert.strictEqual(body.data.nama, 'Budi Santoso');
    });

    test('harus return 400 jika NIK sudah terdaftar', async () => {
      const duplicatePatient = {
        nama: 'Budi Clone',
        nik: '3271012005900001', // NIK sama
        no_hp: '081299998888',
        tgl_lahir: '1990-05-20',
        jenis_kelamin: 'L',
        tipe_pasien: 'UMUM'
      };

      const res = await fetch(`${baseUrl}/api/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VALID_TOKEN}`
        },
        body: JSON.stringify(duplicatePatient)
      });

      assert.strictEqual(res.status, 400);
      const body = await res.json();
      assert.ok(body.message.includes('NIK'));
    });
  });

  describe('GET /api/patients & GET /api/patients/:id', () => {
    test('harus mengambil daftar pasien dan filter', async () => {
      const res = await fetch(`${baseUrl}/api/patients`);
      assert.strictEqual(res.status, 200);

      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.count, 1);
    });

    test('harus return 404 jika ID pasien tidak ditemukan', async () => {
      const res = await fetch(`${baseUrl}/api/patients/PAS-99999999-9999`);
      assert.strictEqual(res.status, 404);
    });
  });

  describe('POST /api/registrations (Layanan Pendaftaran)', () => {
    test('harus return 404 jika patient_id tidak ada di database', async () => {
      const res = await fetch(`${baseUrl}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VALID_TOKEN}`
        },
        body: JSON.stringify({
          patient_id: 'PAS-99999999-9999',
          poli: 'UMUM',
          keluhan: 'Demam tinggi'
        })
      });

      assert.strictEqual(res.status, 404);
    });

    test('harus return 201 Created dan auto generate Registration ID & Antrian jika sukses', async () => {
      // Ambil ID pasien yang sudah ada dari GET
      const getRes = await fetch(`${baseUrl}/api/patients`);
      const getBody = await getRes.json();
      const patientId = getBody.data[0].id;

      const regPayload = {
        patient_id: patientId,
        poli: 'UMUM',
        keluhan: 'Batuk berdahak dan sesak nafas ringan'
      };

      const res = await fetch(`${baseUrl}/api/registrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VALID_TOKEN}`
        },
        body: JSON.stringify(regPayload)
      });

      assert.strictEqual(res.status, 201);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(body.data.id.startsWith('REG-'));
      assert.strictEqual(body.data.nomor_antrian, 'UMUM-001');
    });
  });

  describe('HTTP Client Mock Referral Test (Retry Scenario)', () => {
    test('harus berhasil memanggil mock external referral via send-referral endpoint', async () => {
      resetMockCallCount();

      const payload = {
        targetUrl: baseUrl,
        token: 'external-secret-key',
        patient_data: { nama: 'Pasien Rujukan' }
      };

      const res = await fetch(`${baseUrl}/api/mock/send-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.attempts, 1);
    });

    test('harus TIDAK retry jika dikirimkan token yang salah (Auth Error 401)', async () => {
      resetMockCallCount();

      const payload = {
        targetUrl: baseUrl,
        token: 'INVALID-TOKEN', // Token Salah
        patient_data: { nama: 'Pasien Rujukan' },
        options: { maxRetries: 3 }
      };

      const res = await fetch(`${baseUrl}/api/mock/send-referral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.isAuthError, true);
    });
  });
});
