const db = require('../config/db');

// Insert or update the one prescription a session can have.
const upsertPrescription = async (sessionId, patientId, therapistId, sessionNotes, medications) => {
    const [result] = await db.query(
        `INSERT INTO prescriptions (session_id, patient_id, therapist_id, session_notes, medications)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            session_notes = VALUES(session_notes),
            medications = VALUES(medications)`,
        [sessionId, patientId, therapistId, sessionNotes || '', medications || '']
    );
    // insertId is 0 on the UPDATE branch, so look the row back up either way.
    const [rows] = await db.query(`SELECT id FROM prescriptions WHERE session_id = ?`, [sessionId]);
    return rows[0]?.id || result.insertId;
};

// Replace-all care plan items for a prescription (simplest correct model for
// "the therapist re-saves the whole form" — matches ScheduleManager's pattern
// of wiping and re-inserting the weekly template).
const replaceCarePlanItems = async (prescriptionId, patientId, therapistId, items) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM care_plan_items WHERE prescription_id = ?`, [prescriptionId]);

        if (items.length > 0) {
            const values = items.map((item) => [
                prescriptionId, patientId, therapistId, item.item_type, item.title, item.youtube_url || null
            ]);
            await connection.query(
                `INSERT INTO care_plan_items (prescription_id, patient_id, therapist_id, item_type, title, youtube_url) VALUES ?`,
                [values]
            );
        }

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

const getPrescriptionBySession = async (sessionId, therapistId) => {
    const [rows] = await db.query(
        `SELECT * FROM prescriptions WHERE session_id = ? AND therapist_id = ?`,
        [sessionId, therapistId]
    );
    if (!rows[0]) return null;

    const [items] = await db.query(
        `SELECT id, item_type, title, youtube_url, is_active FROM care_plan_items WHERE prescription_id = ? ORDER BY item_type, id`,
        [rows[0].id]
    );
    return { ...rows[0], care_plan_items: items };
};

// All prescriptions a therapist has written for one patient — used by Patient Archives.
const getPrescriptionsForPatient = async (therapistId, patientId) => {
    const [rows] = await db.query(
        `SELECT p.*, s.status AS session_status, s.scheduled_date, s.created_at AS session_created_at
         FROM prescriptions p
         JOIN sessions s ON s.id = p.session_id
         WHERE p.therapist_id = ? AND p.patient_id = ?
         ORDER BY p.created_at DESC`,
        [therapistId, patientId]
    );
    return rows;
};

module.exports = {
    upsertPrescription,
    replaceCarePlanItems,
    getPrescriptionBySession,
    getPrescriptionsForPatient
};
