const AppointmentModel = require('../models/appointmentModel');

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
        return res.status(201).json({ 
            message: "Appointment booked successfully!", 
            appointmentId: result.insertId 
        });
    } catch (err) {
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
        await AppointmentModel.cancel(appointmentId, userId);
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
