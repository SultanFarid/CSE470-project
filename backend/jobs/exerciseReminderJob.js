const cron = require('node-cron');
const db = require('../config/db');

const EXERCISE_REMINDER_MESSAGE =
    "Don't forget to complete today's exercises and daily checklist!";
const EXERCISE_REMINDER_TYPE = 'exercise_reminder';

/**
 * Checks if this patient already received today's exercise reminder,
 * and inserts one if not. Safe to call multiple times a day —
 * it will only ever send once per calendar day per patient.
 */
const sendReminderIfNeededForPatient = async (patientId) => {
    const [existing] = await db.query(
        `SELECT id FROM notifications 
         WHERE user_id = ? AND type = ? AND DATE(created_at) = CURDATE()`,
        [patientId, EXERCISE_REMINDER_TYPE]
    );

    if (existing.length > 0) {
        return false; // already sent today
    }

    await db.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
        [patientId, EXERCISE_REMINDER_MESSAGE, EXERCISE_REMINDER_TYPE]
    );
    return true; // newly sent
};

/**
 * Feature 19 — Trigger 1: Daily Exercise Reminder
 *
 * Every day at 08:00 server time, this inserts a reminder notification
 * for every active patient, nudging them to complete their daily
 * exercises/checklist. Runs independently of any user action.
 *
 * This is the batch/scheduled path — for patients who log in later
 * in the day (after the cron already ran, or when the server was down
 * at 08:00), see sendReminderIfNeededForPatient() which is called on
 * login instead so no one misses their daily reminder.
 */
const startExerciseReminderJob = () => {
    cron.schedule('0 8 * * *', async () => {
        try {
            const [patients] = await db.query(
                `SELECT id FROM users WHERE role = 'patient' AND status = 'active'`
            );

            if (patients.length === 0) return;

            let sentCount = 0;
            for (const p of patients) {
                const sent = await sendReminderIfNeededForPatient(p.id);
                if (sent) sentCount++;
            }

            console.log(
                `[cron] Sent daily exercise reminders to ${sentCount} patient(s).`
            );
        } catch (err) {
            console.error('[cron] Failed to send exercise reminders:', err);
        }
    });

    console.log('[cron] Daily exercise reminder job scheduled (08:00 daily).');
};

module.exports = { startExerciseReminderJob, sendReminderIfNeededForPatient };