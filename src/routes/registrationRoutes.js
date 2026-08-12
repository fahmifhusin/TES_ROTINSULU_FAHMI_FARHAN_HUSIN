const express = require('express');
const router = express.Router();
const { createRegistration, getAllRegistrations, getRegistrationById } = require('../controllers/registrationController');
const { authenticateBearerToken } = require('../middlewares/authMiddleware');

router.get('/', getAllRegistrations);
router.get('/:id', getRegistrationById);
router.post('/', authenticateBearerToken, createRegistration);

module.exports = router;
