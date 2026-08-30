const db = require('../config/db');

const getSummary = async (therapistId) => {
    const [[totals]] = await db.query(
        `SELECT
            COUNT(CASE WHEN status = 'completed' THEN 1 END) AS completed_sessions,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN fee ELSE 0 END), 0) AS total_revenue,
            COUNT(CASE WHEN status IN ('pending', 'confirmed', 'in_progress') THEN 1 END) AS upcoming_sessions,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_sessions,
            -- "Estimated earnings" — fee from sessions that are booked and
            -- confirmed but haven't happened (or been paid out) yet. This is
            -- a forecast, distinct from total_revenue which only counts
            -- sessions that actually completed.
            COUNT(CASE WHEN status = 'confirmed' THEN 1 END) AS confirmed_sessions,
            COALESCE(SUM(CASE WHEN status = 'confirmed' THEN fee ELSE 0 END), 0) AS estimated_earnings
         FROM sessions
         WHERE therapist_id = ?`,
        [therapistId]
    );

    const [[thisMonth]] = await db.query(
        `SELECT COALESCE(SUM(fee), 0) AS revenue, COUNT(*) AS sessions
         FROM sessions
         WHERE therapist_id = ? AND status = 'completed'
           AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())`,
        [therapistId]
    );

    const [monthlyBreakdown] = await db.query(
        `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
                COUNT(*) AS sessions,
                COALESCE(SUM(fee), 0) AS revenue
         FROM sessions
         WHERE therapist_id = ? AND status = 'completed'
           AND created_at >= CURDATE() - INTERVAL 6 MONTH
         GROUP BY month
         ORDER BY month ASC`,
        [therapistId]
    );

    return {
        completedSessions: totals.completed_sessions,
        totalRevenue: Number(totals.total_revenue),
        upcomingSessions: totals.upcoming_sessions,
        cancelledSessions: totals.cancelled_sessions,
        confirmedSessions: totals.confirmed_sessions,
        estimatedEarnings: Number(totals.estimated_earnings),
        currentMonthRevenue: Number(thisMonth.revenue),
        currentMonthSessions: thisMonth.sessions,
        monthlyBreakdown
    };
};

module.exports = { getSummary };
