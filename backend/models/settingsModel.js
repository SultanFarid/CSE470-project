const db = require('../config/db');

// Key/value store helpers for system_settings table.

const get = async (key) => {
    const [rows] = await db.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = ?`,
        [key]
    );
    return rows[0]?.setting_value ?? null;
};

const set = async (key, value) => {
    await db.query(
        `INSERT INTO system_settings (setting_key, setting_value)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
        [key, value ?? null]
    );
};

// ─── Application Deadline ────────────────────────────────────────────────────

const getDeadline = async () => {
    const [rows] = await db.query(
        `SELECT setting_key, setting_value FROM system_settings
         WHERE setting_key IN (
           'application_deadline_date',
           'application_deadline_time',
           'application_deadline_active'
         )`
    );
    const map = {};
    rows.forEach(r => { map[r.setting_key] = r.setting_value; });
    return {
        date:     map['application_deadline_date']   ?? '',
        time:     map['application_deadline_time']   ?? '23:59',
        isActive: map['application_deadline_active'] === '1',
    };
};

const saveDeadline = async ({ date, time, isActive }) => {
    await Promise.all([
        set('application_deadline_date',   date   || null),
        set('application_deadline_time',   time   || '23:59'),
        set('application_deadline_active', isActive ? '1' : '0'),
    ]);
};

// Returns true when applications should currently be accepted.
// Called by the therapist apply endpoint so the check is server-side.
const isApplicationOpen = async () => {
    const { date, time, isActive } = await getDeadline();
    if (!isActive || !date) return true;           // no active deadline → always open

    const deadlineStr = `${date}T${time || '23:59'}:00`;
    const deadline = new Date(deadlineStr);
    return new Date() <= deadline;                  // open as long as now ≤ deadline
};

module.exports = { getDeadline, saveDeadline, isApplicationOpen };
