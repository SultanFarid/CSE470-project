import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FileText, Trash2, Pill, Dumbbell, FlaskConical,
    CheckCircle2, AlertCircle, Film, Search, Download, Sparkles, CalendarClock,
    History, Copy, ChevronDown, ChevronUp, Plus, Brain, Video, ExternalLink
} from 'lucide-react';
import {
    getMyTherapistSessions, getPrescriptionForSession, savePrescription,
    getPreSessionBriefing, searchMedicines, searchTests, searchExerciseVideos,
    getPrescriptionPdfDataForTherapist
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
    morning: false,
    noon: false,
    night: false,
    duration_days: '',
    instructions: ''
});

const emptyTest = (t = {}) => ({
    _key: crypto.randomUUID(),
    test_id: t.id || null,
    test_name: t.name || '',
    notes: ''
});

// Converts the three boolean slots into a "1-0-1"-style frequency code
const buildFrequencyCode = (m) => `${m.morning ? '1' : '0'}-${m.noon ? '1' : '0'}-${m.night ? '1' : '0'}`;

const buildFrequencyLabel = (m) => {
    const slots = [];
    if (m.morning) slots.push('Morning');
    if (m.noon) slots.push('Noon');
    if (m.night) slots.push('Night');
    return slots.length > 0 ? slots.join(' + ') : 'As directed';
};

