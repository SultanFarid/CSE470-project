const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/earningsController');

router.get('/my', verifyToken, isTherapist, controller.getMyEarnings);

module.exports = router;
