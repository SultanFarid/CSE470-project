const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/briefingController');

router.get('/session/:sessionId', verifyToken, isTherapist, controller.getBriefingForSession);

module.exports = router;
