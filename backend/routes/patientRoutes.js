
const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const upload = require('../middleware/uploadMiddleware');


const verifyToken = require('../middleware/authMiddleware');


router.get('/profile', verifyToken, patientController.getPatientProfile);
router.put('/profile', verifyToken, patientController.updatePatientProfile);
router.post('/upload-photo', verifyToken, upload.single('photo'), patientController.uploadPatientPhoto);

module.exports = router;