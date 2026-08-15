const ReviewModel = require('../models/reviewModel');

exports.submitReview = async (req, res) => {
    const patientId = req.user?.id || req.userId;
    const { appointment_id, therapist_id, rating, tags } = req.body;

    if (!patientId) {
        return res.status(401).json({ message: "Unauthorized access. Please log in again." });
    }

    if (!therapist_id || !rating) {
        return res.status(400).json({ message: "Therapist ID and star rating (1-5) are required." });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ message: "Star rating must be an integer between 1 and 5." });
    }

    try {
        // If appointment_id is provided, check if it's already reviewed
        if (appointment_id) {
            const existing = await ReviewModel.getByAppointmentId(appointment_id);
            if (existing) {
                return res.status(400).json({ message: "A review has already been submitted for this session." });
            }
        }

        // Default appointment_id to 1 if testing without appointment
        const finalAppointmentId = appointment_id || 1;

        await ReviewModel.create(finalAppointmentId, patientId, therapist_id, numericRating, tags || []);

        return res.status(201).json({
            message: "Thank you! Your feedback has been recorded and will help improve therapist recommendations."
        });
    } catch (err) {
        console.error("Error submitting review:", err);
        return res.status(500).json({ message: "Failed to submit review due to a server error." });
    }
};

exports.getPendingReview = async (req, res) => {
    const patientId = req.user?.id || req.userId;

    if (!patientId) {
        return res.status(401).json({ message: "Unauthorized access." });
    }

    try {
        const pending = await ReviewModel.getPendingReviewForPatient(patientId);
        return res.status(200).json({
            hasPending: !!pending,
            review: pending || null
        });
    } catch (err) {
        console.error("Error checking pending review:", err);
        return res.status(500).json({ message: "Failed to check pending review status." });
    }
};

exports.getTherapistSummary = async (req, res) => {
    const { therapistId } = req.params;
    try {
        const summary = await ReviewModel.getTherapistFeedbackSummary(therapistId);
        return res.status(200).json(summary);
    } catch (err) {
        console.error("Error fetching therapist review summary:", err);
        return res.status(500).json({ message: "Failed to load review summary." });
    }
};

exports.getAllTherapistSummaries = async (req, res) => {
    try {
        const summaries = await ReviewModel.getAllTherapistReviewSummaries();
        return res.status(200).json(summaries);
    } catch (err) {
        console.error("Error fetching all review summaries:", err);
        return res.status(500).json({ message: "Failed to load review summaries." });
    }
};

// Therapist's own Command Center reputation card.
exports.getMySummary = async (req, res) => {
    try {
        const summary = await ReviewModel.getMySummary(req.user.id);
        res.status(200).json({ success: true, data: summary });
    } catch (err) {
        console.error('Get review summary error:', err);
        res.status(500).json({ message: 'Server error fetching review summary.' });
    }
};
