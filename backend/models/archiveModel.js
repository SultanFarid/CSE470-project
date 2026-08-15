const db = require('../config/db');

// Distinct past patients for this therapist, optionally filtered by name/email.
const searchMyPatients = async (therapistId, search) => {
    let sql = `
        SELECT
            u.id AS patient_id,
            COALESCE(u.display_name, u.email) AS patient_name,
            u.email,
            COUNT(DISTINCT s.id) AS total_sessions,
            MAX(COALESCE(s.scheduled_date, DATE(s.created_at))) AS last_session_date
        FROM sessions s
        JOIN users u ON u.id = s.patient_id
        WHERE s.therapist_id = ?
    `;
    const params = [therapistId];

    if (search && search.trim() !== '') {
        sql += ` AND (u.display_name LIKE ? OR u.email LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` GROUP BY u.id, u.display_name, u.email ORDER BY last_session_date DESC`;

    const [rows] = await db.query(sql, params);
    return rows;
};

// Full session + prescription history for one patient, scoped to this therapist only.
const getPatientHistory = async (therapistId, patientId) => {
    const [sessions] = await db.query(
        `SELECT s.id AS session_id, s.status, s.scheduled_date, s.scheduled_time,
                s.session_type, s.fee, s.created_at
         FROM sessions s
         WHERE s.therapist_id = ? AND s.patient_id = ?
         ORDER BY s.created_at DESC`,
        [therapistId, patientId]
    );

    const [prescriptions] = await db.query(
        `SELECT p.id, p.session_id, p.session_notes, p.medications, p.created_at
         FROM prescriptions p
         WHERE p.therapist_id = ? AND p.patient_id = ?
         ORDER BY p.created_at DESC`,
        [therapistId, patientId]
    );

    const prescriptionsBySession = {};
    prescriptions.forEach((p) => { prescriptionsBySession[p.session_id] = p; });

    return sessions.map((s) => ({ ...s, prescription: prescriptionsBySession[s.session_id] || null }));
};

module.exports = { searchMyPatients, getPatientHistory };
