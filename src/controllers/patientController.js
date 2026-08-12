/**
 * Controller Layanan Pasien (In-Memory Storage)
 */
const { validatePatient, calculateAge } = require('../utils/validator');
const { generateID } = require('../utils/idGenerator');
const logger = require('../utils/logger');

// Database In-Memory Pasien
const patientsDB = new Map();

/**
 * Tambah Pasien Baru
 * HTTP POST /api/patients
 */
function createPatient(req, res) {
  const validation = validatePatient(req.body);

  if (!validation.isValid) {
    logger.warn('[PatientController] Validasi data pasien gagal', validation.errors);
    return res.status(400).json({
      success: false,
      message: 'Validasi data pasien gagal',
      errors: validation.errors
    });
  }

  const { nama, nik, no_hp, tgl_lahir, jenis_kelamin, tipe_pasien, no_bpjs, alamat } = req.body;

  // Cek duplicate NIK
  for (const p of patientsDB.values()) {
    if (p.nik === nik.trim()) {
      logger.warn(`[PatientController] NIK ${nik} sudah terdaftar`);
      return res.status(400).json({
        success: false,
        message: 'NIK sudah terdaftar dalam sistem',
        errors: ['NIK sudah pernah diregistrasikan']
      });
    }
  }

  // Generate ID Pasien otomatis (PAS-YYYYMMDD-0001)
  const patientId = generateID('PAS');
  const age = calculateAge(tgl_lahir);

  const newPatient = {
    id: patientId,
    nama: nama.trim(),
    nik: nik.trim(),
    no_hp: no_hp.trim(),
    tgl_lahir,
    umur: age,
    jenis_kelamin: jenis_kelamin.toUpperCase(),
    tipe_pasien: tipe_pasien.toUpperCase(),
    no_bpjs: tipe_pasien.toUpperCase() === 'BPJS' ? no_bpjs.trim() : null,
    alamat: alamat ? alamat.trim() : '-',
    created_at: new Date().toISOString()
  };

  patientsDB.set(patientId, newPatient);
  logger.info(`[PatientController] Pasien berhasil dibuat ID: ${patientId}`);

  return res.status(201).json({
    success: true,
    message: 'Data pasien berhasil ditambahkan',
    data: newPatient
  });
}

/**
 * Get All Pasien (dengan search & filter)
 * HTTP GET /api/patients
 */
function getAllPatients(req, res) {
  const { tipe, search } = req.query;
  let list = Array.from(patientsDB.values());

  if (tipe) {
    list = list.filter((p) => p.tipe_pasien === tipe.toUpperCase());
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter((p) => p.nama.toLowerCase().includes(q) || p.nik.includes(q) || p.id.toLowerCase().includes(q));
  }

  return res.status(200).json({
    success: true,
    count: list.length,
    data: list
  });
}

/**
 * Get Pasien By ID
 * HTTP GET /api/patients/:id
 */
function getPatientById(req, res) {
  const { id } = req.params;
  const patient = patientsDB.get(id);

  if (!patient) {
    logger.warn(`[PatientController] Pasien tidak ditemukan ID: ${id}`);
    return res.status(404).json({
      success: false,
      message: `Pasien dengan ID ${id} tidak ditemukan`
    });
  }

  return res.status(200).json({
    success: true,
    data: patient
  });
}

/**
 * Reset In-Memory DB (untuk unit testing)
 */
function resetPatientsDB() {
  patientsDB.clear();
}

module.exports = {
  createPatient,
  getAllPatients,
  getPatientById,
  resetPatientsDB,
  patientsDB
};
