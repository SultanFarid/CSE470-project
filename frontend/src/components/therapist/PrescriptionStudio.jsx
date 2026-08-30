import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FileText, Trash2, Pill, Dumbbell, FlaskConical,
    CheckCircle2, AlertCircle, Film, Search, Download, Sparkles, CalendarClock
} from 'lucide-react';
import {
    getMyTherapistSessions, getPrescriptionForSession, savePrescription,
    getPreSessionBriefing, searchMedicines, searchTests, getPrescriptionPdfDataForTherapist
} from '../../services/api';
import { generatePrescriptionPdf } from '../../utils/generatePrescriptionPdf';
import './PrescriptionStudio.css';

const emptyItem = (item_type) => ({ item_type, title: '', youtube_url: '', _key: crypto.randomUUID() });

const DOSE_SLOTS = [
    { key: 'morning', label: 'Morning' },
    { key: 'noon', label: 'Noon' },
    { key: 'night', label: 'Night' }
];

const emptyMedicine = (m = {}) => ({
    _key: crypto.randomUUID(),
    medicine_id: m.id || null,
    medicine_name: m.name || '',
    dosage: m.common_strength || '',
    morning: false, noon: false, night: false,
    duration_days: '',
    instructions: ''
});

const emptyTest = (t = {}) => ({
    _key: crypto.randomUUID(),
    test_id: t.id || null,
    test_name: t.name || '',
    notes: ''
});

const buildFrequencyCode = (med) => `${med.morning ? 1 : 0}-${med.noon ? 1 : 0}-${med.night ? 1 : 0}`;
const buildFrequencyLabel = (med) => DOSE_SLOTS.filter((s) => med[s.key]).map((s) => s.label).join(' & ');

