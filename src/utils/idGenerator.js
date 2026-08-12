/**
 * Utility Generator ID Otomatis dengan Format Tanggal + Increment Sequence
 * Format: [PREFIX]-[YYYYMMDD]-[SEQUENCE] (contoh: PAS-20260331-0001)
 * Fitur: Reset sequence secara otomatis ketika berganti hari/tanggal.
 */

class IDGenerator {
  constructor(defaultPrefix = 'REG', paddingLength = 4) {
    this.defaultPrefix = defaultPrefix;
    this.paddingLength = paddingLength;
    this.counters = new Map(); // key: `${prefix}_${YYYYMMDD}`, value: currentSequence
  }

  /**
   * Mendapatkan string tanggal saat ini berformat YYYYMMDD
   * @param {Date} [customDate] Optional date object for testing
   */
  getFormattedDate(customDate = null) {
    const d = customDate || new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Generate ID Baru
   * @param {string} [prefix] Prefix khusus (misal: 'PAS' atau 'REG')
   * @param {Date} [customDate] Tanggal khusus untuk pengujian reset
   */
  generate(prefix = null, customDate = null) {
    const selectedPrefix = (prefix || this.defaultPrefix).toUpperCase();
    const dateStr = this.getFormattedDate(customDate);
    const key = `${selectedPrefix}_${dateStr}`;

    // Ambil nomor urut terakhir, default 0 jika tanggal/prefix baru
    const currentSeq = (this.counters.get(key) || 0) + 1;
    this.counters.set(key, currentSeq);

    // Format nomor urut dengan padding nol di depan (misal: 1 -> 0001)
    const seqPadded = String(currentSeq).padStart(this.paddingLength, '0');

    return `${selectedPrefix}-${dateStr}-${seqPadded}`;
  }

  /**
   * Reset counter manual (berguna untuk testing atau reset berkala)
   */
  reset() {
    this.counters.clear();
  }

  /**
   * Mendapatkan counter saat ini untuk key tertentu
   */
  getSequence(prefix = null, customDate = null) {
    const selectedPrefix = (prefix || this.defaultPrefix).toUpperCase();
    const dateStr = this.getFormattedDate(customDate);
    const key = `${selectedPrefix}_${dateStr}`;
    return this.counters.get(key) || 0;
  }
}

// Global default singleton instance
const defaultGenerator = new IDGenerator();

module.exports = {
  IDGenerator,
  generateID: (prefix, customDate) => defaultGenerator.generate(prefix, customDate),
  resetGenerator: () => defaultGenerator.reset()
};
