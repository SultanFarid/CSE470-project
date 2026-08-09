const db = require('../config/db');

const getAllApplications = async (status) => {
    let sql = `
        SELECT ta.*, u.email, u.display_name
        FROM therapist_applications ta
        JOIN users u ON ta.user_id = u.id
        WHERE 1=1
    `;
    const params = [];
    if (status && status !== 'all') {
        sql += ` AND ta.status = ?`;
        params.push(status);
    }
    sql += ` ORDER BY ta.created_at DESC`;
    const [rows] = await db.query(sql, params);
    return rows;
};

const getApplicationById = async (applicationId) => {
    const [rows] = await db.query(
        `SELECT ta.*, u.email, u.display_name 
         FROM therapist_applications ta
         JOIN users u ON ta.user_id = u.id
         WHERE ta.id = ?`,
        [applicationId]
    );
    return rows[0];
};

const updateApplicationStatus = async (applicationId, status, adminId) => {
    await db.query(
        `UPDATE therapist_applications 
         SET status=?, reviewed_by=?, reviewed_at=NOW() 
         WHERE id=?`,
        [status, adminId, applicationId]
    );
};

const scheduleViva = async (applicationId, vivaDate, notes) => {
    await db.query(
        `UPDATE therapist_applications 
         SET viva_scheduled_at=?, viva_notes=?, status='under_review' 
         WHERE id=?`,
        [vivaDate, notes, applicationId]
    );
};

const upgradeUserToTherapist = async (userId) => {
    await db.query(
        `UPDATE users SET role='therapist', status='active' WHERE id=?`,
        [userId]
    );
};

module.exports = {
    getAllApplications,
    getApplicationById,
    updateApplicationStatus,
    scheduleViva,
    upgradeUserToTherapist
};