const NotificationModel = require('../models/notificationModel');

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

module.exports = { listNotifications, unreadCount, markRead, markAllRead };