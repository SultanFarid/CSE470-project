const AvailabilityModel = require('../models/availabilityModel');

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ===== Therapist: manage own weekly schedule =====

const getMySchedule = async (req, res) => {
    try {
        const therapistId = req.user.id;
        const [slots, settings] = await Promise.all([
            AvailabilityModel.getWeeklyTemplate(therapistId),
            AvailabilityModel.getScheduleSettings(therapistId)
        ]);

        res.status(200).json({
            success: true,
            slots,
            slotDurationMinutes: settings.slot_duration_minutes,
            bufferMinutes: settings.buffer_minutes
        });
    } catch (err) {
        console.error('Get schedule error:', err);
        res.status(500).json({ message: 'Server error fetching schedule.' });
    }
};

const saveMySchedule = async (req, res) => {
    try {
        const therapistId = req.user.id;
        const { slots, slotDurationMinutes, bufferMinutes } = req.body;

        if (!Array.isArray(slots)) {
            return res.status(400).json({ message: 'slots must be an array.' });
        }
        for (const s of slots) {
            const validDay = typeof s.day_of_week === 'number' && s.day_of_week >= 0 && s.day_of_week <= 6;
            const validTime = /^\d{2}:\d{2}$/.test(s.start_time) && /^\d{2}:\d{2}$/.test(s.end_time);
            if (!validDay || !validTime) {
                return res.status(400).json({ message: 'Invalid slot format.' });
            }
        }

        await AvailabilityModel.replaceWeeklyTemplate(therapistId, slots);
        await AvailabilityModel.upsertScheduleSettings(
            therapistId,
            slotDurationMinutes || 30,
            bufferMinutes || 0
        );

        res.status(200).json({ message: 'Weekly schedule updated successfully.' });
    } catch (err) {
        console.error('Save schedule error:', err);
        res.status(500).json({ message: 'Server error saving schedule.' });
    }
};

// ===== Therapist: date-specific exceptions =====

const getMyExceptions = async (req, res) => {
    try {
        const rows = await AvailabilityModel.getExceptions(req.user.id);
        res.status(200).json({ success: true, exceptions: rows });
    } catch (err) {
        console.error('Get exceptions error:', err);
        res.status(500).json({ message: 'Server error fetching exceptions.' });
    }
};

const addMyException = async (req, res) => {
    try {
        const { exceptionDate, type, startTime, endTime, reason } = req.body;

        if (!exceptionDate) {
            return res.status(400).json({ message: 'exceptionDate is required.' });
        }
        if (type === 'custom_hours' && (!startTime || !endTime)) {
            return res.status(400).json({ message: 'startTime and endTime are required for custom hours.' });
        }

        const id = await AvailabilityModel.addException(req.user.id, {
            exceptionDate,
            type: type || 'blocked',
            startTime,
            endTime,
            reason
        });

        res.status(201).json({ message: 'Exception added.', id });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'An exception already exists for that date.' });
        }
        console.error('Add exception error:', err);
        res.status(500).json({ message: 'Server error adding exception.' });
    }
};

const deleteMyException = async (req, res) => {
    try {
        const { id } = req.params;
        const affected = await AvailabilityModel.deleteException(id, req.user.id);
        if (affected === 0) {
            return res.status(404).json({ message: 'Exception not found.' });
        }
        res.status(200).json({ message: 'Exception removed.' });
    } catch (err) {
        console.error('Delete exception error:', err);
        res.status(500).json({ message: 'Server error deleting exception.' });
    }
};

// ===== Public/patient-facing: effective availability for a date range =====
//
// This merges the weekly template with date-specific exceptions, per-day.
// `sessions.time_slot` now exists (see migration_add_time_slot_to_sessions.sql),
// but booked-slot exclusion is deliberately left to the client: BookingModal
// already calls GET /patient/therapist-slots for the selected date and grays
// out anything already booked, so duplicating that filter here would just be
// two sources of truth for the same thing.
//
// Each slot in the response gets a human-readable `label` (e.g.
// "09:00 AM - 09:50 AM") in the exact format BookingModal already sends as
// `time_slot` when booking, so the frontend doesn't need to reformat.
// - Weekly-template slots are stored as one row per checked grid cell in
//   ScheduleManager, so they're already the discrete bookable unit — just
//   labeled here, not re-sliced.
// - `custom_hours` exceptions store a single raw range, so that range is
//   sliced into the therapist's normal slot_duration_minutes (+ buffer_minutes
//   gap between slots) to produce the same kind of discrete, bookable slots.

