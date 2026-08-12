const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/authMiddleware');
const controller = require('../controllers/notificationController');

router.get('/', verifyToken, controller.listNotifications);
router.get('/unread-count', verifyToken, controller.unreadCount);
router.put('/:id/read', verifyToken, controller.markRead);
router.put('/mark-all-read', verifyToken, controller.markAllRead);

module.exports = router;