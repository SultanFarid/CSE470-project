const db = require('../config/db');

// ===== Therapist actions =====

const proposeSession = async (therapistId, topic, description, capacity, scheduledAt) => {
    const [result] = await db.query(
        `INSERT INTO group_sessions (therapist_id, topic, description, capacity, scheduled_at)
         VALUES (?, ?, ?, ?, ?)`,
        [therapistId, topic, description, capacity, scheduledAt]
    );
    return result.insertId;
};

const getSessionsByTherapist = async (therapistId) => {
    const [rows] = await db.query(
         `SELECT gs.id, gs.topic AS title, gs.description,
                gs.capacity AS max_participants, gs.scheduled_at AS start_time,
                gs.status, gs.session_notes, gs.created_at,
                (SELECT COUNT(*) FROM group_session_enrollments e
                 WHERE e.group_session_id = gs.id AND e.status IN ('requested', 'confirmed', 'attended'))
                 AS enrolled_count
         FROM group_sessions gs
         WHERE gs.therapist_id = ?
         ORDER BY gs.created_at DESC`,
        [therapistId]
    );
    return rows;
};

const getEnrolledPatients = async (groupSessionId, therapistId) => {
    // therapistId check ensures a therapist can only view their own session's roster
    const [rows] = await db.query(
        `SELECT e.id AS enrollment_id, e.status, e.requested_at,
                u.id AS patient_id, u.display_name, u.email
         FROM group_session_enrollments e
         JOIN users u ON u.id = e.patient_id
         JOIN group_sessions gs ON gs.id = e.group_session_id
         WHERE e.group_session_id = ? AND gs.therapist_id = ?
         ORDER BY e.requested_at ASC`,
        [groupSessionId, therapistId]
    );
    return rows;
};

const markAttendance = async (enrollmentId, therapistId, attended) => {
    const status = attended ? 'attended' : 'absent';
    const [result] = await db.query(
        `UPDATE group_session_enrollments e
         JOIN group_sessions gs ON gs.id = e.group_session_id
         SET e.status = ?
         WHERE e.id = ? AND gs.therapist_id = ?`,
        [status, enrollmentId, therapistId]
    );
    return result.affectedRows;
};

const writeSessionNotes = async (groupSessionId, therapistId, notes) => {
    const [result] = await db.query(
        `UPDATE group_sessions SET session_notes = ?, status = 'completed'
         WHERE id = ? AND therapist_id = ?`,
        [notes, groupSessionId, therapistId]
    );
    return result.affectedRows;
};

// ===== Admin actions =====

const getPendingProposals = async () => {
    const [rows] = await db.query(
        `SELECT gs.*, u.display_name AS therapist_name, u.email AS therapist_email
         FROM group_sessions gs
         JOIN users u ON u.id = gs.therapist_id
         WHERE gs.status = 'pending'
         ORDER BY gs.created_at ASC`
    );
    return rows;
};

const getAllProposals = async () => {
    const [rows] = await db.query(
        `SELECT gs.*, u.display_name AS therapist_name, u.email AS therapist_email
         FROM group_sessions gs
         JOIN users u ON u.id = gs.therapist_id
         ORDER BY gs.created_at DESC`
    );
    return rows;
};

const setProposalStatus = async (groupSessionId, status) => {
    const [result] = await db.query(
        `UPDATE group_sessions SET status = ? WHERE id = ?`,
        [status, groupSessionId]
    );
    return result.affectedRows;
};

const getSessionById = async (groupSessionId) => {
    const [rows] = await db.query(
        `SELECT * FROM group_sessions WHERE id = ?`,
        [groupSessionId]
    );
    return rows[0];
};

// ===== Patient actions =====

const getOpenSessions = async () => {
    const [rows] = await db.query(
        `SELECT gs.*, u.display_name AS therapist_name,
                (SELECT COUNT(*) FROM group_session_enrollments e
                 WHERE e.group_session_id = gs.id AND e.status IN ('requested', 'confirmed', 'attended'))
                 AS enrolled_count
         FROM group_sessions gs
         JOIN users u ON u.id = gs.therapist_id
         WHERE gs.status = 'approved' AND gs.scheduled_at > NOW()
         ORDER BY gs.scheduled_at ASC`
    );
    return rows;
};

const requestToJoin = async (groupSessionId, patientId) => {
    const [result] = await db.query(
        `INSERT INTO group_session_enrollments (group_session_id, patient_id)
         VALUES (?, ?)`,
        [groupSessionId, patientId]
    );
    return result.insertId;
};

const getPatientEnrollments = async (patientId) => {
    const [rows] = await db.query(
        `SELECT e.*, gs.topic, gs.scheduled_at, gs.status AS session_status
         FROM group_session_enrollments e
         JOIN group_sessions gs ON gs.id = e.group_session_id
         WHERE e.patient_id = ?
         ORDER BY gs.scheduled_at DESC`,
        [patientId]
    );
    return rows;
};

const countEnrolled = async (groupSessionId) => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS count FROM group_session_enrollments
         WHERE group_session_id = ? AND status IN ('requested', 'confirmed', 'attended')`,
        [groupSessionId]
    );
    return rows[0].count;
};

module.exports = {
    proposeSession,
    getSessionsByTherapist,
    getEnrolledPatients,
    markAttendance,
    writeSessionNotes,
    getPendingProposals,
    getAllProposals,
    setProposalStatus,
    getSessionById,
    getOpenSessions,
    requestToJoin,
    getPatientEnrollments,
    countEnrolled
};