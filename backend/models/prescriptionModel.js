const db = require('../config/db');

// Insert or update the one prescription a session can have.
const upsertPrescription = async (sessionId, patientId, therapistId, fields) => {
    const { sessionNotes, medications, presessionSummary, additionalBriefing, followUp } = fields;

    // followUp is optional: { recommended, date, notes }. If the therapist
    // isn't recommending one, status stays 'none' and date/notes are cleared
    // rather than left dangling from a previous save.
    const followUpRecommended = followUp?.recommended ? 1 : 0;
    const followUpDate = followUpRecommended ? (followUp.date || null) : null;
    const followUpNotes = followUpRecommended ? (followUp.notes || '') : '';
    const followUpStatus = followUpRecommended ? 'proposed' : 'none';

    await db.query(
        `INSERT INTO prescriptions
            (session_id, patient_id, therapist_id, session_notes, medications, presession_summary, additional_briefing,
             follow_up_recommended, follow_up_date, follow_up_notes, follow_up_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            session_notes = VALUES(session_notes),
            medications = VALUES(medications),
            presession_summary = VALUES(presession_summary),
            additional_briefing = VALUES(additional_briefing),
            follow_up_recommended = VALUES(follow_up_recommended),
            follow_up_date = VALUES(follow_up_date),
            follow_up_notes = VALUES(follow_up_notes),
            -- Re-saving the form re-proposes it (and clears any prior
            -- accept/decline) only if the therapist still has it checked on;
            -- if they unchecked it, it goes back to 'none' via VALUES() above.
            follow_up_status = VALUES(follow_up_status)`,
        [
            sessionId, patientId, therapistId,
            sessionNotes || '', medications || '',
            presessionSummary || '', additionalBriefing || '',
            followUpRecommended, followUpDate, followUpNotes, followUpStatus
        ]
    );
    // insertId is 0 on the UPDATE branch, so look the row back up either way.
    const [rows] = await db.query(`SELECT id FROM prescriptions WHERE session_id = ?`, [sessionId]);
    return rows[0]?.id;
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

// Replace-all structured medicine lines for a prescription.
const replaceMedicines = async (prescriptionId, medicines) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM prescription_medicines WHERE prescription_id = ?`, [prescriptionId]);

        if (medicines.length > 0) {
            const values = medicines.map((m, idx) => [
                prescriptionId,
                m.medicine_id || null,
                m.medicine_name,
                m.dosage || '',
                m.frequency_code || '',
                m.frequency_label || '',
                m.duration_days || null,
                m.instructions || '',
                idx
            ]);
            await connection.query(
                `INSERT INTO prescription_medicines
                    (prescription_id, medicine_id, medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions, sort_order)
                 VALUES ?`,
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

// Replace-all selected tests for a prescription.
const replaceTests = async (prescriptionId, tests) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM prescription_tests WHERE prescription_id = ?`, [prescriptionId]);

        if (tests.length > 0) {
            const values = tests.map((t, idx) => [
                prescriptionId, t.test_id || null, t.test_name, t.notes || '', idx
            ]);
            await connection.query(
                `INSERT INTO prescription_tests (prescription_id, test_id, test_name, notes, sort_order) VALUES ?`,
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
    // Look up the session first so we know patient_id even if no prescription has been written yet
    const [[session]] = await db.query(
        `SELECT id, patient_id, scheduled_date FROM sessions WHERE id = ? AND therapist_id = ?`,
        [sessionId, therapistId]
    );
    if (!session) return null;

    const [rows] = await db.query(
        `SELECT * FROM prescriptions WHERE session_id = ? AND therapist_id = ?`,
        [sessionId, therapistId]
    );

    let currentRx = null;
    if (rows[0]) {
        const [items, medicines, tests] = await Promise.all([
            db.query(
                `SELECT id, item_type, title, youtube_url, is_active FROM care_plan_items WHERE prescription_id = ? ORDER BY item_type, id`,
                [rows[0].id]
            ).then(([r]) => r),
            db.query(
                `SELECT id, medicine_id, medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions
                 FROM prescription_medicines WHERE prescription_id = ? ORDER BY sort_order, id`,
                [rows[0].id]
            ).then(([r]) => r),
            db.query(
                `SELECT id, test_id, test_name, notes FROM prescription_tests WHERE prescription_id = ? ORDER BY sort_order, id`,
                [rows[0].id]
            ).then(([r]) => r),
        ]);
        currentRx = { ...rows[0], care_plan_items: items, medicines, tests };
    }

    // Look up previous prescriptions for this patient from earlier sessions
    const currentPrescriptionId = rows[0]?.id || 0;
    const [prevRows] = await db.query(
        `SELECT p.id, p.session_id, s.scheduled_date, p.session_notes, p.medications, p.created_at
         FROM prescriptions p
         JOIN sessions s ON s.id = p.session_id
         WHERE p.patient_id = ? AND p.id != ?
         ORDER BY s.scheduled_date DESC, p.created_at DESC`,
        [session.patient_id, currentPrescriptionId]
    );

    const previous_prescriptions = await Promise.all(
        prevRows.map(async (prev) => {
            const [prevMeds, prevTests] = await Promise.all([
                db.query(
                    `SELECT medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions
                     FROM prescription_medicines WHERE prescription_id = ? ORDER BY sort_order, id`,
                    [prev.id]
                ).then(([r]) => r),
                db.query(
                    `SELECT test_name, notes FROM prescription_tests WHERE prescription_id = ? ORDER BY sort_order, id`,
                    [prev.id]
                ).then(([r]) => r),
            ]);
            return {
                session_id: prev.session_id,
                scheduled_date: prev.scheduled_date,
                session_notes: prev.session_notes,
                medicines: prevMeds,
                tests: prevTests,
                created_at: prev.created_at
            };
        })
    );

    if (currentRx) {
        return { ...currentRx, previous_prescriptions };
    } else {
        return { previous_prescriptions };
    }
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

// Full prescription record for rendering a printable PDF — includes the
// doctor's letterhead info (name, qualification, hospital, license), the
// patient's contact details, and every medicine/test line. Used by both the
// therapist-side and patient-side PDF endpoints; ownerColumn scopes the
// lookup to whichever side is asking ('therapist_id' or 'patient_id').
const getFullPrescriptionForPdf = async (sessionId, ownerColumn, ownerId) => {
    if (!['therapist_id', 'patient_id'].includes(ownerColumn)) {
        throw new Error('Invalid owner column.');
    }

    const [rows] = await db.query(
        `SELECT
            p.id AS prescription_id, p.session_id, p.session_notes, p.medications,
            p.presession_summary, p.additional_briefing, p.created_at AS prescription_created_at,
            s.scheduled_date, s.time_slot, s.session_type,
            patient.id AS patient_id, patient.display_name AS patient_name,
            pp.contact_number AS patient_contact, pp.location AS patient_location,
            doctor.id AS therapist_id, doctor.display_name AS doctor_name,
            tp.qualification AS doctor_qualification, tp.hospital_name AS hospital_name,
            (SELECT ta.primary_license FROM therapist_applications ta
                WHERE ta.user_id = doctor.id AND ta.status = 'approved'
                ORDER BY ta.reviewed_at DESC LIMIT 1) AS license_number
         FROM prescriptions p
         JOIN sessions s ON s.id = p.session_id
         JOIN users patient ON patient.id = p.patient_id
         LEFT JOIN patient_profiles pp ON pp.user_id = patient.id
         JOIN users doctor ON doctor.id = p.therapist_id
         LEFT JOIN therapist_profiles tp ON tp.user_id = doctor.id
         WHERE p.session_id = ? AND p.${ownerColumn} = ?`,
        [sessionId, ownerId]
    );
    if (!rows[0]) return null;
    const record = rows[0];

    const [medicines, tests] = await Promise.all([
        db.query(
            `SELECT medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions
             FROM prescription_medicines WHERE prescription_id = ? ORDER BY sort_order, id`,
            [record.prescription_id]
        ).then(([r]) => r),
        db.query(
            `SELECT test_name, notes FROM prescription_tests WHERE prescription_id = ? ORDER BY sort_order, id`,
            [record.prescription_id]
        ).then(([r]) => r),
    ]);

    // Look up previous prescription for follow-up patients
    const [prevRows] = await db.query(
        `SELECT prev_p.id AS prev_prescription_id, prev_s.scheduled_date AS prev_session_date,
                prev_p.session_notes AS prev_session_notes, prev_p.created_at AS prev_created_at
         FROM prescriptions prev_p
         JOIN sessions prev_s ON prev_s.id = prev_p.session_id
         WHERE prev_p.patient_id = ? AND prev_p.id != ?
           AND (prev_s.scheduled_date < ? OR (prev_s.scheduled_date = ? AND prev_p.id < ?))
         ORDER BY prev_s.scheduled_date DESC, prev_p.created_at DESC
         LIMIT 1`,
        [record.patient_id, record.prescription_id, record.scheduled_date, record.scheduled_date, record.prescription_id]
    );

    let previous_prescription = null;
    if (prevRows[0]) {
        const prevRx = prevRows[0];
        const [prevMeds, prevTests] = await Promise.all([
            db.query(
                `SELECT medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions
                 FROM prescription_medicines WHERE prescription_id = ? ORDER BY sort_order, id`,
                [prevRx.prev_prescription_id]
            ).then(([r]) => r),
            db.query(
                `SELECT test_name, notes FROM prescription_tests WHERE prescription_id = ? ORDER BY sort_order, id`,
                [prevRx.prev_prescription_id]
            ).then(([r]) => r),
        ]);
        previous_prescription = {
            session_date: prevRx.prev_session_date,
            session_notes: prevRx.prev_session_notes,
            medicines: prevMeds,
            tests: prevTests
        };
    }

    return { ...record, medicines, tests, previous_prescription };
};

// List of completed sessions with full clinical prescription details
// for the logged-in patient's "My Prescriptions" page.
const getPrescriptionsListForPatient = async (patientId) => {
    const [rows] = await db.query(
        `SELECT
            s.id AS session_id, s.scheduled_date, s.time_slot, s.session_type, s.status,
            doctor.id AS doctor_id, COALESCE(doctor.display_name, doctor.name) AS doctor_name,
            tp.qualification AS doctor_qualification, tp.hospital_name AS hospital_name,
            tp.profile_photo_url AS doctor_photo,
            p.id AS prescription_id, p.session_notes, p.medications, p.presession_summary, p.additional_briefing,
            p.created_at AS prescription_created_at,
            p.follow_up_recommended, p.follow_up_date, p.follow_up_notes, p.follow_up_status, p.follow_up_responded_at
         FROM sessions s
         JOIN users doctor ON doctor.id = s.therapist_id
         LEFT JOIN therapist_profiles tp ON tp.user_id = doctor.id
         LEFT JOIN prescriptions p ON p.session_id = s.id
         WHERE s.patient_id = ? AND s.status = 'completed'
         ORDER BY COALESCE(p.created_at, s.created_at) DESC`,
        [patientId]
    );

    // Fetch medicines, tests, and care plan items for each completed prescription
    const fullList = await Promise.all(
        rows.map(async (row) => {
            if (!row.prescription_id) {
                return { ...row, medicines: [], tests: [], care_plan_items: [] };
            }
            const [medicines, tests, care_plan_items] = await Promise.all([
                db.query(
                    `SELECT medicine_name, dosage, frequency_code, frequency_label, duration_days, instructions
                     FROM prescription_medicines WHERE prescription_id = ? ORDER BY sort_order, id`,
                    [row.prescription_id]
                ).then(([r]) => r),
                db.query(
                    `SELECT test_name, notes FROM prescription_tests WHERE prescription_id = ? ORDER BY sort_order, id`,
                    [row.prescription_id]
                ).then(([r]) => r),
                db.query(
                    `SELECT item_type, title, youtube_url FROM care_plan_items WHERE prescription_id = ? ORDER BY item_type, id`,
                    [row.prescription_id]
                ).then(([r]) => r),
            ]);
            return { ...row, medicines, tests, care_plan_items };
        })
    );

    return fullList;
};

// Feature 6: Returns the newest prescription for this patient where
// care_plan_accepted = 0, together with its care plan items. Returns null
// when there is no pending care plan to show.
const getPendingCarePlan = async (patientId) => {
    const [rows] = await db.query(
        `SELECT p.id AS prescription_id, s.id AS session_id, s.scheduled_date,
                doctor.display_name AS doctor_name
         FROM prescriptions p
         JOIN sessions s ON s.id = p.session_id
         JOIN users doctor ON doctor.id = p.therapist_id
         WHERE p.patient_id = ? AND p.care_plan_accepted = 0
           AND s.status = 'completed'
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [patientId]
    );
    if (!rows[0]) return null;

    const record = rows[0];
    const [items] = await db.query(
        `SELECT id, item_type, title, youtube_url
         FROM care_plan_items
         WHERE prescription_id = ?
         ORDER BY item_type, id`,
        [record.prescription_id]
    );

    if (items.length === 0) return null; // no tasks to offer

    return { ...record, items };
};

// Feature 6: Patient accepts the care plan — marks it so the prompt won't show again.
const acceptCarePlan = async (prescriptionId, patientId) => {
    await db.query(
        `UPDATE prescriptions SET care_plan_accepted = 1
         WHERE id = ? AND patient_id = ?`,
        [prescriptionId, patientId]
    );
};

// Newest prescription for this patient that has a follow-up proposed and
// not yet responded to — used to show the accept/decline prompt card.
const getPendingFollowUp = async (patientId) => {
    const [rows] = await db.query(
        `SELECT p.id AS prescription_id, p.follow_up_date, p.follow_up_notes,
                s.id AS session_id, doctor.display_name AS doctor_name
         FROM prescriptions p
         JOIN sessions s ON s.id = p.session_id
         JOIN users doctor ON doctor.id = p.therapist_id
         WHERE p.patient_id = ? AND p.follow_up_status = 'proposed'
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [patientId]
    );
    return rows[0] || null;
};

// Patient accepts or declines the proposed follow-up. Returns the row
// (including therapist_id) so the controller can notify the therapist.
const respondToFollowUp = async (prescriptionId, patientId, accept) => {
    const [result] = await db.query(
        `UPDATE prescriptions
         SET follow_up_status = ?, follow_up_responded_at = NOW()
         WHERE id = ? AND patient_id = ? AND follow_up_status = 'proposed'`,
        [accept ? 'accepted' : 'declined', prescriptionId, patientId]
    );
    if (result.affectedRows === 0) return null;

    const [rows] = await db.query(
        `SELECT therapist_id, follow_up_date FROM prescriptions WHERE id = ?`,
        [prescriptionId]
    );
    return rows[0] || null;
};

module.exports = {
    upsertPrescription,
    replaceCarePlanItems,
    replaceMedicines,
    replaceTests,
    getPrescriptionBySession,
    getPrescriptionsForPatient,
    getFullPrescriptionForPdf,
    getPrescriptionsListForPatient,
    getPendingCarePlan,
    acceptCarePlan,
    getPendingFollowUp,
    respondToFollowUp,
};
