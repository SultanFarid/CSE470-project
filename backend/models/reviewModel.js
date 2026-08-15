const db = require('../config/db');

const ReviewModel = {
    create: async (appointmentId, patientId, therapistId, rating, tags) => {
        const tagsString = Array.isArray(tags) ? JSON.stringify(tags) : tags;
        const query = `
            INSERT INTO therapist_reviews (appointment_id, patient_id, therapist_id, rating, tags)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await db.query(query, [appointmentId, patientId, therapistId, rating, tagsString]);
        return result;
    },

    getByAppointmentId: async (appointmentId) => {
        const query = `
            SELECT * FROM therapist_reviews WHERE appointment_id = ?
        `;
        const [rows] = await db.query(query, [appointmentId]);
        return rows[0] || null;
    },

    getPendingReviewForPatient: async (patientId) => {
        // Find most recent completed appointment for this patient without a review
        const query = `
            SELECT 
                a.id AS appointment_id,
                a.appointment_date,
                a.time_slot,
                a.session_type,
                a.therapist_id,
                u.name AS therapist_name,
                tp.profile_photo_url AS therapist_photo,
                tp.specialties AS therapist_specialties
            FROM appointments a
            JOIN users u ON a.therapist_id = u.id
            LEFT JOIN therapist_profiles tp ON u.id = tp.user_id
            LEFT JOIN therapist_reviews tr ON a.id = tr.appointment_id
            WHERE a.patient_id = ? AND a.status = 'completed' AND tr.id IS NULL
            ORDER BY a.appointment_date DESC, a.id DESC
            LIMIT 1
        `;
        const [rows] = await db.query(query, [patientId]);
        return rows[0] || null;
    },

    getTherapistFeedbackSummary: async (therapistId) => {
        const query = `
            SELECT rating, tags
            FROM therapist_reviews
            WHERE therapist_id = ?
        `;
        const [rows] = await db.query(query, [therapistId]);
        
        if (rows.length === 0) {
            return {
                averageRating: 5.0,
                reviewCount: 0,
                tagCounts: {}
            };
        }

        const totalRating = rows.reduce((sum, r) => sum + r.rating, 0);
        const tagCounts = {};

        rows.forEach(r => {
            let parsedTags = [];
            try {
                parsedTags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
            } catch (e) {
                parsedTags = typeof r.tags === 'string' ? r.tags.split(',').map(s => s.trim()) : [];
            }

            if (Array.isArray(parsedTags)) {
                parsedTags.forEach(tag => {
                    if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        return {
            averageRating: Number((totalRating / rows.length).toFixed(1)),
            reviewCount: rows.length,
            tagCounts
        };
    },

    // Compact summary for the therapist's own Command Center dashboard
    // (reputation card). Reuses therapist_reviews — same data source as
    // getTherapistFeedbackSummary above, reshaped to
    // { totalReviews, avgRating, topTags }.
    getMySummary: async (therapistId) => {
        const query = `
            SELECT rating, tags FROM therapist_reviews WHERE therapist_id = ?
        `;
        const [rows] = await db.query(query, [therapistId]);

        if (rows.length === 0) {
            return { totalReviews: 0, avgRating: '0.0', topTags: [] };
        }

        const totalRating = rows.reduce((sum, r) => sum + r.rating, 0);
        const tagCounts = {};

        rows.forEach(r => {
            let parsedTags = [];
            try {
                parsedTags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
            } catch (e) {
                parsedTags = typeof r.tags === 'string' ? r.tags.split(',').map(s => s.trim()) : [];
            }
            if (Array.isArray(parsedTags)) {
                parsedTags.forEach(tag => {
                    if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });

        const topTags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag]) => tag);

        return {
            totalReviews: rows.length,
            avgRating: (totalRating / rows.length).toFixed(1),
            topTags
        };
    },

    getAllTherapistReviewSummaries: async () => {
        const query = `
            SELECT therapist_id, rating, tags
            FROM therapist_reviews
        `;
        const [rows] = await db.query(query);
        
        const summaryMap = {};

        rows.forEach(r => {
            if (!summaryMap[r.therapist_id]) {
                summaryMap[r.therapist_id] = { totalRating: 0, count: 0, tagCounts: {} };
            }
            summaryMap[r.therapist_id].totalRating += r.rating;
            summaryMap[r.therapist_id].count += 1;

            let parsedTags = [];
            try {
                parsedTags = typeof r.tags === 'string' ? JSON.parse(r.tags) : (r.tags || []);
            } catch (e) {
                parsedTags = typeof r.tags === 'string' ? r.tags.split(',').map(s => s.trim()) : [];
            }

            if (Array.isArray(parsedTags)) {
                parsedTags.forEach(tag => {
                    if (tag) {
                        summaryMap[r.therapist_id].tagCounts[tag] = (summaryMap[r.therapist_id].tagCounts[tag] || 0) + 1;
                    }
                });
            }
        });

        const result = {};
        Object.keys(summaryMap).forEach(therapistId => {
            const item = summaryMap[therapistId];
            result[therapistId] = {
                averageRating: Number((item.totalRating / item.count).toFixed(1)),
                reviewCount: item.count,
                tagCounts: item.tagCounts
            };
        });

        return result;
    }
};

module.exports = ReviewModel;
