import { useState, useEffect, useRef, useCallback } from 'react';
import { Calendar, Save, Trash2, Copy, XCircle, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import {
    getMySchedule,
    saveMySchedule,
    getMyExceptions,
    addAvailabilityException,
    deleteAvailabilityException
} from '../../services/api';
import './ScheduleManager.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const START_HOUR = 8;
const END_HOUR = 20;
const DURATION_OPTIONS = [15, 30, 45, 60, 90];

const pad = (n) => String(n).padStart(2, '0');

const formatLabel = (h, m) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${pad(m)} ${period}`;
};

// Builds the row list for the grid based on the chosen slot size.
const generateSlots = (durationMinutes) => {
    const slots = [];
    let t = START_HOUR * 60;
    const end = END_HOUR * 60;
    while (t < end) {
        const h = Math.floor(t / 60);
        const m = t % 60;
        const endT = t + durationMinutes;
        slots.push({
            start: `${pad(h)}:${pad(m)}`,
            end: `${pad(Math.floor(endT / 60))}:${pad(endT % 60)}`,
            label: formatLabel(h, m)
        });
        t += durationMinutes;
    }
    return slots;
};

const cellKey = (dayIdx, start) => `${dayIdx}_${start}`;

const ScheduleManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [slotDuration, setSlotDuration] = useState(30);
    const [bufferMinutes, setBufferMinutes] = useState(0);
    const [selected, setSelected] = useState(new Set());

    const [exceptions, setExceptions] = useState([]);
    const [exceptionForm, setExceptionForm] = useState({
        exceptionDate: '', type: 'blocked', startTime: '', endTime: '', reason: ''
    });

    const paintingRef = useRef(false);
    const paintValueRef = useRef(true);

    const timeSlots = generateSlots(slotDuration);

    const showMessage = (text, type) => {
        setMessage({ text, type });
        setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    };

    const loadSchedule = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMySchedule();
            setSlotDuration(data.slotDurationMinutes || 30);
            setBufferMinutes(data.bufferMinutes || 0);

            const next = new Set();
            (data.slots || []).forEach((s) => {
                next.add(cellKey(s.day_of_week, s.start_time.slice(0, 5)));
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

    // ----- Grid painting (click, or click-and-drag across cells) -----
    const paintCell = (dayIdx, start, value) => {
        const key = cellKey(dayIdx, start);
        setSelected((prev) => {
            const next = new Set(prev);
            if (value) next.add(key); else next.delete(key);
            return next;
        });
    };

    const handleMouseDown = (dayIdx, start) => {
        const key = cellKey(dayIdx, start);
        const target = !selected.has(key);
        paintingRef.current = true;
        paintValueRef.current = target;
        paintCell(dayIdx, start, target);
    };

    const handleMouseEnter = (dayIdx, start) => {
        if (!paintingRef.current) return;
        paintCell(dayIdx, start, paintValueRef.current);
    };

    useEffect(() => {
        const stopPainting = () => { paintingRef.current = false; };
        window.addEventListener('mouseup', stopPainting);
        return () => window.removeEventListener('mouseup', stopPainting);
    }, []);

    // ----- Quick actions -----
    const clearDay = (dayIdx) => {
        setSelected((prev) => {
            const next = new Set(prev);
            timeSlots.forEach((s) => next.delete(cellKey(dayIdx, s.start)));
            return next;
        });
    };

    const copyMondayToWeekdays = () => {
        setSelected((prev) => {
            const next = new Set(prev);
            timeSlots.forEach((s) => {
                const mondayOn = prev.has(cellKey(0, s.start));
                [1, 2, 3, 4].forEach((dayIdx) => {
                    const key = cellKey(dayIdx, s.start);
                    if (mondayOn) next.add(key); else next.delete(key);
                });
            });
            return next;
        });
    };

    const clearAll = () => setSelected(new Set());

    const handleDurationChange = (e) => {
        const newDuration = Number(e.target.value);
        if (selected.size > 0) {
            const ok = window.confirm('Changing the slot size will clear your current grid selections. Continue?');
            if (!ok) return;
        }
        setSlotDuration(newDuration);
        setSelected(new Set());
    };

    // ----- Save -----
    const handleSave = async () => {
        setSaving(true);
        try {
            const slots = Array.from(selected).map((key) => {
                const [dayIdx, start] = key.split('_');
                const slotDef = timeSlots.find((s) => s.start === start);
                return {
                    day_of_week: Number(dayIdx),
                    start_time: start,
                    end_time: slotDef ? slotDef.end : start
                };
            });

            await saveMySchedule({ slots, slotDurationMinutes: slotDuration, bufferMinutes });
            showMessage('Weekly schedule saved.', 'success');
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
                    <p>Check the boxes below to set your weekly available time slots for patient bookings.</p>
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

            <section className="sm-card sm-settings">
                <div className="sm-field">
                    <label>Slot duration</label>
                    <select value={slotDuration} onChange={handleDurationChange}>
                        {DURATION_OPTIONS.map((d) => (
                            <option key={d} value={d}>{d} minutes</option>
                        ))}
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
                            {timeSlots.map((slot) => (
                                <tr key={slot.start}>
                                    <td className="sm-time-col">{slot.label}</td>
                                    {DAYS.map((day, dayIdx) => {
                                        const key = cellKey(dayIdx, slot.start);
                                        const isOn = selected.has(key);
                                        return (
                                            <td key={key}>
                                                <div
                                                    className={`sm-cell ${isOn ? 'sm-cell-on' : ''}`}
                                                    onMouseDown={() => handleMouseDown(dayIdx, slot.start)}
                                                    onMouseEnter={() => handleMouseEnter(dayIdx, slot.start)}
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
