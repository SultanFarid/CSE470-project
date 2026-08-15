const NotificationModel = require('../models/notificationModel');
const db = require('../config/db');

const listNotifications = async (req, res) => {
    try {
        const notifications = await NotificationModel.getUserNotifications(req.user.id);
        res.status(200).json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const unreadCount = async (req, res) => {
    try {
        const count = await NotificationModel.getUnreadCount(req.user.id);
        res.status(200).json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markRead = async (req, res) => {
    try {
        await NotificationModel.markAsRead(req.params.id, req.user.id);
        res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const markAllRead = async (req, res) => {
    try {
        await NotificationModel.markAllAsRead(req.user.id);
        res.status(200).json({ message: 'All marked as read' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Therapist -> one of their own patients only (verified via a shared session,
// so a therapist can't message an arbitrary user id).
const sendCheckIn = async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { patientId, message } = req.body;

        if (!patientId || !message || !message.trim()) {
            return res.status(400).json({ message: 'patientId and message are required.' });
        }

        const [rows] = await db.query(
            `SELECT id FROM sessions WHERE therapist_id = ? AND patient_id = ? LIMIT 1`,
            [therapistId, patientId]
        );
        if (rows.length === 0) {
            return res.status(403).json({ message: 'You do not have a session history with this patient.' });
        }

        await NotificationModel.createNotification(patientId, message.trim(), 'checkin');
        res.status(200).json({ message: 'Check-in sent.' });
    } catch (err) {
        console.error('Send check-in error:', err);
        res.status(500).json({ message: 'Server error sending check-in.' });
    }
};

module.exports = { listNotifications, unreadCount, markRead, markAllRead, sendCheckIn };