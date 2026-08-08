const db = require('../config/db');

const getTotalPatients = async () => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'patient'`
    );
    return rows[0].total;
};

const getActiveTherapists = async () => {
    const [rows] = await db.query(
        `SELECT COUNT(*) AS total FROM users WHERE role = 'therapist' AND status = 'active'`
    );
    return rows[0].total;
};

const getSessionsByMonth = async () => {
    const [rows] = await db.query(`
        SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
        FROM sessions
        WHERE status = 'completed'
        GROUP BY month
        ORDER BY month ASC
    `);
    return rows;
};

const getAppointmentRatio = async () => {
    const [rows] = await db.query(`
        SELECT status, COUNT(*) AS count
        FROM sessions
        WHERE status IN ('confirmed', 'cancelled')
        GROUP BY status
    `);
    const result = { confirmed: 0, cancelled: 0 };
    rows.forEach((r) => { result[r.status] = r.count; });
    return result;
};

const getTotalRevenue = async () => {
    const [rows] = await db.query(
        `SELECT COALESCE(SUM(fee), 0) AS total FROM sessions WHERE status = 'completed'`
    );
    return rows[0].total;
};

module.exports = {
    getTotalPatients,
    getActiveTherapists,
    getSessionsByMonth,
    getAppointmentRatio,
    getTotalRevenue
};