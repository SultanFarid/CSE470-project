const express = require('express');
const router = express.Router();
const { verifyToken, isTherapist } = require('../middleware/authMiddleware');
const controller = require('../controllers/walletController');

router.get('/my', verifyToken, isTherapist, controller.getMyWallet);
router.post('/redeem', verifyToken, isTherapist, controller.redeem);

module.exports = router;
