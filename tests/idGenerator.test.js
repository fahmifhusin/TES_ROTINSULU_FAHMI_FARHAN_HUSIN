const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { IDGenerator } = require('../src/utils/idGenerator');

describe('Unit Test: IDGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new IDGenerator('TEST', 4);
  });

  test('harus generate ID dengan format [PREFIX]-[YYYYMMDD]-[0001]', () => {
    const d = new Date(2026, 2, 31); // 31 Maret 2026 -> 20260331
    const id1 = generator.generate('PAS', d);
    assert.strictEqual(id1, 'PAS-20260331-0001');

    const id2 = generator.generate('PAS', d);
    assert.strictEqual(id2, 'PAS-20260331-0002');
  });

  test('harus melakukan RESET otomatis ketika tanggal berganti', () => {
    const day1 = new Date(2026, 2, 31); // 20260331
    const day2 = new Date(2026, 3, 1);  // 20260401

    const idDay1_1 = generator.generate('REG', day1);
    const idDay1_2 = generator.generate('REG', day1);

    assert.strictEqual(idDay1_1, 'REG-20260331-0001');
    assert.strictEqual(idDay1_2, 'REG-20260331-0002');

    // Berganti Hari
    const idDay2_1 = generator.generate('REG', day2);
    assert.strictEqual(idDay2_1, 'REG-20260401-0001'); // Sequence reset kembali ke 0001
  });

  test('harus mengisolasi sequence untuk prefix yang berbeda pada hari yang sama', () => {
    const d = new Date(2026, 2, 31);
    const pasId = generator.generate('PAS', d);
    const regId = generator.generate('REG', d);

    assert.strictEqual(pasId, 'PAS-20260331-0001');
    assert.strictEqual(regId, 'REG-20260331-0001');
  });
});
