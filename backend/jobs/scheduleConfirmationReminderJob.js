const cron = require('node-cron');
const db = require('../config/db');

const SCHEDULE_REMINDER_MESSAGE =
    "Set your schedule for next week so patients can book you — head to Schedule Manager.";
const SCHEDULE_REMINDER_TYPE = 'schedule_confirmation_reminder';

// A therapist "needs" the nudge if they've never confirmed a schedule, or
// their last confirmation is more than 6 days old (i.e. it predates this
// week and hasn't been re-checked for the week ahead).
const needsScheduleConfirmation = async (therapistId) => {
    const [rows] = await db.query(
        `SELECT last_confirmed_at FROM therapist_schedule_settings WHERE therapist_id = ?`,
        [therapistId]
    );
    const lastConfirmedAt = rows[0]?.last_confirmed_at;
    if (!lastConfirmedAt) return true;

    const daysSince = (Date.now() - new Date(lastConfirmedAt).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 6;
};

/**
 * Checks if this therapist already got today's reminder, and sends one if
 * they still need to confirm and haven't been nudged yet today. Safe to
 * call multiple times a day — only ever inserts one per calendar day.
 */
const sendScheduleReminderIfNeeded = async (therapistId) => {
    const needed = await needsScheduleConfirmation(therapistId);
    if (!needed) return false;

    const [existing] = await db.query(
        `SELECT id FROM notifications
         WHERE user_id = ? AND type = ? AND DATE(created_at) = CURDATE()`,
        [therapistId, SCHEDULE_REMINDER_TYPE]
    );
    if (existing.length > 0) return false; // already nudged today

    await db.query(
        `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
        [therapistId, SCHEDULE_REMINDER_MESSAGE, SCHEDULE_REMINDER_TYPE]
    );
    return true;
};

/**
 * Weekend Schedule-Confirmation Reminder
 *
 * Every day at 09:00 server time, this checks whether it's currently the
 * weekend (Fri/Sat/Sun — the window a therapist is expected to lock in
 * next week's hours). If so, every active therapist who hasn't confirmed
 * their schedule in the last 6 days gets a reminder notification. It
 * repeats daily through the weekend — so a therapist who ignores Friday's
 * nudge still gets one Saturday and Sunday — and stops the moment they
 * save their schedule in ScheduleManager (which stamps last_confirmed_at).
 */
const startScheduleConfirmationReminderJob = () => {
    cron.schedule('0 9 * * *', async () => {
        const dayOfWeek = new Date().getDay(); // 0=Sun, 5=Fri, 6=Sat
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
        if (!isWeekend) return;

        try {
            const [therapists] = await db.query(
                `SELECT id FROM users WHERE role = 'therapist' AND status = 'active'`
            );
            if (therapists.length === 0) return;

            let sentCount = 0;
            for (const t of therapists) {
                const sent = await sendScheduleReminderIfNeeded(t.id);
                if (sent) sentCount++;
            }

            console.log(
                `[cron] Sent schedule-confirmation reminders to ${sentCount} therapist(s).`
            );
        } catch (err) {
            console.error('[cron] Failed to send schedule-confirmation reminders:', err);
        }
    });

    console.log('[cron] Weekend schedule-confirmation reminder job scheduled (09:00 daily, fires Fri/Sat/Sun).');
};

module.exports = { startScheduleConfirmationReminderJob, sendScheduleReminderIfNeeded };