const PrescriptionStudio = () => {
    const [searchParams] = useSearchParams();
    const preselectedSessionId = searchParams.get('session');

    const [sessions, setSessions] = useState([]);
    const [selectedSessionId, setSelectedSessionId] = useState(preselectedSessionId || '');
    const [loadingSessions, setLoadingSessions] = useState(true);

    const [briefing, setBriefing] = useState(null);
    const [sessionNotes, setSessionNotes] = useState('');
    const [medications, setMedications] = useState('');
    const [additionalBriefing, setAdditionalBriefing] = useState('');
    const [items, setItems] = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [tests, setTests] = useState([]);
    const [followUpRecommended, setFollowUpRecommended] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpNotes, setFollowUpNotes] = useState('');
    const [followUpStatus, setFollowUpStatus] = useState('none');
    const [hasExistingPrescription, setHasExistingPrescription] = useState(false);
    const [previousPrescriptions, setPreviousPrescriptions] = useState([]);
    const [showPreviousRx, setShowPreviousRx] = useState(true);
    const [showAiCopilot, setShowAiCopilot] = useState(true);

    const [loadingPrescription, setLoadingPrescription] = useState(false);
    const [saving, setSaving] = useState(false);
    const [hasSavedPrescription, setHasSavedPrescription] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loadingBriefing, setLoadingBriefing] = useState(false);
    const [therapistWantsAiSuggestions, setTherapistWantsAiSuggestions] = useState(false);

    // Medicine search
    const [medQuery, setMedQuery] = useState('');
    const [medResults, setMedResults] = useState([]);
    const [medSearching, setMedSearching] = useState(false);

    // Test search
    const [testQuery, setTestQuery] = useState('');
    const [testResults, setTestResults] = useState([]);
    const [testSearching, setTestSearching] = useState(false);

    // Curated Exercise Video catalog search
    const [exerciseQuery, setExerciseQuery] = useState('');
    const [exerciseResults, setExerciseResults] = useState([]);
    const [exerciseSearching, setExerciseSearching] = useState(false);
    const [showExerciseCatalog, setShowExerciseCatalog] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoadingSessions(true);
            try {
                const data = await getMyTherapistSessions();
                const list = Array.isArray(data) ? data : [];
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

    // Debounced curated exercise search
    useEffect(() => {
        if (!exerciseQuery.trim()) {
            searchExerciseVideos('')
                .then((res) => setExerciseResults(Array.isArray(res) ? res : []))
                .catch(() => setExerciseResults([]));
            return undefined;
        }
        setExerciseSearching(true);
        const t = setTimeout(() => {
            searchExerciseVideos(exerciseQuery.trim())
                .then((res) => setExerciseResults(Array.isArray(res) ? res : []))
                .catch(() => setExerciseResults([]))
                .finally(() => setExerciseSearching(false));
        }, 200);
        return () => clearTimeout(t);
    }, [exerciseQuery]);

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
        setHasExistingPrescription(false);
        setPreviousPrescriptions([]);
    };

    const loadPrescription = useCallback(async (sessionId) => {
        if (!sessionId) return;
        setLoadingPrescription(true);
        resetForm();
        try {
            const existing = await getPrescriptionForSession(sessionId);
            if (existing) {
                const isExisting = !!(existing.id || existing.prescription_id || (existing.medicines && existing.medicines.length > 0) || existing.session_notes);
                setHasExistingPrescription(isExisting);
                setHasSavedPrescription(isExisting);

                if (Array.isArray(existing.previous_prescriptions)) {
                    setPreviousPrescriptions(existing.previous_prescriptions);
                } else {
                    setPreviousPrescriptions([]);
                }

                if (existing.prescription_id || existing.id) {
                    setSessionNotes(existing.session_notes || '');
                    setMedications(existing.medications || '');
                    setAdditionalBriefing(existing.additional_briefing || '');
                    setItems(
                        (existing.care_plan_items || []).map((i) => ({
                            item_type: i.item_type || 'medication',
                            title: i.title || '',
                            youtube_url: i.youtube_url || '',
                            _key: crypto.randomUUID()
                        }))
                    );
                    setMedicines(
                        (existing.medicines || []).map((m) => {
                            const code = String(m.frequency_code || '1-0-1').split('-');
                            return {
                                _key: crypto.randomUUID(),
                                medicine_id: m.medicine_id || null,
                                medicine_name: m.medicine_name || '',
                                dosage: m.dosage || '',
                                morning: code[0] === '1',
                                noon: code[1] === '1',
                                night: code[2] === '1',
                                duration_days: m.duration_days ?? '',
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
                    setFollowUpDate(existing.follow_up_date ? String(existing.follow_up_date).slice(0, 10) : '');
                    setFollowUpNotes(existing.follow_up_notes || '');
                    setFollowUpStatus(existing.follow_up_status || 'none');
                }
            } else {
                setHasExistingPrescription(false);
                setPreviousPrescriptions([]);
            }
        } catch (err) {
            console.error('Failed to load existing prescription', err);
        } finally {
            setLoadingPrescription(false);
        }
    }, []);

    const copyPreviousMedicines = (prev) => {
        if (!prev.medicines || prev.medicines.length === 0) return;
        const newMeds = prev.medicines.map((m) => {
            const code = String(m.frequency_code || '1-0-1').split('-');
            return {
                _key: crypto.randomUUID(),
                medicine_id: m.medicine_id || null,
                medicine_name: m.medicine_name,
                dosage: m.dosage || '',
                morning: code[0] === '1',
                noon: code[1] === '1',
                night: code[2] === '1',
                duration_days: m.duration_days || '',
                instructions: m.instructions || ''
            };
        });
        setMedicines(newMeds);
        setMessage({ text: 'Copied medications from previous prescription!', type: 'success' });
    };

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

    useEffect(() => {
        if (selectedSessionId) {
            loadPrescription(selectedSessionId);
            loadBriefing(selectedSessionId);
        }
    }, [selectedSessionId, loadPrescription, loadBriefing]);

    const handleSessionChange = (e) => {
        const id = e.target.value;
        setSelectedSessionId(id);
        setTherapistWantsAiSuggestions(false);
        setMessage({ text: '', type: '' });
    };

    // Care plan item helpers
    const addItem = (item_type) => setItems((prev) => [...prev, emptyItem(item_type)]);
    const removeItem = (key) => setItems((prev) => prev.filter((i) => i._key !== key));
    const updateItem = (key, field, val) =>
        setItems((prev) => prev.map((i) => (i._key === key ? { ...i, [field]: val } : i)));

    // Medicine helpers
    const addMedicine = (catalogMed) => {
        const isDuplicate = medicines.some((m) => 
            (catalogMed.id && m.medicine_id && Number(m.medicine_id) === Number(catalogMed.id)) ||
            (m.medicine_name || '').trim().toLowerCase() === (catalogMed.name || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${catalogMed.name}" has already been added to this prescription.`, type: 'error' });
            return;
        }
        setMedicines((prev) => [...prev, emptyMedicine(catalogMed)]);
        setMedQuery('');
        setMedResults([]);
    };

    const addFreeTextMedicine = () => {
        const trimmed = medQuery.trim();
        if (!trimmed) return;
        const isDuplicate = medicines.some((m) => 
            (m.medicine_name || '').trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${trimmed}" has already been added to this prescription.`, type: 'error' });
            return;
        }
        setMedicines((prev) => [...prev, emptyMedicine({ name: trimmed })]);
        setMedQuery('');
        setMedResults([]);
    };

    const removeMedicine = (key) => setMedicines((prev) => prev.filter((m) => m._key !== key));
    const updateMedicine = (key, field, val) =>
        setMedicines((prev) => prev.map((m) => (m._key === key ? { ...m, [field]: val } : m)));

    // Test helpers
    const addTest = (catalogTest) => {
        const isDuplicate = tests.some((t) => 
            (catalogTest.id && t.test_id && Number(t.test_id) === Number(catalogTest.id)) ||
            (t.test_name || '').trim().toLowerCase() === (catalogTest.name || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${catalogTest.name}" has already been added to this prescription.`, type: 'error' });
            return;
        }
        setTests((prev) => [...prev, emptyTest(catalogTest)]);
        setTestQuery('');
        setTestResults([]);
    };

    const addFreeTextTest = () => {
        const trimmed = testQuery.trim();
        if (!trimmed) return;
        const isDuplicate = tests.some((t) => 
            (t.test_name || '').trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${trimmed}" has already been added to this prescription.`, type: 'error' });
            return;
        }
        setTests((prev) => [...prev, emptyTest({ name: trimmed })]);
        setTestQuery('');
        setTestResults([]);
    };

    const removeTest = (key) => setTests((prev) => prev.filter((t) => t._key !== key));
    const updateTest = (key, field, val) =>
        setTests((prev) => prev.map((t) => (t._key === key ? { ...t, [field]: val } : t)));

    // 1-Click AI Suggestion Handlers
    const addSuggestedMedicine = (s) => {
        const isDuplicate = medicines.some((m) => 
            (m.medicine_name || '').trim().toLowerCase() === (s.medicine_name || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${s.medicine_name}" is already in the prescription list.`, type: 'error' });
            return;
        }
        const code = String(s.frequency_code || '1-0-1').split('-');
        setMedicines((prev) => [
            ...prev,
            {
                _key: crypto.randomUUID(),
                medicine_id: null,
                medicine_name: s.medicine_name,
                dosage: s.dosage || '',
                morning: code[0] === '1',
                noon: code[1] === '1',
                night: code[2] === '1',
                duration_days: s.duration_days || '',
                instructions: s.instructions || ''
            }
        ]);
        setMessage({ text: `Added suggested medicine: ${s.medicine_name}`, type: 'success' });
    };

    const addSuggestedTest = (t) => {
        const isDuplicate = tests.some((item) => 
            (item.test_name || '').trim().toLowerCase() === (t.test_name || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${t.test_name}" is already in the tests list.`, type: 'error' });
            return;
        }
        setTests((prev) => [
            ...prev,
            {
                _key: crypto.randomUUID(),
                test_id: null,
                test_name: t.test_name,
                notes: t.notes || ''
            }
        ]);
        setMessage({ text: `Added suggested test: ${t.test_name}`, type: 'success' });
    };

    const addSuggestedExercise = (e) => {
        const isDuplicate = items.some((item) => 
            (item.title || '').trim().toLowerCase() === (e.title || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${e.title}" is already in the care plan checklist.`, type: 'error' });
            return;
        }
        setItems((prev) => [
            ...prev,
            {
                _key: crypto.randomUUID(),
                item_type: 'exercise',
                title: e.title,
                youtube_url: e.youtube_url || ''
            }
        ]);
        setMessage({ text: `Added exercise to care plan: ${e.title}`, type: 'success' });
    };

    // 1-Click Database Curated Video Add Handler
    const addCuratedExerciseVideo = (v) => {
        const isDuplicate = items.some((item) => 
            (item.title || '').trim().toLowerCase() === (v.title || '').trim().toLowerCase()
        );
        if (isDuplicate) {
            setMessage({ text: `"${v.title}" is already in the care plan checklist.`, type: 'error' });
            return;
        }
        setItems((prev) => [
            ...prev,
            {
                _key: crypto.randomUUID(),
                item_type: 'exercise',
                title: v.title,
                youtube_url: v.youtube_url || ''
            }
        ]);
        setMessage({ text: `Added "${v.title}" from library to care plan!`, type: 'success' });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedSessionId) return;

        setSaving(true);
        setMessage({ text: '', type: '' });
        try {
            const validItems = items
                .filter((i) => i.title.trim())
                .map(({ item_type, title, youtube_url }) => ({
                    item_type,
                    title: title.trim(),
                    youtube_url: youtube_url ? youtube_url.trim() : null
                }));

            const validMedicines = medicines
                .filter((m) => m.medicine_name.trim())
                .map((m) => ({
                    medicine_id: m.medicine_id,
                    medicine_name: m.medicine_name.trim(),
                    dosage: m.dosage.trim(),
                    frequency_code: buildFrequencyCode(m),
                    frequency_label: buildFrequencyLabel(m),
                    duration_days: m.duration_days ? parseInt(m.duration_days, 10) || null : null,
                    instructions: m.instructions ? m.instructions.trim() : null
                }));

            const validTests = tests
                .filter((t) => t.test_name.trim())
                .map((t) => ({
                    test_id: t.test_id,
                    test_name: t.test_name.trim(),
                    notes: t.notes ? t.notes.trim() : null
                }));

            await savePrescription(selectedSessionId, {
                session_notes: sessionNotes.trim(),
                medications: medications.trim(),
                additional_briefing: additionalBriefing.trim(),
                items: validItems,
                medicines: validMedicines,
                tests: validTests,
                follow_up_recommended: followUpRecommended,
                follow_up_date: followUpRecommended && followUpDate ? followUpDate : null,
                follow_up_notes: followUpRecommended && followUpNotes.trim() ? followUpNotes.trim() : null
            });

            setHasSavedPrescription(true);
            setJustSaved(true);
            setHasExistingPrescription(true);
            setMessage({
                text: hasExistingPrescription
                    ? 'Prescription updated successfully! Patient records and PDF have been updated.'
                    : 'Prescription saved & session marked complete! Patient can now view and download it.',
                type: 'success'
            });

            setSessions((prev) =>
                prev.map((s) => (s.id === parseInt(selectedSessionId, 10) ? { ...s, status: 'completed' } : s))
            );
        } catch (err) {
            console.error('Failed to save prescription', err);
            setMessage({ text: 'Failed to save prescription. Please try again.', type: 'error' });
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
                tests: data.tests,
                previous_prescription: data.previous_prescription
            });
        } catch (err) {
            console.error('Failed to build PDF', err);
            setMessage({ text: 'Could not generate prescription PDF. Please save first.', type: 'error' });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const selectedSession = sessions.find((s) => s.id === parseInt(selectedSessionId, 10));
    const isCompleted = selectedSession?.status === 'completed';
    const isCrisis = briefing?.vitals?.severity && String(briefing.vitals.severity).startsWith('In crisis');

    return (
        <div className="ps-container">
            <div className="ps-header">
                <div className={`ps-header-icon ${hasExistingPrescription ? 'ps-header-icon-update' : ''}`}>
                    <FileText size={22} />
                </div>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h1>{hasExistingPrescription ? 'Update Prescription' : 'Prescription Studio'}</h1>
                        {hasExistingPrescription && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#15803d',
                                background: '#dcfce7',
                                padding: '2px 8px',
                                borderRadius: '10px'
                            }}>
                                ✓ Existing Rx (Update Mode)
                            </span>
                        )}
                    </div>
                    <p>
                        {hasExistingPrescription
                            ? 'Update diagnostic notes, medicines, tests, and care plan items for this completed session.'
                            : 'Review patient briefing & AI clinical suggestions, build structured prescriptions, and assign care plans.'}
                    </p>
                </div>
            </div>

            {message.text && (
                <div className={`ps-alert ps-alert-${message.type}`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{message.text}</span>
                </div>
            )}

            <div className="ps-field ps-session-picker">
                <label>Select Patient Session</label>
                {loadingSessions ? (
                    <p className="ps-state-msg">Loading sessions...</p>
                ) : sessions.length === 0 ? (
                    <p className="ps-state-msg">No active or completed sessions found.</p>
                ) : (
                    <select value={selectedSessionId} onChange={handleSessionChange}>
                        <option value="">-- Choose a session --</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.patient_name} — {new Date(s.created_at).toLocaleDateString([], { dateStyle: 'medium' })} ({s.status})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* 1. Loading State while generating AI suggestions */}
            {selectedSessionId && loadingBriefing && (
                <div className="ps-ai-loading-card">
                    <div className="ps-spinner-ai" />
                    <div className="ps-ai-loading-text">
                        <h4>Loading AI clinical suggestions based on pre-session briefing...</h4>
                        <p>Analyzing patient intake responses to research tailored exercises, medications, and diagnostic tests.</p>
                    </div>
                </div>
            )}

            {/* 2. Pre-Session Briefing Card (Once loaded) */}
            {selectedSessionId && !loadingBriefing && briefing && (
                <div className="ps-briefing-card">
                    <span className="ps-briefing-label"><Sparkles size={13} /> Pre-Session Briefing (Intake Overview)</span>
                    <p className="ps-briefing-text">{briefing.summary}</p>
                    {isCrisis && (
                        <div className="ps-briefing-crisis">
                            <AlertCircle size={14} /> Flagged as crisis-level severity at intake — confirm the patient's current safety.
                        </div>
                    )}
                </div>
            )}

            {/* 3. AI Copilot Opt-In Prompt Card (Asks therapist if they want to view suggestions) */}
            {selectedSessionId && !loadingBriefing && briefing && (
                <div className="ps-ai-prompt-card">
                    <div className="ps-ai-prompt-header">
                        <div className="ps-ai-icon-bubble">
                            <Brain size={20} />
                        </div>
                        <div className="ps-ai-prompt-info">
                            <h4>AI Clinical Suggestions Ready</h4>
                            <p>
                                AI Copilot has prepared evidence-based suggestions (exercises, medications & diagnostic tests) based on this patient's pre-session intake. Would you like to review them?
                            </p>
                        </div>
                    </div>
                    <div className="ps-ai-prompt-actions">
                        <button
                            type="button"
                            className={`ps-btn-ai-optin ${therapistWantsAiSuggestions ? 'active' : ''}`}
                            onClick={() => setTherapistWantsAiSuggestions(!therapistWantsAiSuggestions)}
                        >
                            <Sparkles size={14} /> {therapistWantsAiSuggestions ? '✓ Showing AI Suggestions' : '✨ Yes, View AI Suggestions'}
                        </button>
                        {therapistWantsAiSuggestions && (
                            <button
                                type="button"
                                className="ps-btn-ai-dismiss"
                                onClick={() => setTherapistWantsAiSuggestions(false)}
                            >
                                Hide Suggestions
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 4. AI Clinical Research & Copilot Suggestions Card (Rendered only if therapist chose to view) */}
            {selectedSessionId && !loadingBriefing && briefing && therapistWantsAiSuggestions && (
                <div className="ps-ai-suggestions-card" style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '12px',
                    marginBottom: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 16px rgba(22, 101, 52, 0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        background: '#f0fdf4',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }} onClick={() => setShowAiCopilot(!showAiCopilot)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Brain size={18} color="#16a34a" />
                            <strong style={{ fontSize: '14px', color: '#166534' }}>
                                AI Clinical Research & Treatment Suggestions
                            </strong>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#15803d',
                                background: '#dcfce7',
                                padding: '2px 8px',
                                borderRadius: '10px'
                            }}>
                                🧠 Copilot Active
                            </span>
                        </div>
                        <button type="button" className="ps-btn-toggle-mini">
                            {showAiCopilot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>

                    {showAiCopilot && (
                        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Clinical Insights */}
                            {briefing.clinical_insights && briefing.clinical_insights.length > 0 && (
                                <div style={{ background: '#ffffff', border: '1px solid #dcfce7', borderRadius: '8px', padding: '12px 14px' }}>
                                    <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#15803d', letterSpacing: '0.04em' }}>
                                        💡 Key Clinical Insights
                                    </span>
                                    <ul style={{ margin: '6px 0 0', paddingLeft: '18px', fontSize: '13px', color: '#1e293b' }}>
                                        {briefing.clinical_insights.map((insight, idx) => (
                                            <li key={idx} style={{ marginBottom: '4px' }}>{insight}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggested Exercises */}
                            {briefing.suggested_exercises && briefing.suggested_exercises.length > 0 && (
                                <div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.04em' }}>
                                        🧘 Suggested Exercises & Coping Tools (1-Click Add)
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                        {briefing.suggested_exercises.map((e, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1px solid #bae6fd',
                                                borderRadius: '8px',
                                                gap: '8px'
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                                        <strong style={{ fontSize: '13px', color: '#0369a1' }}>{e.title}</strong>
                                                        {e.category && <span style={{ fontSize: '11px', color: '#64748b', background: '#f0f9ff', padding: '2px 6px', borderRadius: '6px' }}>{e.category}</span>}
                                                    </div>
                                                    {e.rationale && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.35 }}>{e.rationale}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addSuggestedExercise(e)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '5px',
                                                        background: '#e0f2fe',
                                                        border: '1px solid #7dd3fc',
                                                        color: '#0369a1',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        width: 'fit-content'
                                                    }}
                                                >
                                                    <Plus size={13} /> Add to Care Plan
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Medicines */}
                            {briefing.suggested_medicines && briefing.suggested_medicines.length > 0 && (
                                <div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#15803d', letterSpacing: '0.04em' }}>
                                        💊 Suggested Medications to Consider
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                        {briefing.suggested_medicines.map((m, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1px solid #bbf7d0',
                                                borderRadius: '8px',
                                                gap: '8px'
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                                        <strong style={{ fontSize: '13px', color: '#166534' }}>{m.medicine_name} {m.dosage ? `(${m.dosage})` : ''}</strong>
                                                        <span style={{ fontSize: '11px', color: '#64748b', background: '#f0fdf4', padding: '2px 6px', borderRadius: '6px' }}>{m.frequency_code || '1-0-0'}</span>
                                                    </div>
                                                    {m.rationale && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.35 }}>{m.rationale}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addSuggestedMedicine(m)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '5px',
                                                        background: '#dcfce7',
                                                        border: '1px solid #86efac',
                                                        color: '#166534',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        width: 'fit-content'
                                                    }}
                                                >
                                                    <Plus size={13} /> Add to Rx
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Suggested Tests */}
                            {briefing.suggested_tests && briefing.suggested_tests.length > 0 && (
                                <div>
                                    <span style={{ fontSize: '12.5px', fontWeight: 800, textTransform: 'uppercase', color: '#7c3aed', letterSpacing: '0.04em' }}>
                                        🔬 Suggested Diagnostic Tests & Scales
                                    </span>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginTop: '8px' }}>
                                        {briefing.suggested_tests.map((t, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between',
                                                padding: '12px 14px',
                                                background: '#ffffff',
                                                border: '1px solid #e9d5ff',
                                                borderRadius: '8px',
                                                gap: '8px'
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                                        <strong style={{ fontSize: '13px', color: '#6b21a8' }}>{t.test_name}</strong>
                                                        {t.category && <span style={{ fontSize: '11px', color: '#64748b', background: '#faf5ff', padding: '2px 6px', borderRadius: '6px' }}>{t.category}</span>}
                                                    </div>
                                                    {t.notes && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#475569', lineHeight: 1.35 }}>{t.notes}</p>}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => addSuggestedTest(t)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '5px',
                                                        background: '#f3e8ff',
                                                        border: '1px solid #d8b4fe',
                                                        color: '#6b21a8',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        width: 'fit-content'
                                                    }}
                                                >
                                                    <Plus size={13} /> Add Test
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Previous Prescription History Panel */}
            {selectedSessionId && previousPrescriptions.length > 0 && (
                <div className="ps-previous-rx-card">
                    <div className="ps-previous-rx-header" onClick={() => setShowPreviousRx(!showPreviousRx)}>
                        <div className="ps-previous-rx-title">
                            <History size={16} color="#7c3aed" />
                            <strong>Previous Prescription History ({previousPrescriptions.length} prior session{previousPrescriptions.length > 1 ? 's' : ''})</strong>
                            <span className="ps-followup-badge">Follow-Up Patient</span>
                        </div>
                        <button type="button" className="ps-btn-toggle-mini">
                            {showPreviousRx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    </div>
                    {showPreviousRx && (
                        <div className="ps-previous-rx-list">
                            {previousPrescriptions.map((prev, idx) => (
                                <div key={idx} className="ps-previous-rx-item">
                                    <div className="ps-previous-rx-meta">
                                        <span className="ps-prev-date">📅 Session on {new Date(prev.scheduled_date).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                                        {prev.medicines && prev.medicines.length > 0 && (
                                            <button
                                                type="button"
                                                className="ps-btn-copy-rx"
                                                onClick={() => copyPreviousMedicines(prev)}
                                                title="Copy these medications to the current prescription"
                                            >
                                                <Copy size={12} /> Re-use Medications
                                            </button>
                                        )}
                                    </div>
                                    {prev.session_notes && (
                                        <p className="ps-prev-notes"><strong>Notes:</strong> {prev.session_notes}</p>
                                    )}
                                    {prev.medicines && prev.medicines.length > 0 && (
                                        <div className="ps-prev-meds">
                                            <strong>Medications Prescribed:</strong>
                                            <ul>
                                                {prev.medicines.map((m, mIdx) => (
                                                    <li key={mIdx}>
                                                        <Pill size={12} /> {m.medicine_name} {m.dosage ? `(${m.dosage})` : ''} — {m.frequency_code || '1-0-1'}{m.instructions ? ` · ${m.instructions}` : ''}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    {prev.tests && prev.tests.length > 0 && (
                                        <div className="ps-prev-tests">
                                            <strong>Tests Advised:</strong> {prev.tests.map(t => t.test_name).join(', ')}
                                        </div>
                                    )}
                                </div>
                            ))}
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
                                        medResults.map((m) => {
                                            const isAlreadyAdded = medicines.some((existing) => 
                                                (existing.medicine_id && Number(existing.medicine_id) === Number(m.id)) ||
                                                (existing.medicine_name || '').trim().toLowerCase() === (m.name || '').trim().toLowerCase()
                                            );
                                            return (
                                                <button
                                                    type="button"
                                                    key={m.id}
                                                    className={`ps-dropdown-item ${isAlreadyAdded ? 'ps-dropdown-item-disabled' : ''}`}
                                                    onClick={() => !isAlreadyAdded && addMedicine(m)}
                                                    disabled={isAlreadyAdded}
                                                    style={isAlreadyAdded ? { opacity: 0.6, cursor: 'not-allowed', background: '#f8fafc' } : {}}
                                                >
                                                    <span className="ps-dropdown-item-name">
                                                        {m.name} {isAlreadyAdded && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginLeft: '6px' }}>✓ Already Added</span>}
                                                    </span>
                                                    <span className="ps-dropdown-item-meta">{m.category}{m.common_strength ? ` · ${m.common_strength}` : ''}</span>
                                                </button>
                                            );
                                        })
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
                                                    placeholder="Days (e.g. 30)"
                                                    value={m.duration_days}
                                                    onChange={(e) => updateMedicine(m._key, 'duration_days', e.target.value)}
                                                />
                                                <input
                                                    type="text"
                                                    className="ps-rx-instructions"
                                                    placeholder="Instructions (e.g. after meal)"
                                                    value={m.instructions}
                                                    onChange={(e) => updateMedicine(m._key, 'instructions', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- Structured Diagnostic Tests (printed on the Rx) --- */}
                        <div className="ps-rx-section">
                            <label className="ps-rx-section-label"><FlaskConical size={14} /> Diagnostic / Psychological Tests</label>
                            <div className="ps-search-box">
                                <Search size={14} className="ps-search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search the test catalog (e.g. GAD-7, PHQ-9, Thyroid Profile)..."
                                    value={testQuery}
                                    onChange={(e) => setTestQuery(e.target.value)}
                                />
                            </div>
                            {testQuery.trim() && (
                                <div className="ps-dropdown">
                                    {testSearching ? (
                                        <p className="ps-dropdown-msg">Searching...</p>
                                    ) : testResults.length > 0 ? (
                                        testResults.map((t) => {
                                            const isAlreadyAdded = tests.some((existing) => 
                                                (existing.test_id && Number(existing.test_id) === Number(t.id)) ||
                                                (existing.test_name || '').trim().toLowerCase() === (t.name || '').trim().toLowerCase()
                                            );
                                            return (
                                                <button
                                                    type="button"
                                                    key={t.id}
                                                    className={`ps-dropdown-item ${isAlreadyAdded ? 'ps-dropdown-item-disabled' : ''}`}
                                                    onClick={() => !isAlreadyAdded && addTest(t)}
                                                    disabled={isAlreadyAdded}
                                                    style={isAlreadyAdded ? { opacity: 0.6, cursor: 'not-allowed', background: '#f8fafc' } : {}}
                                                >
                                                    <span className="ps-dropdown-item-name">
                                                        {t.name} {isAlreadyAdded && <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold', marginLeft: '6px' }}>✓ Already Added</span>}
                                                    </span>
                                                    <span className="ps-dropdown-item-meta">{t.category}</span>
                                                </button>
                                            );
                                        })
                                    ) : (
                                        <button type="button" className="ps-dropdown-item ps-dropdown-freeform" onClick={addFreeTextTest}>
                                            No catalog match — add "{testQuery.trim()}" as free text
                                        </button>
                                    )}
                                </div>
                            )}

                            {tests.length === 0 ? (
                                <p className="ps-state-msg ps-items-empty">No tests advised yet — search above to add one.</p>
                            ) : (
                                <div className="ps-rx-list">
                                    {tests.map((t, idx) => (
                                        <div key={t._key} className="ps-rx-row ps-test-row">
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

                        {/* --- Daily Care Plan & Curated Exercise Video Library --- */}
                        <div className="ps-items-section">
                            <div className="ps-items-header">
                                <label>Daily Checklist for Patient & Therapeutic Exercises</label>
                                <div className="ps-add-btns">
                                    <button
                                        type="button"
                                        className="ps-btn-add"
                                        style={{ background: '#f5f3ff', color: '#7c3aed', borderColor: '#ddd6fe' }}
                                        onClick={() => setShowExerciseCatalog(!showExerciseCatalog)}
                                    >
                                        <Video size={13} /> {showExerciseCatalog ? 'Close Video Library' : 'Browse Exercise Video Library'}
                                    </button>
                                    <button type="button" className="ps-btn-add" onClick={() => addItem('medication')}>
                                        <Pill size={13} /> Add Custom Reminder
                                    </button>
                                    <button type="button" className="ps-btn-add" onClick={() => addItem('exercise')}>
                                        <Dumbbell size={13} /> Add Custom Exercise
                                    </button>
                                </div>
                            </div>

                            {/* Curated Exercise Video Library Search Panel */}
                            {showExerciseCatalog && (
                                <div style={{
                                    background: '#faf5ff',
                                    border: '1px solid #e9d5ff',
                                    borderRadius: '10px',
                                    padding: '14px',
                                    marginBottom: '14px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#581c87' }}>
                                            🎬 Curated Therapeutic Video Library (In-Database)
                                        </span>
                                        <span style={{ fontSize: '11px', color: '#7c3aed' }}>
                                            Search e.g. "shoulder therapy", "breathing", "neck", "sleep", "CBT"
                                        </span>
                                    </div>
                                    <div className="ps-search-box" style={{ marginBottom: '10px' }}>
                                        <Search size={14} className="ps-search-icon" />
                                        <input
                                            type="text"
                                            placeholder="Search therapy exercise videos (e.g. shoulder therapy, PMR, breathing)..."
                                            value={exerciseQuery}
                                            onChange={(e) => setExerciseQuery(e.target.value)}
                                        />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                                        {exerciseSearching ? (
                                            <p className="ps-state-msg">Searching database videos...</p>
                                        ) : exerciseResults.length === 0 ? (
                                            <p className="ps-state-msg">No videos match your search.</p>
                                        ) : (
                                            exerciseResults.map((v) => {
                                                const isAlreadyInPlan = items.some((item) => 
                                                    (item.title || '').trim().toLowerCase() === (v.title || '').trim().toLowerCase()
                                                );
                                                return (
                                                    <div key={v.id} style={{
                                                        background: '#ffffff',
                                                        border: '1px solid #ddd6fe',
                                                        borderRadius: '8px',
                                                        padding: '9px 12px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        justifyContent: 'space-between',
                                                        gap: '6px'
                                                    }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                                                                <strong style={{ fontSize: '12.5px', color: '#4c1d95' }}>{v.title}</strong>
                                                                <span style={{ fontSize: '10.5px', background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: '8px', whiteSpace: 'nowrap' }}>
                                                                    {v.duration_minutes}m · {v.category}
                                                                </span>
                                                            </div>
                                                            {v.description && (
                                                                <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: '#64748b', lineHeight: 1.3 }}>
                                                                    {v.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                                                            {v.youtube_url && (
                                                                <a
                                                                    href={v.youtube_url}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    style={{ fontSize: '11px', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}
                                                                >
                                                                    Preview Video <ExternalLink size={11} />
                                                                </a>
                                                            )}
                                                            <button
                                                                type="button"
                                                                disabled={isAlreadyInPlan}
                                                                onClick={() => addCuratedExerciseVideo(v)}
                                                                style={{
                                                                    background: isAlreadyInPlan ? '#f1f5f9' : '#7c3aed',
                                                                    color: isAlreadyInPlan ? '#94a3b8' : '#ffffff',
                                                                    border: 'none',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '6px',
                                                                    fontSize: '11px',
                                                                    fontWeight: 700,
                                                                    cursor: isAlreadyInPlan ? 'not-allowed' : 'pointer'
                                                                }}
                                                            >
                                                                {isAlreadyInPlan ? '✓ Added' : '+ Add Video'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {items.length === 0 ? (
                                <p className="ps-state-msg ps-items-empty">
                                    Nothing added yet. Add a video from the library above or custom reminder — your patient will see these as a daily to-do checklist.
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
                                                        placeholder="YouTube link (e.g. https://www.youtube.com/watch?v=...)"
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

                        {/* --- Follow-Up Consultation Section --- */}
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
                                <div className="ps-followup-body">
                                    <div className="ps-followup-row">
                                        <label>Target Date</label>
                                        <input
                                            type="date"
                                            value={followUpDate}
                                            onChange={(e) => setFollowUpDate(e.target.value)}
                                        />
                                    </div>
                                    <textarea
                                        className="ps-followup-notes"
                                        rows="2"
                                        placeholder="Reason for follow-up (e.g. Check progress after 2 weeks of medication and shoulder therapy)..."
                                        value={followUpNotes}
                                        onChange={(e) => setFollowUpNotes(e.target.value)}
                                    />
                                    {followUpStatus && followUpStatus !== 'none' && (
                                        <p className={`ps-followup-status ps-followup-status-${followUpStatus}`}>
                                            Patient response: <strong>{followUpStatus}</strong>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="ps-state-msg">No follow-up recommended for this session.</p>
                            )}
                        </div>

                        {isCompleted && !justSaved && (
                            <p className="ps-completed-note">
                                This session is already marked completed — saving will update the existing prescription.
                            </p>
                        )}

                        <div className="ps-submit-row">
                            <button 
                                type="submit" 
                                className={`ps-btn-submit ${hasExistingPrescription ? 'ps-btn-submit-update' : ''}`} 
                                disabled={saving}
                            >
                                {saving 
                                    ? (hasExistingPrescription ? 'Updating...' : 'Saving...') 
                                    : (hasExistingPrescription ? 'Update Prescription' : 'Save & Mark Session Complete')}
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
