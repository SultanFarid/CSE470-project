import { useState, useEffect } from 'react';
import { FileText, Calendar, User, Download, AlertCircle, CalendarClock } from 'lucide-react';
import { getMyPrescriptionsList, getPrescriptionPdfDataForPatient } from '../../services/api';
import { generatePrescriptionPdf } from '../../utils/generatePrescriptionPdf';
import './PatientPrescriptions.css';

const PatientPrescriptions = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getMyPrescriptionsList();
                setList(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error('Failed to load prescriptions', err);
                setMessage({ text: 'Could not load your prescriptions.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleDownload = async (sessionId) => {
        setDownloadingId(sessionId);
        setMessage({ text: '', type: '' });
        try {
            const data = await getPrescriptionPdfDataForPatient(sessionId);
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
            setMessage({ text: 'Your therapist hasn\'t added a prescription for this session yet.', type: 'error' });
        } finally {
            setDownloadingId(null);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date not set';
        return new Date(dateStr).toLocaleDateString([], { dateStyle: 'medium' });
    };

    return (
        <div className="pp-container">
            <header className="pp-header">
                <div className="pp-header-icon"><FileText size={22} /></div>
                <div>
                    <h1>My Prescriptions</h1>
                    <p>Prescriptions your therapist has written after your completed sessions.</p>
                </div>
            </header>

            {message.text && (
                <div className="pp-alert">
                    <AlertCircle size={16} /><span>{message.text}</span>
                </div>
            )}

            {loading ? (
                <p className="pp-state-msg">Loading your prescriptions...</p>
            ) : list.length === 0 ? (
                <p className="pp-state-msg">No completed sessions yet — prescriptions will appear here after a session is marked complete.</p>
            ) : (
                <div className="pp-list">
                    {list.map((row) => (
                        <div key={row.session_id} className="pp-card">
                            <div className="pp-card-main">
                                <div className="pp-card-icon"><User size={16} /></div>
                                <div>
                                    <p className="pp-doctor-name">Dr. {row.doctor_name}</p>
                                    <p className="pp-session-date"><Calendar size={12} /> {formatDate(row.scheduled_date)}</p>
                                    {row.follow_up_recommended ? (
                                        <p className={`pp-followup-tag pp-followup-${row.follow_up_status}`}>
                                            <CalendarClock size={12} />
                                            {row.follow_up_status === 'proposed' && `Follow-up suggested for ${formatDate(row.follow_up_date)} — respond above`}
                                            {row.follow_up_status === 'accepted' && `Follow-up accepted for ${formatDate(row.follow_up_date)}`}
                                            {row.follow_up_status === 'declined' && 'Follow-up declined'}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                            {row.prescription_id ? (
                                <button
                                    className="pp-btn-download"
                                    onClick={() => handleDownload(row.session_id)}
                                    disabled={downloadingId === row.session_id}
                                >
                                    <Download size={14} /> {downloadingId === row.session_id ? 'Preparing...' : 'Download PDF'}
                                </button>
                            ) : (
                                <span className="pp-pending-tag">Not written yet</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PatientPrescriptions;
