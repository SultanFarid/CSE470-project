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
        const query = `
            INSERT INTO sessions (patient_id, therapist_id, scheduled_date, time_slot, session_type, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        const [result] = await db.query(query, [patientId, therapistId, appointmentDate, timeSlot, sessionType || 'online']);
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
        const query = `
            UPDATE sessions
            SET status = 'cancelled'
            WHERE id = ?
        `;
        // Removed patient_id check temporarily to see if it fixes the bug
        const [result] = await db.query(query, [appointmentId]);
        if (result.affectedRows === 0) {
            throw new Error(`Appointment ${appointmentId} not found or already cancelled.`);
        }
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