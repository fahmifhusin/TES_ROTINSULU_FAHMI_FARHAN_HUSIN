/**
 * Controller Layanan Pendaftaran Berobat / Poli (In-Memory Storage)
 */
const { validateRegistration } = require('../utils/validator');
const { generateID } = require('../utils/idGenerator');
const { patientsDB } = require('./patientController');
const logger = require('../utils/logger');

// Database In-Memory Pendaftaran
const registrationsDB = new Map();
// Counter antrian per poli
const queueCounters = new Map();

function getFormattedToday() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Buat Pendaftaran Berobat Baru
 * HTTP POST /api/registrations
 */
function createRegistration(req, res) {
  const validation = validateRegistration(req.body);

  if (!validation.isValid) {
    logger.warn('[RegistrationController] Validasi pendaftaran gagal', validation.errors);
    return res.status(400).json({
      success: false,
      message: 'Validasi data pendaftaran gagal',
      errors: validation.errors
    });
  }

  const { patient_id, poli, keluhan } = req.body;

  // Pastikan Pasien Terdaftar di Sistem
  const patient = patientsDB.get(patient_id);
  if (!patient) {
    logger.warn(`[RegistrationController] Pasien tidak ditemukan ID: ${patient_id}`);
    return res.status(404).json({
      success: false,
      message: `Pasien dengan ID '${patient_id}' belum terdaftar. Silakan daftarkan pasien terlebih dahulu.`
    });
  }

  const normalizedPoli = poli.toUpperCase();
  const regId = generateID('REG');
  const dateStr = getFormattedToday();

  // Hitung Nomor Antrian per Poli hari ini
  const queueKey = `${normalizedPoli}_${dateStr}`;
  const currentQueue = (queueCounters.get(queueKey) || 0) + 1;
  queueCounters.set(queueKey, currentQueue);

  const registrationData = {
    id: regId,
    nomor_antrian: `${normalizedPoli}-${String(currentQueue).padStart(3, '0')}`,
    patient_id: patient.id,
    nama_pasien: patient.nama,
    tipe_pasien: patient.tipe_pasien,
    poli: normalizedPoli,
    keluhan: keluhan.trim(),
    status: 'MENUNGGU', // MENUNGGU, DIPERIKSA, SELESAI, BATAL
    created_at: new Date().toISOString()
  };

  registrationsDB.set(regId, registrationData);
  logger.info(`[RegistrationController] Pendaftaran berhasil ID: ${regId}, Antrian: ${registrationData.nomor_antrian}`);

  return res.status(201).json({
    success: true,
    message: 'Pendaftaran layanan berobat berhasil',
    data: registrationData
  });
}

/**
 * Get All Pendaftaran
 * HTTP GET /api/registrations
 */
function getAllRegistrations(req, res) {
  const { poli, status } = req.query;
  let list = Array.from(registrationsDB.values());

  if (poli) {
    list = list.filter((r) => r.poli === poli.toUpperCase());
  }

  if (status) {
    list = list.filter((r) => r.status === status.toUpperCase());
  }

  return res.status(200).json({
    success: true,
    count: list.length,
    data: list
  });
}

/**
 * Get Pendaftaran By ID
 * HTTP GET /api/registrations/:id
 */
function getRegistrationById(req, res) {
  const { id } = req.params;
  const registration = registrationsDB.get(id);

  if (!registration) {
    logger.warn(`[RegistrationController] Pendaftaran tidak ditemukan ID: ${id}`);
    return res.status(404).json({
      success: false,
      message: `Pendaftaran dengan ID ${id} tidak ditemukan`
    });
  }

  return res.status(200).json({
    success: true,
    data: registration
  });
}

/**
 * Reset DB (untuk unit test)
 */
function resetRegistrationsDB() {
  registrationsDB.clear();
  queueCounters.clear();
}

module.exports = {
  createRegistration,
  getAllRegistrations,
  getRegistrationById,
  resetRegistrationsDB,
  registrationsDB
};
