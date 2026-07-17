const express = require('express');
const router = express.Router();
const { loginUser, signupAdmin } = require('../controllers/authController');

router.post('/login', loginUser);
router.post('/admin-signup', signupAdmin);

module.exports = router;