/**
  * Validator Menangani validasi string, NIK, No HP, Tanggal, dan Struktur Data Pasien/Pendaftaran.
 */

/**
 * Memeriksa apakah string NIK valid (16 digit angka).
 */
function isValidNIK(nik) {
  if (typeof nik !== 'string') return false;
  return /^\d{16}$/.test(nik.trim());
}

/**
 * Memeriksa apakah nomor HP valid (dimulai dengan 08 atau +62, batas 10-14 digit).
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const cleanPhone = phone.trim();
  return /^(08|\+628)\d{8,11}$/.test(cleanPhone);
}

/**
 * Memeriksa tanggal berformat YYYY-MM-DD dan valid secara kalender.
 */
function isValidDate(dateString) {
  if (typeof dateString !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  const timestamp = date.getTime();
  if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) return false;
  return date.toISOString().startsWith(dateString);
}

/**
 * Menghitung umur berdasarkan tanggal lahir (YYYY-MM-DD).
 */
function calculateAge(birthDateString) {
  if (!isValidDate(birthDateString)) return -1;
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Validasi objek data Pasien Baru.
 */
function validatePatient(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data pasien harus berupa objek'] };
  }

  // Nama minimal 3 karakter
  if (!data.nama || typeof data.nama !== 'string' || data.nama.trim().length < 3) {
    errors.push('Nama pasien wajib diisi dan minimal 3 karakter');
  }

  // NIK wajib 16 digit
  if (!data.nik || !isValidNIK(data.nik)) {
    errors.push('NIK harus terdiri dari 16 digit angka');
  }

  // No HP wajib valid
  if (!data.no_hp || !isValidPhone(data.no_hp)) {
    errors.push('Nomor HP tidak valid (harus diawali 08/+628 dan 10-14 digit)');
  }

  // Tanggal Lahir & Umur
  if (!data.tgl_lahir || !isValidDate(data.tgl_lahir)) {
    errors.push('Tanggal lahir harus berformat YYYY-MM-DD dan valid');
  } else {
    const age = calculateAge(data.tgl_lahir);
    if (age < 0 || age > 130) {
      errors.push('Tanggal lahir tidak masuk akal (umur harus antara 0 - 130 tahun)');
    }
  }

  // Jenis Kelamin
  if (!data.jenis_kelamin || !['L', 'P'].includes(data.jenis_kelamin.toUpperCase())) {
    errors.push("Jenis kelamin harus 'L' (Laki-laki) atau 'P' (Perempuan)");
  }

  // Tipe Pasien (BPJS / Umum)
  if (!data.tipe_pasien || !['BPJS', 'UMUM'].includes(data.tipe_pasien.toUpperCase())) {
    errors.push("Tipe pasien harus 'BPJS' atau 'UMUM'");
  }

  // Jika BPJS, no_bpjs wajib diisi (13 digit)
  if (data.tipe_pasien && data.tipe_pasien.toUpperCase() === 'BPJS') {
    if (!data.no_bpjs || !/^\d{13}$/.test(data.no_bpjs.trim())) {
      errors.push('Nomor BPJS wajib diisi 13 digit angka untuk tipe pasien BPJS');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validasi data Pendaftaran Layanan/Poli.
 */
function validateRegistration(data) {
  const errors = [];
  const validPoli = ['UMUM', 'GIGI', 'ANAK', 'PENYAKIT_DALAM', 'SPESIALIS'];

  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Data pendaftaran harus berupa objek'] };
  }

  if (!data.patient_id || typeof data.patient_id !== 'string' || !data.patient_id.trim()) {
    errors.push('Patient ID wajib diisi');
  }

  if (!data.poli || !validPoli.includes(data.poli.toUpperCase())) {
    errors.push(`Poli tidak valid. Pilihan valid: ${validPoli.join(', ')}`);
  }

  if (!data.keluhan || typeof data.keluhan !== 'string' || data.keluhan.trim().length < 5) {
    errors.push('Keluhan wajib diisi minimal 5 karakter');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidNIK,
  isValidPhone,
  isValidDate,
  calculateAge,
  validatePatient,
  validateRegistration
};
