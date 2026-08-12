const express = require('express');
const router = express.Router();
const { createPatient, getAllPatients, getPatientById } = require('../controllers/patientController');
const { authenticateBearerToken } = require('../middlewares/authMiddleware');

// Public or Protected endpoints
router.get('/', getAllPatients);
router.get('/:id', getPatientById);
router.post('/', authenticateBearerToken, createPatient);

module.exports = router;
