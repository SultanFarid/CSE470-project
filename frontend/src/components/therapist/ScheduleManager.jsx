import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Calendar, Save, Trash2, Copy, XCircle, CheckCircle2, AlertCircle, Plus, Wand2, Users, BellRing } from 'lucide-react';
import {
    getMySchedule,
    saveMySchedule,
    getMyExceptions,
    addAvailabilityException,
    deleteAvailabilityException
} from '../../services/api';
import './ScheduleManager.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 8;
const END_HOUR = 20;
const DURATION_OPTIONS = [10, 15, 30, 45, 60, 90];
const BREAK_AFTER_OPTIONS = [30, 45, 60, 90, 120];
const BREAK_LEN_OPTIONS = [0, 5, 10, 15, 20, 30];

const pad = (n) => String(n).padStart(2, '0');

const formatLabel = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${pad(m)} ${period}`;
};

const labelFromTimeStr = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return formatLabel(h, m);
};

const minutesToTimeStr = (totalMinutes) => `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
const timeStrToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
};

// Builds the row list for the manual paint grid based on the chosen session length.
const generateSlots = (durationMinutes) => {
    const slots = [];
    let t = START_HOUR * 60;
    const end = END_HOUR * 60;
    while (t < end) {
        const endT = t + durationMinutes;
        slots.push({ start: minutesToTimeStr(t), end: minutesToTimeStr(endT), label: formatLabel(Math.floor(t / 60), t % 60) });
        t += durationMinutes;
    }
    return slots;
};

// The auto-fill algorithm: slice a raw time range into back-to-back
// session-length slots, inserting a break once the therapist has been
// booked solid for `breakAfterMinutes` of work. e.g. 1:00 PM-4:00 PM,
// 10-minute sessions, a 10-minute break after every 60 minutes worked
// -> six 10-minute sessions, a 10-minute break, six more, a break, etc.
const generateRangeSlots = (startStr, endStr, sessionLen, breakAfterMinutes, breakLen) => {
    const rangeStart = timeStrToMinutes(startStr);
    const rangeEnd = timeStrToMinutes(endStr);
    const slots = [];
    let cursor = rangeStart;
    let workedSinceBreak = 0;

    while (cursor + sessionLen <= rangeEnd) {
        const slotEnd = cursor + sessionLen;
        slots.push({ start: minutesToTimeStr(cursor), end: minutesToTimeStr(slotEnd) });
        cursor = slotEnd;
        workedSinceBreak += sessionLen;

        if (breakAfterMinutes > 0 && workedSinceBreak >= breakAfterMinutes && cursor + sessionLen <= rangeEnd) {
            cursor += breakLen;
            workedSinceBreak = 0;
        }
    }
    return slots;
};

const cellKey = (dayIdx, start) => `${dayIdx}_${start}`;

const daysAgo = (isoString) => {
    if (!isoString) return Infinity;
    return (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24);
};

const ScheduleManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [slotDuration, setSlotDuration] = useState(30);
    const [bufferMinutes, setBufferMinutes] = useState(0);
    const [lastConfirmedAt, setLastConfirmedAt] = useState(null);

    // selected is keyed the same way as before (`${dayIdx}_${start}`) but now
    // stores the real {start, end} for that cell instead of just a boolean —
    // that way a quick-fill cell whose start time doesn't land on one of the
    // manual grid's fixed ticks still saves with its correct end time instead
    // of collapsing to a zero-length appointment.
    const [selected, setSelected] = useState(new Map());

    const [exceptions, setExceptions] = useState([]);
    const [exceptionForm, setExceptionForm] = useState({
        exceptionDate: '', type: 'blocked', startTime: '', endTime: '', reason: ''
    });

    // Quick-fill ("set 1 PM-4 PM, 10-min patients, break every hour") form.
    const [qfOpen, setQfOpen] = useState(false);
    const [qfDays, setQfDays] = useState([]);
    const [qfStart, setQfStart] = useState('13:00');
    const [qfEnd, setQfEnd] = useState('16:00');
    const [qfBreakAfter, setQfBreakAfter] = useState(60);
    const [qfBreakLen, setQfBreakLen] = useState(10);

    const paintingRef = useRef(false);
    const paintValueRef = useRef(true);

    const timeSlots = useMemo(() => generateSlots(slotDuration), [slotDuration]);

    // Every selected cell gets a visible row, even ones a quick-fill created
    // that don't line up with the manual grid's fixed ticks.
    const displayTimeSlots = useMemo(() => {
        const byStart = new Map(timeSlots.map((s) => [s.start, s]));
        selected.forEach((val) => {
            if (!byStart.has(val.start)) byStart.set(val.start, { start: val.start, end: val.end, label: labelFromTimeStr(val.start) });
        });
        return Array.from(byStart.values()).sort((a, b) => a.start.localeCompare(b.start));
    }, [timeSlots, selected]);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

    const loadSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMySchedule();
            setSlotDuration(data.slotDurationMinutes || 30);
            setBufferMinutes(data.bufferMinutes || 0);
            setLastConfirmedAt(data.lastConfirmedAt || null);

            const next = new Map();
            (data.slots || []).forEach((s) => {
                const start = s.start_time.slice(0, 5);
                const end = s.end_time.slice(0, 5);
                next.set(cellKey(s.day_of_week, start), { start, end });
            });
            setSelected(next);
        } catch (err) {
            console.error('Failed to load schedule', err);
            showMessage('Could not load your schedule.', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadExceptions = useCallback(async () => {
        try {
            const rows = await getMyExceptions();
            setExceptions(Array.isArray(rows) ? rows : []);
        } catch (err) {
            console.error('Failed to load exceptions', err);
        }
    }, []);

    useEffect(() => {
        loadSchedule();
        loadExceptions();
    }, [loadSchedule, loadExceptions]);

    // ----- Capacity: how many patients this schedule can handle -----
    const weeklyTotal = selected.size;
    const perDayCounts = useMemo(() => {
        const counts = Array(7).fill(0);
        selected.forEach((_, key) => {
            const dayIdx = Number(key.split('_')[0]);
            counts[dayIdx] += 1;
        });
        return counts;
    }, [selected]);

    // ----- Confirmation nudge (mirrors the weekend reminder job) -----
    const todayDow = new Date().getDay(); // 0=Sun..6=Sat
    const isWeekend = todayDow === 0 || todayDow === 5 || todayDow === 6;
    const needsConfirmation = daysAgo(lastConfirmedAt) >= 6;

    // ----- Grid painting (click, or click-and-drag across cells) -----
    const paintCell = (dayIdx, start, end, value) => {
        const key = cellKey(dayIdx, start);
        setSelected((prev) => {
            const next = new Map(prev);
            if (value) next.set(key, { start, end }); else next.delete(key);
            return next;
        });
    };

    const handleMouseDown = (dayIdx, slot) => {
        const key = cellKey(dayIdx, slot.start);
        const target = !selected.has(key);
        paintingRef.current = true;
        paintValueRef.current = target;
        paintCell(dayIdx, slot.start, slot.end, target);
    };

    const handleMouseEnter = (dayIdx, slot) => {
        if (!paintingRef.current) return;
        paintCell(dayIdx, slot.start, slot.end, paintValueRef.current);
    };

    useEffect(() => {
        const stopPainting = () => { paintingRef.current = false; };
        window.addEventListener('mouseup', stopPainting);
        return () => window.removeEventListener('mouseup', stopPainting);
    }, []);

    // ----- Quick actions -----
    const clearDay = (dayIdx) => {
        setSelected((prev) => {
            const next = new Map(prev);
            Array.from(next.keys()).forEach((k) => { if (k.startsWith(`${dayIdx}_`)) next.delete(k); });
            return next;
        });
    };

    const copyMondayToWeekdays = () => {
        setSelected((prev) => {
            const next = new Map(prev);
            [1, 2, 3, 4].forEach((dayIdx) => {
                Array.from(next.keys()).forEach((k) => { if (k.startsWith(`${dayIdx}_`)) next.delete(k); });
            });
            prev.forEach((val, key) => {
                if (!key.startsWith('0_')) return;
                [1, 2, 3, 4].forEach((dayIdx) => next.set(cellKey(dayIdx, val.start), { ...val }));
            });
            return next;
        });
    };

    const clearAll = () => setSelected(new Map());

    const handleDurationChange = (e) => {
        const newDuration = Number(e.target.value);
        if (selected.size > 0) {
            const ok = window.confirm('Changing the session length will clear your current schedule selections. Continue?');
            if (!ok) return;
        }
        setSlotDuration(newDuration);
        setSelected(new Map());
    };

    // ----- Quick-fill: range + break rule -----
    const toggleQfDay = (dayIdx) => {
        setQfDays((prev) => (prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx]));
    };

    const computedQfSlots = useMemo(
        () => generateRangeSlots(qfStart, qfEnd, slotDuration, qfBreakAfter, qfBreakLen),
        [qfStart, qfEnd, slotDuration, qfBreakAfter, qfBreakLen]
    );

    const handleApplyQuickFill = () => {
        if (qfDays.length === 0) {
            showMessage('Pick at least one day to apply this to.', 'error');
            return;
        }
        if (timeStrToMinutes(qfEnd) <= timeStrToMinutes(qfStart)) {
            showMessage('End time must be after start time.', 'error');
            return;
        }
        if (computedQfSlots.length === 0) {
            showMessage(`That range is too short to fit even one ${slotDuration}-minute session.`, 'error');
            return;
        }

        setSelected((prev) => {
            const next = new Map(prev);
            qfDays.forEach((dayIdx) => {
                Array.from(next.keys()).forEach((k) => { if (k.startsWith(`${dayIdx}_`)) next.delete(k); });
                computedQfSlots.forEach((slot) => next.set(cellKey(dayIdx, slot.start), slot));
            });
            return next;
        });

        const total = computedQfSlots.length * qfDays.length;
        showMessage(
            `Applied ${computedQfSlots.length} appointment${computedQfSlots.length === 1 ? '' : 's'}/day × ${qfDays.length} day${qfDays.length === 1 ? '' : 's'} = ${total} patients this week on those days. Review the grid below, then Save.`,
            'success'
        );
    };

    // ----- Save -----
    const handleSave = async () => {
        setSaving(true);
        try {
            const slots = [];
            selected.forEach((val, key) => {
                slots.push({ day_of_week: Number(key.split('_')[0]), start_time: val.start, end_time: val.end });
            });

            const result = await saveMySchedule({ slots, slotDurationMinutes: slotDuration, bufferMinutes });
            setLastConfirmedAt(result?.confirmedAt || new Date().toISOString());
            showMessage(
                weeklyTotal > 0
                    ? `Schedule saved — you can handle ${weeklyTotal} patient${weeklyTotal === 1 ? '' : 's'} this week.`
                    : 'Schedule saved.',
                'success'
            );
        } catch (err) {
            console.error('Save schedule failed', err);
            showMessage(err.response?.data?.message || 'Failed to save schedule.', 'error');
        } finally {
            setSaving(false);
        }
    };

    // ----- Exceptions -----
    const handleExceptionChange = (e) => {
        const { name, value } = e.target;
        setExceptionForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddException = async (e) => {
        e.preventDefault();
        if (!exceptionForm.exceptionDate) return;
        try {
            await addAvailabilityException(exceptionForm);
            showMessage('Exception added.', 'success');
            setExceptionForm({ exceptionDate: '', type: 'blocked', startTime: '', endTime: '', reason: '' });
            loadExceptions();
        } catch (err) {
            console.error('Add exception failed', err);
            showMessage(err.response?.data?.message || 'Failed to add exception.', 'error');
        }
    };

    const handleDeleteException = async (id) => {
        try {
            await deleteAvailabilityException(id);
            setExceptions((prev) => prev.filter((ex) => ex.id !== id));
        } catch (err) {
            console.error('Delete exception failed', err);
            showMessage('Failed to remove exception.', 'error');
        }
    };

    if (loading) {
        return <div className="sm-state-msg">Loading your schedule...</div>;
    }

    return (
        <div className="sm-container">
            <header className="sm-header">
                <div>
                    <h1><Calendar size={22} /> Schedule Manager</h1>
                    <p>Set your weekly hours — either quick-fill a range with a break rule, or paint the grid by hand.</p>
                </div>
                <button className="sm-btn-save" onClick={handleSave} disabled={saving}>
                    <Save size={16} /> {saving ? 'Saving...' : 'Save Schedule'}
                </button>
            </header>

            {message.text && (
                <div className={`sm-alert ${message.type === 'success' ? 'sm-alert-success' : 'sm-alert-error'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            {isWeekend && needsConfirmation && (
                <div className="sm-confirm-banner">
                    <BellRing size={16} />
                    <span>
                        You haven't confirmed next week's schedule yet — patients can't book hours you haven't set.
                        We'll keep reminding you until you hit Save.
                    </span>
                </div>
            )}

            <section className="sm-card sm-capacity-card">
                <div className="sm-capacity-headline">
                    <Users size={20} />
                    <div>
                        <span className="sm-capacity-number">{weeklyTotal}</span>
                        <span className="sm-capacity-label">patient{weeklyTotal === 1 ? '' : 's'} you can handle this week</span>
                    </div>
                </div>
                <div className="sm-capacity-breakdown">
                    {DAYS_SHORT.map((d, idx) => (
                        <div key={d} className={`sm-capacity-day ${perDayCounts[idx] > 0 ? 'has-slots' : ''}`}>
                            <span>{d}</span>
                            <strong>{perDayCounts[idx]}</strong>
                        </div>
                    ))}
                </div>
                <p className="sm-hint">
                    {lastConfirmedAt
                        ? `Last confirmed ${new Date(lastConfirmedAt).toLocaleDateString([], { dateStyle: 'medium' })}.`
                        : "You haven't confirmed a schedule yet."} Each appointment is {slotDuration} minutes.
                </p>
            </section>

            <section className="sm-card sm-quickfill-card">
                <div className="sm-grid-toolbar">
                    <h2><Wand2 size={16} /> Quick-Fill a Range</h2>
                    <button type="button" onClick={() => setQfOpen((o) => !o)}>
                        {qfOpen ? 'Hide' : 'Open'}
                    </button>
                </div>
                <p className="sm-hint" style={{ marginTop: 0, marginBottom: qfOpen ? 16 : 0 }}>
                    e.g. "1 PM–4 PM, a 10-minute break after every hour worked" auto-fills every {slotDuration}-minute
                    appointment slot in that window for the days you pick — no need to click each one by hand.
                </p>

                {qfOpen && (
                    <>
                        <div className="sm-qf-days">
                            {DAYS.map((day, idx) => (
                                <button
                                    type="button"
                                    key={day}
                                    className={`sm-qf-day-chip ${qfDays.includes(idx) ? 'active' : ''}`}
                                    onClick={() => toggleQfDay(idx)}
                                >
                                    {DAYS_SHORT[idx]}
                                </button>
                            ))}
                        </div>

                        <div className="sm-qf-fields">
                            <div className="sm-field">
                                <label>Start time</label>
                                <input type="time" value={qfStart} onChange={(e) => setQfStart(e.target.value)} />
                            </div>
                            <div className="sm-field">
                                <label>End time</label>
                                <input type="time" value={qfEnd} onChange={(e) => setQfEnd(e.target.value)} />
                            </div>
                            <div className="sm-field">
                                <label>Each patient takes</label>
                                <select value={slotDuration} onChange={handleDurationChange}>
                                    {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
                                </select>
                            </div>
                            <div className="sm-field">
                                <label>Break after working</label>
                                <select value={qfBreakAfter} onChange={(e) => setQfBreakAfter(Number(e.target.value))}>
                                    {BREAK_AFTER_OPTIONS.map((b) => <option key={b} value={b}>{b} minutes</option>)}
                                </select>
                            </div>
                            <div className="sm-field">
                                <label>Break length</label>
                                <select value={qfBreakLen} onChange={(e) => setQfBreakLen(Number(e.target.value))}>
                                    {BREAK_LEN_OPTIONS.map((b) => <option key={b} value={b}>{b === 0 ? 'No break' : `${b} minutes`}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="sm-qf-preview">
                            <span>
                                This will schedule <strong>{computedQfSlots.length}</strong> appointment{computedQfSlots.length === 1 ? '' : 's'} per selected day
                                {qfDays.length > 0 && <> — <strong>{computedQfSlots.length * qfDays.length}</strong> total across {qfDays.length} day{qfDays.length === 1 ? '' : 's'}.</>}
                            </span>
                            <button type="button" className="sm-btn-add" onClick={handleApplyQuickFill}>
                                <Wand2 size={14} /> Apply to Selected Days
                            </button>
                        </div>
                        <p className="sm-hint">Applying replaces whatever is currently set for the day(s) you picked above — it doesn't stack on top.</p>
                    </>
                )}
            </section>

            <section className="sm-card sm-settings">
                <div className="sm-field">
                    <label>Each appointment length</label>
                    <select value={slotDuration} onChange={handleDurationChange}>
                        {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
                    </select>
                </div>
                <div className="sm-field">
                    <label>Buffer after each booking</label>
                    <select value={bufferMinutes} onChange={(e) => setBufferMinutes(Number(e.target.value))}>
                        {[0, 5, 10, 15, 20].map((b) => (
                            <option key={b} value={b}>{b === 0 ? 'No buffer' : `${b} minutes`}</option>
                        ))}
                    </select>
                </div>
                <p className="sm-hint">
                    Buffer time is saved now and will apply automatically once appointment booking checks slots against this schedule.
                </p>
            </section>

            <section className="sm-card">
                <div className="sm-grid-toolbar">
                    <h2>Weekly Availability</h2>
                    <div className="sm-toolbar-actions">
                        <button type="button" onClick={copyMondayToWeekdays}>
                            <Copy size={14} /> Copy Monday → Weekdays
                        </button>
                        <button type="button" onClick={clearAll}>
                            <Trash2 size={14} /> Clear All
                        </button>
                    </div>
                </div>

                <div className="sm-grid-scroll">
                    <table className="sm-grid" onDragStart={(e) => e.preventDefault()}>
                        <thead>
                            <tr>
                                <th className="sm-time-col">Time</th>
                                {DAYS.map((day, idx) => (
                                    <th key={day}>
                                        {day}
                                        <button type="button" className="sm-clear-day" onClick={() => clearDay(idx)} title={`Clear ${day}`}>
                                            <XCircle size={13} />
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {displayTimeSlots.map((slot) => (
                                <tr key={slot.start}>
                                    <td className="sm-time-col">{slot.label || labelFromTimeStr(slot.start)}</td>
                                    {DAYS.map((day, dayIdx) => {
                                        const key = cellKey(dayIdx, slot.start);
                                        const isOn = selected.has(key);
                                        return (
                                            <td key={key}>
                                                <div
                                                    className={`sm-cell ${isOn ? 'sm-cell-on' : ''}`}
                                                    onMouseDown={() => handleMouseDown(dayIdx, slot)}
                                                    onMouseEnter={() => handleMouseEnter(dayIdx, slot)}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="sm-hint">Click a cell to toggle it, or click and drag across cells to paint several at once.</p>
            </section>

            <section className="sm-card">
                <h2>Date-Specific Exceptions</h2>
                <p className="sm-hint">Block a single date (vacation, sick day) or give it different hours — this overrides your weekly schedule for that date only.</p>

                <form className="sm-exception-form" onSubmit={handleAddException}>
                    <div className="sm-field">
                        <label>Date</label>
                        <input type="date" name="exceptionDate" value={exceptionForm.exceptionDate} onChange={handleExceptionChange} required />
                    </div>
                    <div className="sm-field">
                        <label>Type</label>
                        <select name="type" value={exceptionForm.type} onChange={handleExceptionChange}>
                            <option value="blocked">Block whole day</option>
                            <option value="custom_hours">Custom hours</option>
                        </select>
                    </div>
                    {exceptionForm.type === 'custom_hours' && (
                        <>
                            <div className="sm-field">
                                <label>Start</label>
                                <input type="time" name="startTime" value={exceptionForm.startTime} onChange={handleExceptionChange} required />
                            </div>
                            <div className="sm-field">
                                <label>End</label>
                                <input type="time" name="endTime" value={exceptionForm.endTime} onChange={handleExceptionChange} required />
                            </div>
                        </>
                    )}
                    <div className="sm-field sm-field-reason">
                        <label>Reason (optional)</label>
                        <input type="text" name="reason" placeholder="e.g. Annual leave" value={exceptionForm.reason} onChange={handleExceptionChange} />
                    </div>
                    <button type="submit" className="sm-btn-add">
                        <Plus size={14} /> Add
                    </button>
                </form>

                {exceptions.length === 0 ? (
                    <p className="sm-state-msg">No upcoming exceptions.</p>
                ) : (
                    <div className="sm-exception-list">
                        {exceptions.map((ex) => (
                            <div key={ex.id} className="sm-exception-item">
                                <div>
                                    <strong>
                                        {new Date(ex.exception_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </strong>
                                    <span className="sm-exception-type">
                                        {ex.type === 'blocked'
                                            ? 'Blocked'
                                            : `Custom hours: ${ex.start_time?.slice(0, 5)} - ${ex.end_time?.slice(0, 5)}`}
                                    </span>
                                    {ex.reason && <span className="sm-exception-reason">— {ex.reason}</span>}
                                </div>
                                <button type="button" onClick={() => handleDeleteException(ex.id)} title="Remove">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default ScheduleManager;
