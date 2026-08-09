const cron = require('node-cron');
const db = require('../config/db');

const BOOK_SESSION_REMINDER_MESSAGE =
    "It's been a week since your last session. Ready to book your next one?";
const BOOK_SESSION_REMINDER_TYPE = 'book_session_reminder';

/**
 * Checks whether this patient's most recent completed session was at
 * least 7 days ago, and they haven't booked/had any session since.
 */
const needsBookNextSessionReminder = async (patientId) => {
    const [rows] = await db.query(
        `SELECT MAX(created_at) AS last_completed
         FROM sessions
         WHERE patient_id = ? AND status = 'completed'`,
        [patientId]
    );
    const lastCompleted = rows[0]?.last_completed;
    if (!lastCompleted) return false; // never had a completed session

    // Has the patient had any session (of any status) since that one?
    const [newerSessions] = await db.query(
        `SELECT id FROM sessions WHERE patient_id = ? AND created_at > ? AND status != 'cancelled'`,
        [patientId, lastCompleted]
    );
    if (newerSessions.length > 0) return false; // already booked something

    const daysSince =
        (Date.now() - new Date(lastCompleted).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 7;
};

/**
 * Checks if this patient already received today's "book next session"
 * reminder, and sends one if they need it and haven't gotten it yet
 * today. Safe to call multiple times a day.
 */
const sendBookNextSessionReminderIfNeeded = async (patientId) => {
    const [existing] = await db.query(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND type = ? AND DATE(created_at) = CURDATE()`,
        [patientId, BOOK_SESSION_REMINDER_TYPE]
    );
    if (existing.length > 0) return false; // already sent today

    const needsReminder = await needsBookNextSessionReminder(patientId);
    if (!needsReminder) return false;

    await db.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
        [patientId, BOOK_SESSION_REMINDER_MESSAGE, BOOK_SESSION_REMINDER_TYPE]
    );
    return true;
};

/**
 * Feature 19 — Trigger 2: "Book Your Next Session" Reminder
 *
 * Every day at 09:00 server time, checks every active patient and sends
 * a reminder if it's been 7+ days since their last completed session
 * with no newer session booked. This is the batch/scheduled path — for
 * patients who log in later in the day (after 09:00, or when the server
 * was down at 09:00), see sendBookNextSessionReminderIfNeeded() which
 * is also called on login so no one misses their reminder.
 */
const startBookNextSessionJob = () => {
    cron.schedule('0 9 * * *', async () => {
        try {
            const [patients] = await db.query(
                `SELECT id FROM users WHERE role = 'patient' AND status = 'active'`
            );

            if (patients.length === 0) return;

            let sentCount = 0;
            for (const p of patients) {
                const sent = await sendBookNextSessionReminderIfNeeded(p.id);
                if (sent) sentCount++;
            }

            console.log(
                `[cron] Sent "book next session" reminders to ${sentCount} patient(s).`
            );
        } catch (err) {
            console.error('[cron] Failed to send book-next-session reminders:', err);
        }
    });

    console.log('[cron] Book-next-session reminder job scheduled (09:00 daily).');
};

module.exports = { startBookNextSessionJob, sendBookNextSessionReminderIfNeeded };