const PrescriptionStudio = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState('');
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingPrescription, setLoadingPrescription] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [justSaved, setJustSaved] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    const [sessionNotes, setSessionNotes] = useState('');
    const [medications, setMedications] = useState('');
    const [additionalBriefing, setAdditionalBriefing] = useState('');
    const [items, setItems] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [tests, setTests] = useState([]);
    const [followUpRecommended, setFollowUpRecommended] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpNotes, setFollowUpNotes] = useState('');
    const [followUpStatus, setFollowUpStatus] = useState('none'); // read-only reflection of the patient's response

    const [briefing, setBriefing] = useState(null);
    const [loadingBriefing, setLoadingBriefing] = useState(false);

    const [medQuery, setMedQuery] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [medSearching, setMedSearching] = useState(false);

    const [testQuery, setTestQuery] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [testSearching, setTestSearching] = useState(false);

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

    // Debounced medicine search-as-you-type
    useEffect(() => {
        if (!medQuery.trim()) { setMedResults([]); return undefined; }
        setMedSearching(true);
        const t = setTimeout(() => {
            searchMedicines(medQuery.trim())
                .then((res) => setMedResults(Array.isArray(res) ? res : []))
                .catch(() => setMedResults([]))
                .finally(() => setMedSearching(false));
        }, 250);
        return () => clearTimeout(t);
    }, [medQuery]);

    // Debounced test search-as-you-type
    useEffect(() => {
        if (!testQuery.trim()) { setTestResults([]); return undefined; }
        setTestSearching(true);
        const t = setTimeout(() => {
            searchTests(testQuery.trim())
                .then((res) => setTestResults(Array.isArray(res) ? res : []))
                .catch(() => setTestResults([]))
                .finally(() => setTestSearching(false));
        }, 250);
        return () => clearTimeout(t);
    }, [testQuery]);

    const resetForm = () => {
        setSessionNotes('');
        setMedications('');
        setAdditionalBriefing('');
        setItems([]);
        setMedicines([]);
        setTests([]);
        setFollowUpRecommended(false);
        setFollowUpDate('');
        setFollowUpNotes('');
        setFollowUpStatus('none');
        setJustSaved(false);
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
                setAdditionalBriefing(existing.additional_briefing || '');
                setItems(
                    (existing.care_plan_items || []).map((it) => ({
                        item_type: it.item_type,
                        title: it.title,
                        youtube_url: it.youtube_url || '',
                        _key: crypto.randomUUID()
                    }))
                );
                setMedicines(
                    (existing.medicines || []).map((m) => {
                        const code = String(m.frequency_code || '').split('-');
                        return {
                            _key: crypto.randomUUID(),
                            medicine_id: m.medicine_id,
                            medicine_name: m.medicine_name,
                            dosage: m.dosage || '',
                            morning: code[0] === '1',
                            noon: code[1] === '1',
                            night: code[2] === '1',
                            duration_days: m.duration_days || '',
                            instructions: m.instructions || ''
                        };
                    })
                );
                setTests(
                    (existing.tests || []).map((t) => ({
                        _key: crypto.randomUUID(),
                        test_id: t.test_id,
                        test_name: t.test_name,
                        notes: t.notes || ''
                    }))
                );
                setFollowUpRecommended(!!existing.follow_up_recommended);
                // MySQL DATE columns come back as an ISO datetime string —
                // <input type="date"> needs just the yyyy-mm-dd portion.
                setFollowUpDate(existing.follow_up_date ? String(existing.follow_up_date).slice(0, 10) : '');
                setFollowUpNotes(existing.follow_up_notes || '');
                setFollowUpStatus(existing.follow_up_status || 'none');
            }
        } catch (err) {
            console.error('Failed to load existing prescription', err);
        } finally {
            setLoadingPrescription(false);
        }
    }, []);

    const loadBriefing = useCallback(async (sessionId) => {
        if (!sessionId) return;
        setLoadingBriefing(true);
        setBriefing(null);
        try {
            const data = await getPreSessionBriefing(sessionId);
            setBriefing(data);
        } catch (err) {
            console.error('Failed to load briefing', err);
        } finally {
            setLoadingBriefing(false);
        }
    }, []);

    const selectSession = useCallback((id) => {
        setSelectedSessionId(id);
        setMessage({ text: '', type: '' });
        setMedQuery(''); setMedResults([]);
        setTestQuery(''); setTestResults([]);
        loadPrescription(id);
        loadBriefing(id);
    }, [loadPrescription, loadBriefing]);

    const handleSelectSession = (e) => selectSession(e.target.value);

    // Deep-link support: arriving from "Create Prescription" on a patient's
    // caseload row (?session=123) auto-opens that session once the session
    // list has loaded, instead of making the therapist pick it again.
    useEffect(() => {
        const requestedId = searchParams.get('session');
        if (!requestedId || loadingSessions) return;
        const exists = sessions.some((s) => String(s.id) === String(requestedId));
        if (exists && String(selectedSessionId) !== String(requestedId)) {
            selectSession(requestedId);
        }
        // Clear the query param once handled so it doesn't re-trigger or
        // linger in the URL after the therapist picks a different session.
        if (exists) {
            setSearchParams({}, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessions, loadingSessions]);

    const addItem = (type) => setItems((prev) => [...prev, emptyItem(type)]);
    const updateItem = (key, field, value) =>
        setItems((prev) => prev.map((it) => (it._key === key ? { ...it, [field]: value } : it)));
    const removeItem = (key) => setItems((prev) => prev.filter((it) => it._key !== key));

    const addMedicine = (match) => {
        setMedicines((prev) => [...prev, emptyMedicine(match)]);
        setMedQuery('');
        setMedResults([]);
    };
    const addFreeTextMedicine = () => {
        if (!medQuery.trim()) return;
        addMedicine({ name: medQuery.trim() });
    };
    const updateMedicine = (key, field, value) =>
        setMedicines((prev) => prev.map((m) => (m._key === key ? { ...m, [field]: value } : m)));
    const removeMedicine = (key) => setMedicines((prev) => prev.filter((m) => m._key !== key));

    const addTest = (match) => {
        setTests((prev) => [...prev, emptyTest(match)]);
        setTestQuery('');
        setTestResults([]);
    };
    const addFreeTextTest = () => {
        if (!testQuery.trim()) return;
        addTest({ name: testQuery.trim() });
    };
    const updateTest = (key, field, value) =>
        setTests((prev) => prev.map((t) => (t._key === key ? { ...t, [field]: value } : t)));
    const removeTest = (key) => setTests((prev) => prev.filter((t) => t._key !== key));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedSessionId) {
            setMessage({ text: 'Choose a session first.', type: 'error' });
            return;
        }
        const cleanItems = items
            .map((it) => ({ ...it, title: it.title.trim() }))
            .filter((it) => it.title);

        const cleanMedicines = medicines
            .filter((m) => m.medicine_name && m.medicine_name.trim())
            .map((m) => ({
                medicine_id: m.medicine_id,
                medicine_name: m.medicine_name.trim(),
                dosage: (m.dosage || '').trim(),
                frequency_code: buildFrequencyCode(m),
                frequency_label: buildFrequencyLabel(m),
                duration_days: m.duration_days ? Number(m.duration_days) : null,
                instructions: (m.instructions || '').trim()
            }));

        const cleanTests = tests
            .filter((t) => t.test_name && t.test_name.trim())
            .map((t) => ({ test_id: t.test_id, test_name: t.test_name.trim(), notes: (t.notes || '').trim() }));

        if (followUpRecommended && !followUpDate) {
            setMessage({ text: 'Pick a follow-up date, or uncheck "Recommend a follow-up".', type: 'error' });
            return;
        }

        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            await savePrescription({
                sessionId: selectedSessionId,
                sessionNotes,
                medications,
                additionalBriefing,
                carePlanItems: cleanItems.map(({ item_type, title, youtube_url }) => ({ item_type, title, youtube_url })),
                medicines: cleanMedicines,
                tests: cleanTests,
                followUp: { recommended: followUpRecommended, date: followUpDate || null, notes: followUpNotes.trim() }
            });
            setMessage({ text: 'Saved — session marked complete and the patient has been notified.', type: 'success' });
            setJustSaved(true);
            // Reflect the completed status locally without a full refetch.
            setSessions((prev) => prev.map((s) => (String(s.id) === String(selectedSessionId) ? { ...s, status: 'completed' } : s)));
        } catch (err) {
            console.error('Failed to save prescription', err);
            setMessage({ text: err.response?.data?.message || 'Failed to save. Try again.', type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadPdf = async () => {
        if (!selectedSessionId) return;
        setDownloadingPdf(true);
        setMessage({ text: '', type: '' });
        try {
            const data = await getPrescriptionPdfDataForTherapist(selectedSessionId);
            generatePrescriptionPdf({
                hospitalName: data.hospital_name,
                doctorName: data.doctor_name,
                doctorQualification: data.doctor_qualification,
                licenseNumber: data.license_number,
                sessionDate: data.scheduled_date,
                sessionType: data.session_type,
                patientName: data.patient_name,
                patientContact: data.patient_contact,
                patientLocation: data.patient_location,
                presessionSummary: data.presession_summary,
                additionalBriefing: data.additional_briefing,
                sessionNotes: data.session_notes,
                medicines: data.medicines,
                tests: data.tests
            });
        } catch (err) {
            console.error('Failed to build PDF', err);
            setMessage({ text: 'Save the prescription first, then download the PDF.', type: 'error' });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const selectedSession = sessions.find((s) => String(s.id) === String(selectedSessionId));
    const hasSavedPrescription = justSaved || selectedSession?.status === 'completed';
    const isCrisis = briefing?.vitals?.severity?.startsWith('In crisis');

    return (
        <div className="ps-container">
            <header className="ps-header">
                <div className="ps-header-icon"><FileText size={22} /></div>
                <div>
                    <h1>Prescription Builder</h1>
                    <p>Review the pre-session briefing, write up the session, and build a printable prescription.</p>
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

            {selectedSessionId && !loadingBriefing && briefing && (
                <div className="ps-briefing-card">
                    <span className="ps-briefing-label"><Sparkles size={13} /> Pre-Session Briefing (AI Summary)</span>
                    <p className="ps-briefing-text">{briefing.summary}</p>
                    {isCrisis && (
                        <div className="ps-briefing-crisis">
                            <AlertCircle size={14} /> Flagged as crisis-level severity at intake — confirm the patient's current safety.
                        </div>
                    )}
                </div>
            )}

            {selectedSessionId && (
                loadingPrescription ? (
                    <p className="ps-state-msg">Loading prescription...</p>
                ) : (
                    <form onSubmit={handleSave} className="ps-form">
                        <div className="ps-field">
                            <label>Additional Briefing <span className="ps-label-hint">— your own notes, in addition to the AI summary above</span></label>
                            <textarea
                                rows="3"
                                placeholder="Anything you want on record before/about this session that isn't captured by the intake questionnaire..."
                                value={additionalBriefing}
                                onChange={(e) => setAdditionalBriefing(e.target.value)}
                            />
                        </div>

                        <div className="ps-field">
                            <label>Session Notes</label>
                            <textarea
                                rows="4"
                                placeholder="What was covered this session, observations, follow-up plan..."
                                value={sessionNotes}
                                onChange={(e) => setSessionNotes(e.target.value)}
                            />
                        </div>

                        {/* --- Structured Medicines (printed on the Rx) --- */}
                        <div className="ps-rx-section">
                            <label className="ps-rx-section-label"><Pill size={14} /> Medicines</label>
                            <div className="ps-search-box">
                                <Search size={14} className="ps-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search the medicine catalog (e.g. Sertraline)..."
                                    value={medQuery}
                                    onChange={(e) => setMedQuery(e.target.value)}
                                />
                            </div>
                            {medQuery.trim() && (
                                <div className="ps-dropdown">
                                    {medSearching ? (
                                        <p className="ps-dropdown-msg">Searching...</p>
                                    ) : medResults.length > 0 ? (
                                        medResults.map((m) => (
                                            <button type="button" key={m.id} className="ps-dropdown-item" onClick={() => addMedicine(m)}>
                                                <span className="ps-dropdown-item-name">{m.name}</span>
                                                <span className="ps-dropdown-item-meta">{m.category}{m.common_strength ? ` · ${m.common_strength}` : ''}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <button type="button" className="ps-dropdown-item ps-dropdown-freeform" onClick={addFreeTextMedicine}>
                                            No catalog match — add "{medQuery.trim()}" as free text
                                        </button>
                                    )}
                                </div>
                            )}

                            {medicines.length === 0 ? (
                                <p className="ps-state-msg ps-items-empty">No medicines added yet — search above to add one.</p>
                            ) : (
                                <div className="ps-rx-list">
                                    {medicines.map((m, idx) => (
                                        <div key={m._key} className="ps-rx-row">
                                            <div className="ps-rx-row-top">
                                                <span className="ps-rx-index">{idx + 1}.</span>
                                                <span className="ps-rx-name">{m.medicine_name}</span>
                                                <input
                                                    type="text"
                                                    className="ps-rx-dosage"
                                                    placeholder="Dosage (e.g. 50mg)"
                                                    value={m.dosage}
                                                    onChange={(e) => updateMedicine(m._key, 'dosage', e.target.value)}
                                                />
                                                <button type="button" className="ps-btn-remove" onClick={() => removeMedicine(m._key)}>
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                            <div className="ps-rx-row-bottom">
                                                <div className="ps-dose-slots">
                                                    {DOSE_SLOTS.map((slot) => (
                                                        <label key={slot.key} className={`ps-dose-chip ${m[slot.key] ? 'ps-dose-chip-on' : ''}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={m[slot.key]}
                                                                onChange={(e) => updateMedicine(m._key, slot.key, e.target.checked)}
                                                            />
                                                            {slot.label}
                                                        </label>
                                                    ))}
                                                    <span className="ps-freq-code">{buildFrequencyCode(m)}</span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    className="ps-rx-duration"
                                                    placeholder="Days"
                                                    value={m.duration_days}
                                                    onChange={(e) => updateMedicine(m._key, 'duration_days', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="ps-rx-instructions"
                                                    placeholder="Instructions (e.g. After meal)"
                                                    value={m.instructions}
                                                    onChange={(e) => updateMedicine(m._key, 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- Structured Tests (printed on the Rx) --- */}
                        <div className="ps-rx-section">
                            <label className="ps-rx-section-label"><FlaskConical size={14} /> Tests Advised</label>
                            <div className="ps-search-box">
                                <Search size={14} className="ps-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search the test catalog (e.g. Thyroid, CBC)..."
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                />
                            </div>
                            {testQuery.trim() && (
                                <div className="ps-dropdown">
                                    {testSearching ? (
                                        <p className="ps-dropdown-msg">Searching...</p>
                                    ) : testResults.length > 0 ? (
                                        testResults.map((t) => (
                                            <button type="button" key={t.id} className="ps-dropdown-item" onClick={() => addTest(t)}>
                                                <span className="ps-dropdown-item-name">{t.name}</span>
                                                <span className="ps-dropdown-item-meta">{t.category}</span>
                                            </button>
                                        ))
                                    ) : (
                                        <button type="button" className="ps-dropdown-item ps-dropdown-freeform" onClick={addFreeTextTest}>
                                            No catalog match — add "{testQuery.trim()}" as free text
                                        </button>
                                    )}
                                </div>
                            )}

                            {tests.length === 0 ? (
                                <p className="ps-state-msg ps-items-empty">No tests added yet.</p>
                            ) : (
                                <div className="ps-rx-list">
                                    {tests.map((t, idx) => (
                                        <div key={t._key} className="ps-test-row">
                                            <span className="ps-rx-index">{idx + 1}.</span>
                                            <span className="ps-rx-name">{t.test_name}</span>
                                            <input
                                                type="text"
                                                className="ps-test-notes"
                                                placeholder="Notes (optional)"
                                                value={t.notes}
                                                onChange={(e) => updateTest(t._key, 'notes', e.target.value)}
                                            />
                                            <button type="button" className="ps-btn-remove" onClick={() => removeTest(t._key)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
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

                        <div className="ps-items-section">
                            <div className="ps-items-header">
                                <label>
                                    <CalendarClock size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                                    Follow-Up Session
                                </label>
                                <label className="ps-followup-toggle">
                                    <input
                                        type="checkbox"
                                        checked={followUpRecommended}
                                        onChange={(e) => setFollowUpRecommended(e.target.checked)}
                                    />
                                    Recommend a follow-up
                                </label>
                            </div>

                            {followUpRecommended ? (
                                <div className="ps-followup-fields">
                                    <div className="ps-followup-row">
                                        <label htmlFor="ps-followup-date">Suggested date</label>
                                        <input
                                            id="ps-followup-date"
                                            type="date"
                                            value={followUpDate}
                                            min={new Date().toISOString().slice(0, 10)}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                        />
                                    </div>
                                    <textarea
                                        className="ps-followup-notes"
                                        placeholder="Why you're recommending a follow-up (shown to the patient)..."
                                        rows={2}
                                        value={followUpNotes}
                                        onChange={(e) => setFollowUpNotes(e.target.value)}
                                    />
                                    {followUpStatus !== 'none' && (
                                        <p className={`ps-followup-status ps-followup-status-${followUpStatus}`}>
                                            {followUpStatus === 'proposed' && 'Waiting on the patient to respond.'}
                                            {followUpStatus === 'accepted' && <><CheckCircle2 size={13} /> Patient accepted this follow-up.</>}
                                            {followUpStatus === 'declined' && 'Patient declined this follow-up.'}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="ps-state-msg ps-items-empty">
                                    Not recommending a follow-up for this session.
                                </p>
                            )}
                        </div>

                        {selectedSession?.status === 'completed' && (
                            <p className="ps-completed-note">
                                This session is already marked completed — saving will update the existing prescription.
                            </p>
                        )}

                        <div className="ps-submit-row">
                            <button type="submit" className="ps-btn-submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save & Mark Session Complete'}
                            </button>
                            {hasSavedPrescription && (
                                <button
                                    type="button"
                                    className="ps-btn-download"
                                    onClick={handleDownloadPdf}
                                    disabled={downloadingPdf}
                                >
                                    <Download size={15} /> {downloadingPdf ? 'Preparing...' : 'Download Prescription PDF'}
                                </button>
                            )}
                        </div>
                    </form>
                )
            )}
        </div>
    );
};

export default PrescriptionStudio;
