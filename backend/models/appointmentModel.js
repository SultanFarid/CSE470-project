const db = require('../config/db');

const AppointmentModel = {
    create: async (patientId, therapistId, appointmentDate, timeSlot, sessionType) => {
        const query = `
            INSERT INTO appointments (patient_id, therapist_id, appointment_date, time_slot, session_type, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        `;
        const [result] = await db.query(query, [patientId, therapistId, appointmentDate, timeSlot, sessionType || 'online']);
        return result;
    },

    getByPatientId: async (patientId) => {
        const query = `
            SELECT 
                a.id,
                a.patient_id,
                a.therapist_id,
                a.appointment_date,
                a.time_slot,
                a.session_type,
                a.status,
                a.created_at,
                u.name AS therapist_name,
                tp.profile_photo_url AS therapist_photo,
                tp.specialties AS therapist_specialties,
                tp.consultation_fee
            FROM appointments a
            JOIN users u ON a.therapist_id = u.id
            LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.created_at DESC
        `;
        const [rows] = await db.query(query, [patientId]);
        return rows;
    },

    cancel: async (appointmentId, patientId) => {
        const query = `
            UPDATE appointments
            SET status = 'cancelled'
            WHERE id = ? AND patient_id = ?
        `;
        const [result] = await db.query(query, [appointmentId, patientId]);
        return result;
    },

    getBookedSlots: async (therapistId, appointmentDate) => {
        const query = `
            SELECT time_slot
            FROM appointments
            WHERE therapist_id = ? AND appointment_date = ? AND status != 'cancelled'
        `;
        const [rows] = await db.query(query, [therapistId, appointmentDate]);
        return rows.map(r => r.time_slot);
    }
};

module.exports = AppointmentModel;
