import { useState, useEffect, useCallback } from 'react';
import {
    FileText, Trash2, Pill, Dumbbell,
    CheckCircle2, AlertCircle, Film
} from 'lucide-react';
import { getMyTherapistSessions, getPrescriptionForSession, savePrescription } from '../../services/api';
import './PrescriptionStudio.css';

const emptyItem = (item_type) => ({ item_type, title: '', youtube_url: '', _key: crypto.randomUUID() });

const PrescriptionStudio = () => {
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingPrescription, setLoadingPrescription] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const [sessionNotes, setSessionNotes] = useState('');
    const [medications, setMedications] = useState('');
    const [items, setItems] = useState([]);

    useEffect(() => {
        const load = async () => {
            setLoadingSessions(true);
            try {
                const data = await getMyTherapistSessions();
                const list = Array.isArray(data) ? data : [];
                // Cancelled sessions can't get a prescription written for them.
                setSessions(list.filter((s) => s.status !== 'cancelled'));
            } catch (err) {
                console.error('Failed to load sessions', err);
                setMessage({ text: 'Could not load your sessions.', type: 'error' });
            } finally {
                setLoadingSessions(false);
            }
        };
        load();
    }, []);

    const resetForm = () => {
        setSessionNotes('');
        setMedications('');
        setItems([]);
    };

    const loadPrescription = useCallback(async (sessionId) => {
        if (!sessionId) return;
        setLoadingPrescription(true);
        resetForm();
        try {
            const existing = await getPrescriptionForSession(sessionId);
            if (existing) {
                setSessionNotes(existing.session_notes || '');
                setMedications(existing.medications || '');
                setItems(
                    (existing.care_plan_items || []).map((it) => ({
                        item_type: it.item_type,
                        title: it.title,
                        youtube_url: it.youtube_url || '',
                        _key: crypto.randomUUID()
                    }))
                );
            }
        } catch (err) {
            console.error('Failed to load existing prescription', err);
        } finally {
            setLoadingPrescription(false);
        }
    }, []);

    const handleSelectSession = (e) => {
        const id = e.target.value;
        setSelectedSessionId(id);
        setMessage({ text: '', type: '' });
        loadPrescription(id);
    };

    const addItem = (type) => setItems((prev) => [...prev, emptyItem(type)]);
    const updateItem = (key, field, value) =>
        setItems((prev) => prev.map((it) => (it._key === key ? { ...it, [field]: value } : it)));
    const removeItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedSessionId) {
            setMessage({ text: 'Choose a session first.', type: 'error' });
            return;
        }
        const cleanItems = items
            .map((it) => ({ ...it, title: it.title.trim() }))
            .filter((it) => it.title);

        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await savePrescription({
                sessionId: selectedSessionId,
                sessionNotes,
                medications,
                carePlanItems: cleanItems.map(({ item_type, title, youtube_url }) => ({ item_type, title, youtube_url }))
            });
            setMessage({ text: 'Saved — session marked complete and the patient has been notified.', type: 'success' });
            // Reflect the completed status locally without a full refetch.
            setSessions((prev) => prev.map((s) => (String(s.id) === String(selectedSessionId) ? { ...s, status: 'completed' } : s)));
        } catch (err) {
            console.error('Failed to save prescription', err);
            setMessage({ text: err.response?.data?.message || 'Failed to save. Try again.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const selectedSession = sessions.find((s) => String(s.id) === String(selectedSessionId));

    return (
        <div className="ps-container">
            <header className="ps-header">
                <div className="ps-header-icon"><FileText size={22} /></div>
                <div>
                    <h1>Session Notes</h1>
                    <p>Write up a session, prescribe medications, and build the patient's daily checklist.</p>
                </div>
            </header>

            {message.text && (
                <div className={`ps-alert ${message.type === 'success' ? 'ps-alert-success' : 'ps-alert-error'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="ps-field ps-session-picker">
                <label>Select a session</label>
                {loadingSessions ? (
                    <p className="ps-state-msg">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                    <p className="ps-state-msg">No sessions yet — once a patient books with you, they'll appear here.</p>
                ) : (
                    <select value={selectedSessionId} onChange={handleSelectSession}>
                        <option value="">— Choose a patient session —</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.patient_name} — {new Date(s.created_at).toLocaleDateString([], { dateStyle: 'medium' })} ({s.status})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedSessionId && (
                loadingPrescription ? (
                    <p className="ps-state-msg">Loading prescription...</p>
                ) : (
                    <form onSubmit={handleSave} className="ps-form">
                        <div className="ps-field">
                            <label>Session Notes</label>
                            <textarea
                                rows="4"
                                placeholder="What was covered this session, observations, follow-up plan..."
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                            />
                        </div>

                        <div className="ps-field">
                            <label>Medications</label>
                            <textarea
                                rows="3"
                                placeholder={'One per line, e.g.\nSertraline 50mg — once daily, morning'}
                                value={medications}
                                onChange={(e) => setMedications(e.target.value)}
                            />
                        </div>

                        <div className="ps-items-section">
                            <div className="ps-items-header">
                                <label>Daily Checklist for Patient</label>
                                <div className="ps-add-btns">
                                    <button type="button" className="ps-btn-add" onClick={() => addItem('medication')}>
                                        <Pill size={13} /> Add Medication Reminder
                                    </button>
                                    <button type="button" className="ps-btn-add" onClick={() => addItem('exercise')}>
                                        <Dumbbell size={13} /> Add Exercise Video
                                    </button>
                                </div>
                            </div>

                            {items.length === 0 ? (
                                <p className="ps-state-msg ps-items-empty">
                                    Nothing added yet. Add a medication reminder or an exercise video — your patient will see these as a daily to-do list.
                                </p>
                            ) : (
                                <div className="ps-items-list">
                                    {items.map((item) => (
                                        <div key={item._key} className="ps-item-row">
                                            <span className={`ps-item-badge ${item.item_type}`}>
                                                {item.item_type === 'medication' ? <Pill size={13} /> : <Dumbbell size={13} />}
                                                {item.item_type === 'medication' ? 'Medication' : 'Exercise'}
                                            </span>
                                            <input
                                                type="text"
                                                placeholder={item.item_type === 'medication' ? 'e.g. Take morning dose' : 'e.g. Shoulder mobility stretch'}
                                                value={item.title}
                                                onChange={(e) => updateItem(item._key, 'title', e.target.value)}
                                            />
                                            {item.item_type === 'exercise' && (
                                                <div className="ps-youtube-field">
                                                    <Film size={14} />
                                                    <input
                                                        type="url"
                                                        placeholder="YouTube link (optional)"
                                                        value={item.youtube_url}
                                                        onChange={(e) => updateItem(item._key, 'youtube_url', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <button type="button" className="ps-btn-remove" onClick={() => removeItem(item._key)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedSession?.status === 'completed' && (
                            <p className="ps-completed-note">
                                This session is already marked completed — saving will update the existing notes and care plan.
                            </p>
                        )}

                        <button type="submit" className="ps-btn-submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save & Mark Session Complete'}
                        </button>
                    </form>
                )
            )}
        </div>
    );
};

export default PrescriptionStudio;
