const db = require('../config/db');

// এটাই সব জায়গা থেকে reuse হবে — adminUserModel.js, patientController.js, ইত্যাদি
const createNotification = async (userId, message, type = 'general') => {
    const [result] = await db.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
        [userId, message, type]
    );
    return result;
};

const getUserNotifications = async (userId) => {
    const [rows] = await db.query(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
    return rows;
};

const getUnreadCount = async (userId) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = FALSE`,
        [userId]
    );
    return rows[0].count;
};

const markAsRead = async (notificationId, userId) => {
    await db.query(
        `UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?`,
        [notificationId, userId]
    );
};

const markAllAsRead = async (userId) => {
    await db.query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = ?`,
        [userId]
    );
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead
};