const AppointmentModel = require('../models/appointmentModel');
const NotificationModel = require('../models/notificationModel');
const UserModel = require('../models/userModel');

exports.getAppointments = async (req, res) => {
    const userId = req.user?.id || req.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized access. Please log in again." });
    }
    try {
        const appointments = await AppointmentModel.getByPatientId(userId);
        return res.status(200).json(appointments);
    } catch (err) {
        console.error("Error fetching appointments:", err);
        return res.status(500).json({ message: "Failed to load appointments." });
    }
};

exports.bookAppointment = async (req, res) => {
    const userId = req.user?.id || req.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized access. Please log in again." });
    }
    const { therapist_id, appointment_date, time_slot, session_type } = req.body;
    if (!therapist_id || !appointment_date || !time_slot) {
        return res.status(400).json({ message: "Missing required fields for appointment booking." });
    }
    try {
        const result = await AppointmentModel.create(userId, therapist_id, appointment_date, time_slot, session_type || 'online');

        // Feature 19: "The therapist can receive alerts when a new patient
        // books a time slot with them." — this never fired before; wired up
        // as a fire-and-forget notification so a failure here can't block
        // the booking itself from succeeding.
        try {
            const patient = await UserModel.findById(userId);
            const formattedDate = new Date(appointment_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            await NotificationModel.createNotification(
                therapist_id,
                `${patient?.display_name || 'A patient'} booked a session with you on ${formattedDate} at ${time_slot}.`,
                'appointment_booked'
            );
        } catch (notifyErr) {
            console.error('Failed to notify therapist of new booking:', notifyErr);
        }

        return res.status(201).json({ 
            message: "Appointment booked successfully!", 
            appointmentId: result.insertId 
        });
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).json({ message: err.message });
        }
        console.error("Error booking appointment:", err);
        return res.status(500).json({ message: "Failed to book appointment." });
    }
};

exports.cancelAppointment = async (req, res) => {
    const userId = req.user?.id || req.userId;
    if (!userId) {
        return res.status(401).json({ message: "Unauthorized access. Please log in again." });
    }
    const appointmentId = req.params.id;
    try {
        const db = require('../config/db');
        const [rows] = await db.query(
            `SELECT s.id, s.therapist_id, s.scheduled_date, s.time_slot, u.display_name AS patient_name
             FROM sessions s
             JOIN users u ON u.id = s.patient_id
             WHERE s.id = ? AND s.patient_id = ?`,
            [appointmentId, userId]
        );
        const appt = rows[0];

        const result = await AppointmentModel.cancel(appointmentId, userId);
        if (result.affectedRows === 0) {
            return res.status(409).json({ message: "This appointment can no longer be cancelled." });
        }

        if (appt) {
            try {
                const dateStr = appt.scheduled_date
                    ? new Date(appt.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : '';
                const timeStr = appt.time_slot ? ` (${appt.time_slot})` : '';
                await NotificationModel.createNotification(
                    appt.therapist_id,
                    `${appt.patient_name || 'A patient'} cancelled their appointment on ${dateStr}${timeStr}.`,
                    'appointment_cancelled'
                );
            } catch (notifErr) {
                console.error('Failed to notify therapist of cancellation:', notifErr);
            }
        }

        return res.status(200).json({ message: "Appointment cancelled successfully." });
    } catch (err) {
        console.error("Error cancelling appointment:", err);
        return res.status(500).json({ message: "Failed to cancel appointment." });
    }
};

exports.getTherapistSlots = async (req, res) => {
    const { therapistId, date } = req.query;
    if (!therapistId || !date) {
        return res.status(400).json({ message: "Therapist ID and date are required." });
    }
    try {
        const bookedSlots = await AppointmentModel.getBookedSlots(therapistId, date);
        return res.status(200).json({ bookedSlots });
    } catch (err) {
        console.error("Error fetching slots:", err);
        return res.status(500).json({ message: "Failed to fetch slots." });
    }
};
