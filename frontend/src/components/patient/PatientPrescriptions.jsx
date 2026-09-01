import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FileText, Calendar, User, Download, AlertCircle, CalendarClock, 
    ArrowLeft, Pill, FlaskConical, Stethoscope, Clock, CheckCircle2, 
    Search, Sparkles, Building, Video, MapPin, Dumbbell,
    ChevronDown, ChevronUp, ChevronsUpDown, Star
} from 'lucide-react';
import { getMyPrescriptionsList, getPrescriptionPdfDataForPatient, submitReview } from '../../services/api';
import { generatePrescriptionPdf } from '../../utils/generatePrescriptionPdf';
import ReviewFeedbackModal from './ReviewFeedbackModal';
import './PatientPrescriptions.css';

const PatientPrescriptions = () => {
    const navigate = useNavigate();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [filterFollowUp, setFilterFollowUp] = useState('all');
    const [expandedIds, setExpandedIds] = useState(new Set());

    // Review / Feedback Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedRxForReview, setSelectedRxForReview] = useState(null);
    const [reviewedSessionIds, setReviewedSessionIds] = useState(new Set());

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getMyPrescriptionsList();
                const rxList = Array.isArray(data) ? data : [];
                setList(rxList);
                // Auto-expand the most recent prescription by default
                if (rxList.length > 0) {
                    setExpandedIds(new Set([rxList[0].session_id]));
                }
            } catch (err) {
                console.error('Failed to load prescriptions', err);
                setMessage({ text: 'Could not load your prescriptions.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const toggleExpand = (sessionId) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(sessionId)) {
                next.delete(sessionId);
            } else {
                next.add(sessionId);
            }
            return next;
        });
    };

    const toggleExpandAll = () => {
        if (expandedIds.size === list.length) {
            setExpandedIds(new Set());
        } else {
            setExpandedIds(new Set(list.map(r => r.session_id)));
        }
    };

    const openFeedbackModal = (rx, e) => {
        if (e) e.stopPropagation();
        setSelectedRxForReview(rx);
        setShowReviewModal(true);
    };

    const handleReviewSubmitted = async (payload) => {
        await submitReview(payload);
        if (selectedRxForReview) {
            setReviewedSessionIds(prev => new Set([...prev, selectedRxForReview.session_id]));
        }
        setMessage({ 
            text: `Thank you! Your feedback for Dr. ${selectedRxForReview?.doctor_name || 'Therapist'} has been submitted.`, 
            type: 'success' 
        });
        setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    };

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
                tests: data.tests,
                previous_prescription: data.previous_prescription
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
        return new Date(dateStr).toLocaleDateString([], { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    };

    // Filter list by search query and follow-up status
    const filteredList = list.filter((rx) => {
        const docName = (rx.doctor_name || '').toLowerCase();
        const medNames = (rx.medicines || []).map(m => (m.medicine_name || '').toLowerCase()).join(' ');
        const testNames = (rx.tests || []).map(t => (t.test_name || '').toLowerCase()).join(' ');
        const q = searchQuery.toLowerCase().trim();

        const matchesQuery = !q || docName.includes(q) || medNames.includes(q) || testNames.includes(q);

        if (!matchesQuery) return false;

        if (filterFollowUp === 'follow_up_only') {
            return rx.follow_up_recommended;
        }
        if (filterFollowUp === 'has_medicines') {
            return rx.medicines && rx.medicines.length > 0;
        }
        return true;
    });

    const totalPrescriptions = list.filter(r => r.prescription_id).length;
    const totalMedicinesPrescribed = list.reduce((acc, r) => acc + (r.medicines?.length || 0), 0);
    const pendingFollowUps = list.filter(r => r.follow_up_recommended && r.follow_up_status === 'proposed').length;
    const allExpanded = filteredList.length > 0 && expandedIds.size === filteredList.length;

    return (
        <div className="pp-page">
            {/* Top Navigation & Back Bar */}
            <div className="pp-topbar">
                <button className="pp-btn-back" onClick={() => navigate('/patient-dashboard')}>
                    <ArrowLeft size={16} />
                    <span>Back to Dashboard</span>
                </button>
                <div className="pp-topbar-tag">
                    <Sparkles size={14} className="text-amber" />
                    <span>Official Patient Health Records</span>
                </div>
            </div>

            <div className="pp-container">
                {/* Hero Header */}
                <header className="pp-hero-header">
                    <div className="pp-hero-left">
                        <div className="pp-hero-icon">
                            <FileText size={28} />
                        </div>
                        <div>
                            <h1 className="pp-hero-title">My Prescriptions & Treatment Plans</h1>
                            <p className="pp-hero-subtitle">
                                Review your digital prescriptions, prescribed medications, diagnostic tests, and leave session feedback.
                            </p>
                        </div>
                    </div>
                </header>

                {/* Quick Stats Grid */}
                <div className="pp-stats-row">
                    <div className="pp-stat-card">
                        <div className="pp-stat-icon icon-blue"><FileText size={20} /></div>
                        <div>
                            <span className="pp-stat-number">{totalPrescriptions}</span>
                            <span className="pp-stat-label">Published Prescriptions</span>
                        </div>
                    </div>
                    <div className="pp-stat-card">
                        <div className="pp-stat-icon icon-green"><Pill size={20} /></div>
                        <div>
                            <span className="pp-stat-number">{totalMedicinesPrescribed}</span>
                            <span className="pp-stat-label">Prescribed Medications</span>
                        </div>
                    </div>
                    <div className="pp-stat-card">
                        <div className="pp-stat-icon icon-purple"><CalendarClock size={20} /></div>
                        <div>
                            <span className="pp-stat-number">{pendingFollowUps}</span>
                            <span className="pp-stat-label">Actionable Follow-ups</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="pp-controls-row">
                    <div className="pp-search-wrapper">
                        <Search size={16} className="pp-search-icon" />
                        <input
                            type="text"
                            className="pp-search-input"
                            placeholder="Search by doctor name, medicine, or advised test..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="pp-controls-right">
                        <div className="pp-filter-tabs">
                            <button 
                                className={`pp-filter-tab ${filterFollowUp === 'all' ? 'active' : ''}`}
                                onClick={() => setFilterFollowUp('all')}
                            >
                                All Records
                            </button>
                            <button 
                                className={`pp-filter-tab ${filterFollowUp === 'has_medicines' ? 'active' : ''}`}
                                onClick={() => setFilterFollowUp('has_medicines')}
                            >
                                <Pill size={13} /> With Medications
                            </button>
                            <button 
                                className={`pp-filter-tab ${filterFollowUp === 'follow_up_only' ? 'active' : ''}`}
                                onClick={() => setFilterFollowUp('follow_up_only')}
                            >
                                <CalendarClock size={13} /> Follow-ups
                            </button>
                        </div>
                        {filteredList.length > 1 && (
                            <button className="pp-btn-toggle-all" onClick={toggleExpandAll}>
                                <ChevronsUpDown size={14} />
                                <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {message.text && (
                    <div className={`pp-alert pp-alert-${message.type || 'error'}`}>
                        <AlertCircle size={16} /><span>{message.text}</span>
                    </div>
                )}

                {/* Main List */}
                {loading ? (
                    <div className="pp-loading-state">
                        <div className="pp-spinner" />
                        <p>Loading your medical prescriptions...</p>
                    </div>
                ) : filteredList.length === 0 ? (
                    <div className="pp-empty-state">
                        <div className="pp-empty-icon"><FileText size={36} /></div>
                        <h3>No Prescriptions Found</h3>
                        <p>
                            {searchQuery || filterFollowUp !== 'all'
                                ? 'No prescriptions match your current filter. Try adjusting your search query.'
                                : 'Prescriptions created by your therapist after a completed session will be archived here.'}
                        </p>
                        <button className="pp-btn-home" onClick={() => navigate('/patient-dashboard')}>
                            Go to Recovery Hub
                        </button>
                    </div>
                ) : (
                    <div className="pp-prescriptions-grid">
                        {filteredList.map((rx) => {
                            const isExpanded = expandedIds.has(rx.session_id);
                            const hasMedicines = rx.medicines && rx.medicines.length > 0;
                            const hasTests = rx.tests && rx.tests.length > 0;
                            const hasCarePlan = rx.care_plan_items && rx.care_plan_items.length > 0;
                            const isDownloading = downloadingId === rx.session_id;
                            const isReviewed = reviewedSessionIds.has(rx.session_id);

                            return (
                                <article key={rx.session_id} className={`pp-full-card ${isExpanded ? 'is-expanded' : ''}`}>
                                    {/* 1. Header: Doctor Info, Download Action, Feedback & Dropdown Toggle */}
                                    <header className="pp-card-header" onClick={() => toggleExpand(rx.session_id)}>
                                        <div className="pp-card-doctor-info">
                                            <div className="pp-doctor-avatar">
                                                {rx.doctor_photo ? (
                                                    <img src={rx.doctor_photo} alt={rx.doctor_name} />
                                                ) : (
                                                    <Stethoscope size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <div className="pp-doctor-title-row">
                                                    <h3 className="pp-doctor-title">Dr. {rx.doctor_name}</h3>
                                                    <span className="pp-badge-official">✓ Verified Rx</span>
                                                </div>
                                                <div className="pp-doctor-meta-line">
                                                    {rx.doctor_qualification && (
                                                        <span className="pp-meta-item">{rx.doctor_qualification}</span>
                                                    )}
                                                    {rx.hospital_name && (
                                                        <span className="pp-meta-item">
                                                            <Building size={12} /> {rx.hospital_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="pp-session-tags-row">
                                                    <span className="pp-badge-session-date">
                                                        <Calendar size={12} /> {formatDate(rx.scheduled_date)}
                                                    </span>
                                                    {rx.time_slot && (
                                                        <span className="pp-badge-session-time">
                                                            <Clock size={12} /> {rx.time_slot}
                                                        </span>
                                                    )}
                                                    <span className="pp-badge-session-type">
                                                        <Video size={12} /> {rx.session_type === 'in-person' ? 'In-Person Consultation' : 'Online Telehealth'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pp-card-header-actions" onClick={(e) => e.stopPropagation()}>
                                            {/* Feedback Button */}
                                            <button
                                                type="button"
                                                className={`pp-btn-feedback ${isReviewed ? 'reviewed' : ''}`}
                                                onClick={(e) => openFeedbackModal(rx, e)}
                                                title="Rate this session & leave doctor feedback"
                                            >
                                                <Star size={14} className={isReviewed ? 'text-amber fill-amber' : 'text-amber'} />
                                                <span>{isReviewed ? 'Feedback Sent ✓' : 'Rate & Feedback'}</span>
                                            </button>

                                            {/* Download PDF Button */}
                                            {rx.prescription_id ? (
                                                <button
                                                    className="pp-btn-download-primary"
                                                    onClick={() => handleDownload(rx.session_id)}
                                                    disabled={isDownloading}
                                                >
                                                    <Download size={14} />
                                                    <span>{isDownloading ? 'Building PDF...' : 'Download PDF'}</span>
                                                </button>
                                            ) : (
                                                <span className="pp-badge-pending">Rx Pending</span>
                                            )}

                                            {/* Dropdown Menu Toggle Button */}
                                            <button 
                                                className={`pp-btn-dropdown-toggle ${isExpanded ? 'open' : ''}`}
                                                onClick={() => toggleExpand(rx.session_id)}
                                                aria-label={isExpanded ? 'Collapse prescription' : 'Expand prescription'}
                                                title={isExpanded ? 'Hide details' : 'View full prescription'}
                                            >
                                                <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        </div>
                                    </header>

                                    {/* Compact Summary Bar (visible when collapsed) */}
                                    {!isExpanded && rx.prescription_id && (
                                        <div className="pp-collapsed-summary" onClick={() => toggleExpand(rx.session_id)}>
                                            <div className="pp-summary-pill-group">
                                                {hasMedicines && (
                                                    <span className="pp-summary-pill">
                                                        <Pill size={13} className="text-green" /> {rx.medicines.length} Medicine{rx.medicines.length > 1 ? 's' : ''} Prescribed
                                                    </span>
                                                )}
                                                {hasTests && (
                                                    <span className="pp-summary-pill">
                                                        <FlaskConical size={13} className="text-purple" /> {rx.tests.length} Advised Test{rx.tests.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {rx.follow_up_recommended && (
                                                    <span className="pp-summary-pill">
                                                        <CalendarClock size={13} className="text-amber" /> Follow-Up: {formatDate(rx.follow_up_date)}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="pp-summary-expand-hint">
                                                Click to view entire prescription ▾
                                            </span>
                                        </div>
                                    )}

                                    {/* Expandable Dropdown Body (Whole Prescription View) */}
                                    {isExpanded && (
                                        <div className="pp-expandable-content">
                                            {/* 2. Clinical Notes / Summary (If present) */}
                                            {(rx.session_notes || rx.presession_summary) && (
                                                <div className="pp-clinical-notes-box">
                                                    <h4 className="pp-section-label">
                                                        <FileText size={14} className="text-blue" />
                                                        Clinical Observations & Advice
                                                    </h4>
                                                    {rx.session_notes && (
                                                        <p className="pp-notes-text">{rx.session_notes}</p>
                                                    )}
                                                    {rx.presession_summary && !rx.session_notes && (
                                                        <p className="pp-notes-text">{rx.presession_summary}</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* 3. Prescribed Medicines Section */}
                                            {hasMedicines && (
                                                <div className="pp-card-section">
                                                    <h4 className="pp-section-label">
                                                        <Pill size={15} className="text-green" />
                                                        Prescribed Medications ({rx.medicines.length})
                                                    </h4>
                                                    <div className="pp-medicines-table-wrapper">
                                                        <table className="pp-medicines-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Medicine Name</th>
                                                                    <th>Dosage</th>
                                                                    <th>Frequency</th>
                                                                    <th>Duration</th>
                                                                    <th>Instructions</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rx.medicines.map((m, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="col-idx">{idx + 1}</td>
                                                                        <td className="col-name">
                                                                            <strong>{m.medicine_name}</strong>
                                                                        </td>
                                                                        <td className="col-dosage">
                                                                            <span className="pp-dosage-pill">{m.dosage || 'Standard'}</span>
                                                                        </td>
                                                                        <td className="col-frequency">
                                                                            <div className="pp-frequency-group">
                                                                                <span className="pp-freq-code-badge">{m.frequency_code || '1-0-1'}</span>
                                                                                <span className="pp-freq-subtext">
                                                                                    {m.frequency_code === '1-0-1' ? 'Morning & Night' :
                                                                                     m.frequency_code === '1-1-1' ? 'Morning, Noon, Night' :
                                                                                     m.frequency_code === '0-0-1' ? 'Night Only' :
                                                                                     m.frequency_code === '1-0-0' ? 'Morning Only' : 'As directed'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="col-duration">
                                                                            {m.duration_days ? `${m.duration_days} Days` : 'Continue as needed'}
                                                                        </td>
                                                                        <td className="col-instructions">
                                                                            {m.instructions ? (
                                                                                <span className="pp-instruction-badge">{m.instructions}</span>
                                                                            ) : (
                                                                                <span className="text-muted">After meal</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* 4. Advised Tests Section */}
                                            {hasTests && (
                                                <div className="pp-card-section">
                                                    <h4 className="pp-section-label">
                                                        <FlaskConical size={15} className="text-purple" />
                                                        Recommended Diagnostic & Psychological Tests
                                                    </h4>
                                                    <div className="pp-tests-grid">
                                                        {rx.tests.map((t, idx) => (
                                                            <div key={idx} className="pp-test-pill-item">
                                                                <div className="pp-test-number">{idx + 1}</div>
                                                                <div>
                                                                    <strong className="pp-test-name">{t.test_name}</strong>
                                                                    {t.notes && <p className="pp-test-notes">{t.notes}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 5. Care Plan & Exercises Prescribed */}
                                            {hasCarePlan && (
                                                <div className="pp-card-section">
                                                    <h4 className="pp-section-label">
                                                        <Dumbbell size={15} className="text-orange" />
                                                        Prescribed Care Plan & Daily Exercises
                                                    </h4>
                                                    <div className="pp-careplan-list">
                                                        {rx.care_plan_items.map((item, idx) => (
                                                            <div key={idx} className="pp-careplan-item">
                                                                <CheckCircle2 size={15} color="#16a34a" />
                                                                <span>{item.title}</span>
                                                                {item.youtube_url && (
                                                                    <a 
                                                                        href={item.youtube_url} 
                                                                        target="_blank" 
                                                                        rel="noreferrer"
                                                                        className="pp-video-link"
                                                                    >
                                                                        ▶ Watch Video
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* 6. Follow-Up Schedule Banner */}
                                            {rx.follow_up_recommended ? (
                                                <footer className={`pp-followup-banner pp-followup-${rx.follow_up_status}`}>
                                                    <div className="pp-followup-left">
                                                        <div className="pp-followup-icon">
                                                            <CalendarClock size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 className="pp-followup-title">
                                                                {rx.follow_up_status === 'accepted' ? 'Follow-Up Confirmed' :
                                                                 rx.follow_up_status === 'declined' ? 'Follow-Up Declined' :
                                                                 'Follow-Up Consultation Recommended'}
                                                            </h5>
                                                            <p className="pp-followup-desc">
                                                                Recommended Target Date: <strong>{formatDate(rx.follow_up_date)}</strong>
                                                                {rx.follow_up_notes && ` — "${rx.follow_up_notes}"`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="pp-followup-badge">
                                                        {rx.follow_up_status === 'accepted' && '✓ Accepted by you'}
                                                        {rx.follow_up_status === 'proposed' && '⏳ Response Pending'}
                                                        {rx.follow_up_status === 'declined' && 'Declined'}
                                                    </div>
                                                </footer>
                                            ) : null}
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Review & Feedback Modal */}
            {showReviewModal && selectedRxForReview && (
                <ReviewFeedbackModal
                    showReviewModal={showReviewModal}
                    setShowReviewModal={setShowReviewModal}
                    therapist={{
                        id: selectedRxForReview.doctor_id,
                        name: selectedRxForReview.doctor_name,
                        specialties: selectedRxForReview.doctor_qualification
                    }}
                    appointmentId={selectedRxForReview.session_id}
                    onReviewSubmitted={handleReviewSubmitted}
                    getInitials={(name) => name ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'DR'}
                />
            )}
        </div>
    );
};

export default PatientPrescriptions;
