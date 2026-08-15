const db = require('../config/db');

const createSession = async (patientId, therapistId, fee = null) => {
    const [result] = await db.query(
        `INSERT INTO sessions (patient_id, therapist_id, status, fee) VALUES (?, ?, 'confirmed', ?)`,
        [patientId, therapistId, fee]
    );
    return result.insertId;
};

const getById = async (sessionId) => {
    const [rows] = await db.query(`SELECT * FROM sessions WHERE id = ?`, [sessionId]);
    return rows[0];
};

// Therapist-only status transitions: confirmed -> in_progress -> completed, or -> cancelled
const ALLOWED_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const updateStatus = async (sessionId, therapistId, status) => {
    if (!ALLOWED_STATUSES.includes(status)) {
        throw new Error('Invalid status value.');
    }
    const [result] = await db.query(
        `UPDATE sessions SET status = ? WHERE id = ? AND therapist_id = ?`,
        [status, sessionId, therapistId]
    );
    return result.affectedRows;
};

const getSessionsByPatient = async (patientId) => {
    const [rows] = await db.query(
        `SELECT s.*, u.display_name AS therapist_name
         FROM sessions s
         JOIN users u ON s.therapist_id = u.id
         WHERE s.patient_id = ?
         ORDER BY s.created_at DESC`,
        [patientId]
    );
    return rows;
};

const getSessionsByTherapist = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT s.*, u.display_name AS patient_name
         FROM sessions s
         JOIN users u ON s.patient_id = u.id
         WHERE s.therapist_id = ?
         ORDER BY s.created_at DESC`,
        [therapistId]
    );
    return rows;
};

module.exports = {
    createSession,
    getById,
    updateStatus,
    getSessionsByPatient,
    getSessionsByTherapist
};