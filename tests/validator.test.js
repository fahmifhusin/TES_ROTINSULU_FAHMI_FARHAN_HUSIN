const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  isValidNIK,
  isValidPhone,
  isValidDate,
  calculateAge,
  validatePatient,
  validateRegistration
} = require('../src/utils/validator');

describe('Unit Test: Validator Utilities', () => {
  describe('isValidNIK', () => {
    test('harus return true untuk NIK 16 digit angka', () => {
      assert.strictEqual(isValidNIK('3271012304950001'), true);
    });

    test('harus return false untuk NIK kurang dari 16 digit', () => {
      assert.strictEqual(isValidNIK('327101230495001'), false);
    });

    test('harus return false jika mengandung huruf', () => {
      assert.strictEqual(isValidNIK('327101230495000A'), false);
    });
  });

  describe('isValidPhone', () => {
    test('harus return true untuk nomor HP 08...', () => {
      assert.strictEqual(isValidPhone('081234567890'), true);
    });

    test('harus return true untuk nomor HP +628...', () => {
      assert.strictEqual(isValidPhone('+6281234567890'), true);
    });

    test('harus return false untuk nomor tidak valid', () => {
      assert.strictEqual(isValidPhone('0217654321'), false);
      assert.strictEqual(isValidPhone('12345'), false);
    });
  });

  describe('isValidDate & calculateAge', () => {
    test('harus validasi format tanggal YYYY-MM-DD', () => {
      assert.strictEqual(isValidDate('1995-04-20'), true);
      assert.strictEqual(isValidDate('20-04-1995'), false);
      assert.strictEqual(isValidDate('1995-02-30'), false); // Tanggal tidak valid
    });

    test('harus menghitung umur dengan benar', () => {
      const birthYear = 2000;
      const currentYear = new Date().getFullYear();
      const expectedAge = currentYear - birthYear;
      const calculated = calculateAge('2000-01-01');
      assert.strictEqual(calculated, expectedAge);
    });
  });

  describe('validatePatient', () => {
    test('harus lulus jika semua data valid (Pasien BPJS)', () => {
      const validData = {
        nama: 'Ahmad Subarkah',
        nik: '3271012304950001',
        no_hp: '081234567890',
        tgl_lahir: '1995-04-20',
        jenis_kelamin: 'L',
        tipe_pasien: 'BPJS',
        no_bpjs: '0001234567890'
      };
      const res = validatePatient(validData);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.errors.length, 0);
    });

    test('harus gagal jika BPJS tapi no_bpjs tidak diisi', () => {
      const invalidData = {
        nama: 'Ahmad Subarkah',
        nik: '3271012304950001',
        no_hp: '081234567890',
        tgl_lahir: '1995-04-20',
        jenis_kelamin: 'L',
        tipe_pasien: 'BPJS'
      };
      const res = validatePatient(invalidData);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('BPJS')));
    });

    test('harus gagal jika nama terlalu pendek dan NIK salah', () => {
      const invalidData = {
        nama: 'A',
        nik: '123',
        no_hp: '081234567890',
        tgl_lahir: '1995-04-20',
        jenis_kelamin: 'L',
        tipe_pasien: 'UMUM'
      };
      const res = validatePatient(invalidData);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.length >= 2);
    });
  });

  describe('validateRegistration', () => {
    test('harus lulus pendaftaran jika data valid', () => {
      const data = {
        patient_id: 'PAS-20260331-0001',
        poli: 'UMUM',
        keluhan: 'Demam tinggi dan sakit kepala'
      };
      const res = validateRegistration(data);
      assert.strictEqual(res.isValid, true);
    });

    test('harus gagal jika poli tidak terdaftar', () => {
      const data = {
        patient_id: 'PAS-20260331-0001',
        poli: 'POLI_KAPAL',
        keluhan: 'Pusing'
      };
      const res = validateRegistration(data);
      assert.strictEqual(res.isValid, false);
      assert.ok(res.errors.some((e) => e.includes('Poli tidak valid')));
    });
  });
});