const pad2 = (n) => String(n).padStart(2, '0');

const timeStrToMinutes = (timeStr) => {
    // Accepts "HH:MM" or "HH:MM:SS" (mysql2 TIME columns come back as strings)
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

const minutesToLabelPart = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${pad2(hour12)}:${pad2(m)} ${period}`;
};

const minutesToTimeStr = (totalMinutes) => {
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${pad2(h)}:${pad2(m)}`;
};

const formatSlotLabel = (startTimeStr, endTimeStr) =>
    `${minutesToLabelPart(timeStrToMinutes(startTimeStr))} - ${minutesToLabelPart(timeStrToMinutes(endTimeStr))}`;

// Slices a raw [startTimeStr, endTimeStr) range into discrete
// slotDurationMinutes-long bookable slots, skipping bufferMinutes between
// each. Drops any trailing partial slot that wouldn't fully fit.
const sliceRangeIntoSlots = (startTimeStr, endTimeStr, slotDurationMinutes, bufferMinutes) => {
    const rangeStart = timeStrToMinutes(startTimeStr);
    const rangeEnd = timeStrToMinutes(endTimeStr);
    const slots = [];
    let cursor = rangeStart;

    while (cursor + slotDurationMinutes <= rangeEnd) {
        const slotEnd = cursor + slotDurationMinutes;
        slots.push({
            start_time: minutesToTimeStr(cursor),
            end_time: minutesToTimeStr(slotEnd),
            label: `${minutesToLabelPart(cursor)} - ${minutesToLabelPart(slotEnd)}`
        });
        cursor = slotEnd + bufferMinutes;
    }
    return slots;
};

const getEffectiveAvailability = async (req, res) => {
    try {
        const { therapistId } = req.params;
        const from = req.query.from || new Date().toISOString().slice(0, 10);
        const defaultTo = new Date();
        defaultTo.setDate(defaultTo.getDate() + 13);
        const to = req.query.to || defaultTo.toISOString().slice(0, 10);

        const [weeklyTemplate, exceptions, settings] = await Promise.all([
            AvailabilityModel.getWeeklyTemplate(therapistId),
            AvailabilityModel.getExceptionsInRange(therapistId, from, to),
            AvailabilityModel.getScheduleSettings(therapistId)
        ]);

        const exceptionsByDate = {};
        exceptions.forEach((ex) => {
            const key = new Date(ex.exception_date).toISOString().slice(0, 10);
            exceptionsByDate[key] = ex;
        });

        const days = [];
        const cursor = new Date(from);
        const end = new Date(to);

        while (cursor <= end) {
            const dateKey = cursor.toISOString().slice(0, 10);
            const dayOfWeek = (cursor.getDay() + 6) % 7; // JS Sun=0..Sat=6 -> Mon=0..Sun=6
            const exception = exceptionsByDate[dateKey];

            let slots;
            if (exception && exception.type === 'blocked') {
                slots = [];
            } else if (exception && exception.type === 'custom_hours') {
                slots = sliceRangeIntoSlots(
                    exception.start_time,
                    exception.end_time,
                    settings.slot_duration_minutes,
                    settings.buffer_minutes
                );
            } else {
                slots = weeklyTemplate
                    .filter((s) => s.day_of_week === dayOfWeek)
                    .map((s) => ({
                        start_time: s.start_time,
                        end_time: s.end_time,
                        label: formatSlotLabel(s.start_time, s.end_time)
                    }));
            }

            days.push({ date: dateKey, day_name: DAY_NAMES[dayOfWeek], slots });
            cursor.setDate(cursor.getDate() + 1);
        }

        res.status(200).json({ success: true, therapistId: Number(therapistId), from, to, days });
    } catch (err) {
        console.error('Get effective availability error:', err);
        res.status(500).json({ message: 'Server error computing availability.' });
    }
};

module.exports = {
    getMySchedule,
    saveMySchedule,
    getMyExceptions,
    addMyException,
    deleteMyException,
    getEffectiveAvailability
};