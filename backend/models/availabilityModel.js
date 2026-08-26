const db = require('../config/db');

// ===== Weekly recurring template (the base "standard week") =====

const getWeeklyTemplate = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT id, day_of_week, start_time, end_time
         FROM therapist_availability
         WHERE therapist_id = ?
         ORDER BY day_of_week ASC, start_time ASC`,
        [therapistId]
    );
    return rows;
};

// Replace-all: delete the therapist's current week, insert the new one.
// Wrapped in a transaction so a failed insert can't leave them with an empty schedule.
const replaceWeeklyTemplate = async (therapistId, slots) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`DELETE FROM therapist_availability WHERE therapist_id = ?`, [therapistId]);

        if (slots.length > 0) {
            const values = slots.map((s) => [therapistId, s.day_of_week, s.start_time, s.end_time]);
            await connection.query(
                `INSERT INTO therapist_availability (therapist_id, day_of_week, start_time, end_time) VALUES ?`,
                [values]
            );
        }

        await connection.commit();
    } catch (err) {
        await connection.rollback();
        throw err;
    } finally {
        connection.release();
    }
};

// ===== Per-therapist schedule settings (slot size, buffer) =====

const getScheduleSettings = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT slot_duration_minutes, buffer_minutes, last_confirmed_at
         FROM therapist_schedule_settings
         WHERE therapist_id = ?`,
        [therapistId]
    );
    return rows[0] || { slot_duration_minutes: 30, buffer_minutes: 0, last_confirmed_at: null };
};

// Called every time ScheduleManager saves — this doubles as the therapist's
// "yes, this is confirmed" signal, which the weekend reminder job checks
// against so it stops nagging once they've actually looked at it.
const upsertScheduleSettings = async (therapistId, slotDurationMinutes, bufferMinutes) => {
    await db.query(
        `INSERT INTO therapist_schedule_settings (therapist_id, slot_duration_minutes, buffer_minutes, last_confirmed_at)
         VALUES (?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
            slot_duration_minutes = VALUES(slot_duration_minutes),
            buffer_minutes = VALUES(buffer_minutes),
            last_confirmed_at = NOW()`,
        [therapistId, slotDurationMinutes, bufferMinutes]
    );
};

// ===== Date-specific exceptions (vacation days / custom hours) =====

const getExceptions = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT id, exception_date, type, start_time, end_time, reason
         FROM therapist_availability_exceptions
         WHERE therapist_id = ? AND exception_date >= CURDATE()
         ORDER BY exception_date ASC`,
        [therapistId]
    );
    return rows;
};

const getExceptionsInRange = async (therapistId, fromDate, toDate) => {
    const [rows] = await db.query(
        `SELECT id, exception_date, type, start_time, end_time, reason
         FROM therapist_availability_exceptions
         WHERE therapist_id = ? AND exception_date BETWEEN ? AND ?
         ORDER BY exception_date ASC`,
        [therapistId, fromDate, toDate]
    );
    return rows;
};

const addException = async (therapistId, { exceptionDate, type, startTime, endTime, reason }) => {
    const [result] = await db.query(
        `INSERT INTO therapist_availability_exceptions
            (therapist_id, exception_date, type, start_time, end_time, reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [therapistId, exceptionDate, type, startTime || null, endTime || null, reason || null]
    );
    return result.insertId;
};

const deleteException = async (id, therapistId) => {
    const [result] = await db.query(
        `DELETE FROM therapist_availability_exceptions WHERE id = ? AND therapist_id = ?`,
        [id, therapistId]
    );
    return result.affectedRows;
};

module.exports = {
    getWeeklyTemplate,
    replaceWeeklyTemplate,
    getScheduleSettings,
    upsertScheduleSettings,
    getExceptions,
    getExceptionsInRange,
    addException,
    deleteException
};
