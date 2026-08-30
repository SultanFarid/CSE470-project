const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/caseloadController');

router.get('/my', verifyToken, isTherapist, controller.getMyCaseload);

module.exports = router;
