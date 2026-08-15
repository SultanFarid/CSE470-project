import { useState, useEffect, useCallback } from 'react';
import { Archive, Search, ChevronRight, FileText, Pill } from 'lucide-react';
import { searchMyPatients, getPatientHistory } from '../../services/api';
import './PatientArchives.css';

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString([], { dateStyle: 'medium' });
};

const PatientArchives = () => {
    const [patients, setPatients] = useState([]);
    const [search, setSearch] = useState('');
    const [loadingPatients, setLoadingPatients] = useState(true);

    const [selectedPatient, setSelectedPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const loadPatients = useCallback(async (q) => {
        setLoadingPatients(true);
        try {
            const data = await searchMyPatients(q);
            setPatients(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to search patients', err);
        } finally {
            setLoadingPatients(false);
        }
    }, []);

    useEffect(() => { loadPatients(''); }, [loadPatients]);

    // Debounce search-as-you-type instead of firing a request per keystroke.
    useEffect(() => {
        const timer = setTimeout(() => loadPatients(search), 350);
        return () => clearTimeout(timer);
    }, [search, loadPatients]);

    const openPatient = async (patient) => {
        setSelectedPatient(patient);
        setLoadingHistory(true);
        try {
            const data = await getPatientHistory(patient.patient_id);
            setHistory(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to load patient history', err);
            setHistory([]);
        } finally {
            setLoadingHistory(false);
        }
    };

    return (
        <div className="pa-container">
            <header className="pa-header">
                <div className="pa-header-icon"><Archive size={22} /></div>
                <div>
                    <h1>Patient History</h1>
                    <p>Look back at a patient's past sessions, notes, and prescriptions.</p>
                </div>
            </header>

            <div className="pa-layout">
                <section className="pa-list-panel">
                    <div className="pa-search-box">
                        <Search size={15} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loadingPatients ? (
                        <p className="pa-state-msg">Loading...</p>
                    ) : patients.length === 0 ? (
                        <p className="pa-state-msg">No patients found.</p>
                    ) : (
                        <div className="pa-patient-list">
                            {patients.map((p) => (
                                <button
                                    key={p.patient_id}
                                    className={`pa-patient-item ${selectedPatient?.patient_id === p.patient_id ? 'active' : ''}`}
                                    onClick={() => openPatient(p)}
                                >
                                    <div>
                                        <span className="pa-patient-name">{p.patient_name}</span>
                                        <span className="pa-patient-meta">{p.total_sessions} session{p.total_sessions === 1 ? '' : 's'} · last {formatDate(p.last_session_date)}</span>
                                    </div>
                                    <ChevronRight size={16} />
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className="pa-detail-panel">
                    {!selectedPatient ? (
                        <div className="pa-empty-detail">
                            <Archive size={26} />
                            <p>Select a patient to view their session history.</p>
                        </div>
                    ) : loadingHistory ? (
                        <p className="pa-state-msg">Loading history...</p>
                    ) : (
                        <>
                            <h2 className="pa-detail-title">{selectedPatient.patient_name}</h2>
                            <p className="pa-detail-sub">{selectedPatient.email}</p>

                            {history.length === 0 ? (
                                <p className="pa-state-msg">No session records found.</p>
                            ) : (
                                <div className="pa-history-list">
                                    {history.map((h) => (
                                        <div key={h.session_id} className="pa-history-item">
                                            <div className="pa-history-item-head">
                                                <span className="pa-history-date">{formatDate(h.scheduled_date || h.created_at)}</span>
                                                <span className={`pa-status-badge status-${h.status}`}>{h.status}</span>
                                            </div>
                                            {h.prescription ? (
                                                <div className="pa-prescription-box">
                                                    {h.prescription.session_notes && (
                                                        <p><FileText size={13} /> {h.prescription.session_notes}</p>
                                                    )}
                                                    {h.prescription.medications && (
                                                        <p><Pill size={13} /> {h.prescription.medications}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="pa-no-notes">No prescription notes recorded for this session.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default PatientArchives;
