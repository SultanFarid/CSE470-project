const db = require('../config/db');

const searchUsers = (search, role, callback) => {
    let sql = `
        SELECT 
            u.id, u.email, u.role, u.status,
            u.last_login, u.created_at,
            u.suspended_at, u.deactivated_at,
            COALESCE(u.display_name, u.email) AS display_name,
            COUNT(DISTINCT CASE 
                WHEN u.role='patient' THEN s1.id END) +
            COUNT(DISTINCT CASE 
                WHEN u.role='therapist' THEN s2.id END) 
                AS total_sessions
        FROM users u
        LEFT JOIN sessions s1 ON s1.patient_id = u.id
        LEFT JOIN sessions s2 ON s2.therapist_id = u.id
        WHERE u.role != 'admin'
    `;
    const params = [];

    if (search && search.trim() !== '') {
        sql += ` AND (u.display_name LIKE ? 
                  OR u.email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }
    if (role && role !== 'all') {
        sql += ` AND u.role = ?`;
        params.push(role);
    }
    sql += ` GROUP BY u.id ORDER BY u.created_at DESC`;
    db.query(sql, params, callback);
};

const getUserById = (userId, callback) => {
    const sql = `
        SELECT 
            u.id, u.email, u.role, u.status,
            u.last_login, u.created_at,
            u.suspended_at, u.deactivated_at,
            COALESCE(u.display_name, u.email) AS display_name,
            u.contact_number, u.location, u.profile_photo,
            COUNT(DISTINCT s1.id) + 
            COUNT(DISTINCT s2.id) AS total_sessions
        FROM users u
        LEFT JOIN sessions s1 ON s1.patient_id = u.id
        LEFT JOIN sessions s2 ON s2.therapist_id = u.id
        WHERE u.id = ?
        GROUP BY u.id
    `;
    db.query(sql, [userId], callback);
};

const updateUserStatus = (userId, status, callback) => {
    let sql = '';
    let params = [];

    if (status === 'suspended') {
        sql = `UPDATE users SET status='suspended', 
               suspended_at=NOW() WHERE id=?`;
        params = [userId];
    } else if (status === 'deactivated') {
        sql = `UPDATE users SET status='deactivated', 
               deactivated_at=NOW() WHERE id=?`;
        params = [userId];
    } else if (status === 'active') {
        sql = `UPDATE users SET status='active', 
               suspended_at=NULL WHERE id=?`;
        params = [userId];
    }
    db.query(sql, params, callback);
};

const createNotification = (userId, message, callback) => {
    const sql = `INSERT INTO notifications 
                 (user_id, message) VALUES (?, ?)`;
    db.query(sql, [userId, message], callback);
};

module.exports = {
    searchUsers,
    getUserById,
    updateUserStatus,
    createNotification
};