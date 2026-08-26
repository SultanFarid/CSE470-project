import { useState, useEffect } from 'react';
import { CalendarClock, ToggleLeft, ToggleRight, Save, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { getAdminSettings, saveDeadline } from '../../services/api';
import './AdminSettings.css';

const AdminSettings = () => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('23:59');
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ text: '', type: '' });

    useEffect(() => {
        getAdminSettings()
            .then(({ deadline }) => {
                setDate(deadline?.date || '');
                setTime(deadline?.time || '23:59');
                setIsActive(!!deadline?.isActive);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMsg({ text: '', type: '' });
        try {
            await saveDeadline({ date, time, isActive });
            setMsg({ text: 'Settings saved successfully.', type: 'success' });
        } catch (err) {
            setMsg({ text: err.response?.data?.message || 'Failed to save settings.', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMsg({ text: '', type: '' }), 4000);
        }
    };

    const deadlineLabel = () => {
        if (!date) return 'No deadline set';
        const d = new Date(`${date}T${time || '23:59'}:00`);
        return d.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' });
    };

    return (
        <AdminLayout pageTitle="System Settings" badgeText="Admin Control">
            <div className="as-page">

                {/* ── Application Deadline Card ── */}
                <div className="as-card">
                    <div className="as-card-header">
                        <div className="as-card-icon">
                            <CalendarClock size={20} />
                        </div>
                        <div>
                            <h2 className="as-card-title">Therapist Application Deadline</h2>
                            <p className="as-card-desc">
                                Set a closing date for new therapist job applications. Once the deadline
                                passes (or the toggle is switched off), the application form will show
                                a "Closed" notice instead of accepting submissions.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="as-loading">Loading current settings…</p>
                    ) : (
                        <>
                            {/* Active toggle */}
                            <div className="as-toggle-row">
                                <span className="as-toggle-label">
                                    Deadline enforcement
                                </span>
                                <button
                                    className={`as-toggle-btn ${isActive ? 'as-toggle-on' : 'as-toggle-off'}`}
                                    onClick={() => setIsActive(v => !v)}
                                    title={isActive ? 'Click to disable' : 'Click to enable'}
                                >
                                    {isActive
                                        ? <><ToggleRight size={28} /> <span>Active</span></>
                                        : <><ToggleLeft size={28} /> <span>Inactive</span></>}
                                </button>
                            </div>

                            {/* Date + Time pickers */}
                            <div className="as-field-row">
                                <div className="as-field">
                                    <label className="as-label">Deadline Date</label>
                                    <input
                                        type="date"
                                        className="as-input"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        disabled={!isActive}
                                    />
                                </div>
                                <div className="as-field">
                                    <label className="as-label">Deadline Time</label>
                                    <input
                                        type="time"
                                        className="as-input"
                                        value={time}
                                        onChange={e => setTime(e.target.value)}
                                        disabled={!isActive}
                                    />
                                </div>
                            </div>

                            {/* Live preview */}
                            <div className={`as-preview ${isActive && date ? 'as-preview-active' : 'as-preview-inactive'}`}>
                                <CalendarClock size={15} />
                                <span>
                                    {isActive
                                        ? `Applications close on: ${deadlineLabel()}`
                                        : 'Deadline enforcement is off — applications are currently open'}
                                </span>
                            </div>

                            {/* Feedback */}
                            {msg.text && (
                                <div className={`as-msg ${msg.type === 'success' ? 'as-msg-ok' : 'as-msg-err'}`}>
                                    {msg.type === 'success'
                                        ? <CheckCircle size={15} />
                                        : <AlertCircle size={15} />}
                                    <span>{msg.text}</span>
                                </div>
                            )}

                            <button
                                className="as-save-btn"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <Save size={16} />
                                {saving ? 'Saving…' : 'Save Settings'}
                            </button>
                        </>
                    )}
                </div>

                {/* ── Placeholder for future settings ── */}
                <div className="as-card as-card-dim">
                    <div className="as-card-header">
                        <div className="as-card-icon as-card-icon-dim">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h2 className="as-card-title">More Settings</h2>
                            <p className="as-card-desc">Additional platform controls will appear here in future updates.</p>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
