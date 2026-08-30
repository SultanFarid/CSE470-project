const db = require('../config/db');

// Repointed from a nonexistent `appointments` table to the real `sessions`
// table (see smart_therapy_db.sql — `appointments` was never created; it
// was a relic of a branch that didn't get reconciled during merging).
// `sessions` already backs sessionController/prescriptionModel/caseloadModel.
// `time_slot` is a nullable column added by migration_add_time_slot_to_sessions.sql
// specifically so this patient-facing booking flow can keep storing the
// human-readable slot range (e.g. "10:00 AM - 10:50 AM"); everything else
// used below (patient_id, therapist_id, scheduled_date, session_type,
// status) already existed on `sessions`.
// Output field names (appointment_date, time_slot, therapist_name, etc.)
// are kept identical to before so no frontend changes are needed.

const AppointmentModel = {
    create: async (patientId, therapistId, appointmentDate, timeSlot, sessionType) => {
        // Prevent double-booking: check if another active session already occupies this slot
        const [existing] = await db.query(
            `SELECT id FROM sessions 
             WHERE therapist_id = ? AND scheduled_date = ? AND time_slot = ? AND status != 'cancelled'`,
            [therapistId, appointmentDate, timeSlot]
        );
        if (existing.length > 0) {
            const err = new Error('This time slot is already booked. Please choose another time slot.');
            err.statusCode = 409;
            throw err;
        }

        // Snapshot the therapist's current listed fee onto the session at
        // booking time. Without this `sessions.fee` stays NULL forever (it's
        // never set anywhere else), which silently zeroes out Earnings /
        // the wallet for every real, patient-booked session. Snapshotting
        // (rather than joining therapist_profiles live everywhere) also
        // means a later fee change by the therapist doesn't retroactively
        // change what a past session was billed at.
        const [[profile]] = await db.query(
            `SELECT consultation_fee FROM therapist_profiles WHERE user_id = ?`,
            [therapistId]
        );
        const fee = profile?.consultation_fee ?? null;

        const query = `
            INSERT INTO sessions (patient_id, therapist_id, scheduled_date, time_slot, session_type, status, fee)
            VALUES (?, ?, ?, ?, ?, 'pending', ?)
        `;
        const [result] = await db.query(query, [patientId, therapistId, appointmentDate, timeSlot, sessionType || 'online', fee]);
        return result;
    },

    getByPatientId: async (patientId) => {
        const query = `
            SELECT 
                s.id,
                s.patient_id,
                s.therapist_id,
                s.scheduled_date AS appointment_date,
                s.time_slot,
                s.session_type,
                s.status,
                s.created_at,
                COALESCE(u.display_name, u.name) AS therapist_name,
                tp.profile_photo_url AS therapist_photo,
                tp.specialties AS therapist_specialties,
                tp.consultation_fee
            FROM sessions s
            JOIN users u ON s.therapist_id = u.id
            LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
            WHERE s.patient_id = ?
            ORDER BY s.scheduled_date DESC, s.created_at DESC
        `;
        const [rows] = await db.query(query, [patientId]);
        return rows;
    },

    cancel: async (appointmentId, patientId) => {
        // Only pending or confirmed appointments can be cancelled (completed sessions cannot be cancelled)
        let query = `
            UPDATE sessions
            SET status = 'cancelled'
            WHERE id = ? AND status IN ('pending', 'confirmed')
        `;
        const params = [appointmentId];

        if (patientId) {
            query += ` AND patient_id = ?`;
            params.push(patientId);
        }

        const [result] = await db.query(query, params);
        return result;
    },

    getBookedSlots: async (therapistId, appointmentDate) => {
        const query = `
            SELECT time_slot
            FROM sessions
            WHERE therapist_id = ? AND scheduled_date = ? AND status != 'cancelled' AND time_slot IS NOT NULL
        `;
        const [rows] = await db.query(query, [therapistId, appointmentDate]);
        return rows.map(r => r.time_slot);
    }
};

module.exports = AppointmentModel;