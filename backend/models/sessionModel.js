const db = require('../config/db');

const createSession = async (patientId, therapistId) => {
    const [result] = await db.query(
        `INSERT INTO sessions (patient_id, therapist_id, status) VALUES (?, ?, 'confirmed')`,
        [patientId, therapistId]
    );
    return result.insertId;
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
    getSessionsByPatient,
    getSessionsByTherapist
};