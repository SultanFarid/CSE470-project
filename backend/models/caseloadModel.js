const db = require('../config/db');

// Every distinct patient this therapist has ever had a session with, plus
// a 7-day daily-care-plan adherence % computed from care_plan_logs.
// active_items = how many exercise/medication items are currently on their plan.
// checkins_last_7d = how many of those were actually ticked off in the last 7 days.
const getMyCaseload = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT
            u.id AS patient_id,
            COALESCE(u.display_name, u.email) AS patient_name,
            u.email,
            COUNT(DISTINCT s.id) AS total_sessions,
            MAX(COALESCE(s.scheduled_date, DATE(s.created_at))) AS last_session_date,
            (SELECT COUNT(*) FROM care_plan_items cpi
                WHERE cpi.patient_id = u.id AND cpi.therapist_id = ? AND cpi.is_active = 1) AS active_items,
            (SELECT COUNT(*) FROM care_plan_logs cpl
                JOIN care_plan_items cpi2 ON cpi2.id = cpl.care_plan_item_id
                WHERE cpi2.patient_id = u.id AND cpi2.therapist_id = ?
                  AND cpl.log_date >= CURDATE() - INTERVAL 6 DAY) AS checkins_last_7d,
            (SELECT COUNT(*) FROM care_plan_logs cpl
                JOIN care_plan_items cpi3 ON cpi3.id = cpl.care_plan_item_id
                WHERE cpi3.patient_id = u.id AND cpi3.therapist_id = ?
                  AND cpl.log_date = CURDATE()) AS checkins_today,
            (SELECT s3.id FROM sessions s3
                WHERE s3.patient_id = u.id AND s3.therapist_id = ?
                ORDER BY COALESCE(s3.scheduled_date, DATE(s3.created_at)) DESC, s3.created_at DESC
                LIMIT 1) AS last_session_id
        FROM sessions s
        JOIN users u ON u.id = s.patient_id
        WHERE s.therapist_id = ?
        GROUP BY u.id, u.display_name, u.email
        ORDER BY last_session_date DESC`,
        [therapistId, therapistId, therapistId, therapistId, therapistId]
    );

    // Adherence % = check-ins over the last 7 days vs. the maximum possible
    // (active items x 7 days). Null (not 0%) when the patient has no active
    // care plan yet, since "no plan" and "ignoring their plan" aren't the same thing.
    return rows.map((r) => {
        const possible = r.active_items * 7;
        const adherence_rate = possible > 0 ? Math.round((r.checkins_last_7d / possible) * 100) : null;
        return { ...r, adherence_rate };
    });
};

module.exports = { getMyCaseload };
