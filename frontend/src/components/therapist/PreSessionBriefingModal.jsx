import { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle } from 'lucide-react';
import { getPreSessionBriefing } from '../../services/api';
import './PreSessionBriefingModal.css';

const PreSessionBriefingModal = ({ sessionId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [briefing, setBriefing] = useState(null);

    useEffect(() => {
        if (!sessionId) return;
        let cancelled = false;
        setLoading(true);
        setError('');
        getPreSessionBriefing(sessionId)
            .then((data) => { if (!cancelled) setBriefing(data); })
            .catch((err) => {
                if (!cancelled) setError(err.response?.data?.message || 'Could not load the briefing.');
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [sessionId]);

    if (!sessionId) return null;

    const isCrisis = briefing?.vitals?.severity?.startsWith('In crisis');

    return (
        <div className="psb-overlay" onClick={onClose}>
            <div className="psb-box" onClick={(e) => e.stopPropagation()}>
                <div className="psb-header">
                    <span className="psb-header-tag"><Sparkles size={15} /> Pre-Session Briefing</span>
                    <button className="psb-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                {loading && <p className="psb-state-msg">Loading briefing...</p>}
                {error && <p className="psb-state-msg psb-error">{error}</p>}

                {!loading && !error && briefing && (
                    <>
                        <h2 className="psb-patient-name">{briefing.patient?.name}</h2>
                        {(briefing.patient?.location || briefing.patient?.preferred_language) && (
                            <p className="psb-patient-meta">
                                {[briefing.patient?.location, briefing.patient?.preferred_language].filter(Boolean).join(' · ')}
                            </p>
                        )}

                        {isCrisis && (
                            <div className="psb-crisis-banner">
                                <AlertTriangle size={16} />
                                <span>This patient flagged a crisis-level severity during intake. Confirm their current safety at the start of the session.</span>
                            </div>
                        )}

                        <div className="psb-summary-card">
                            <span className="psb-summary-label">AI Summary of Intake Questionnaire</span>
                            <p className="psb-summary-text">{briefing.summary}</p>
                        </div>

                        {briefing.vitals && (
                            <div className="psb-raw-grid">
                                {briefing.vitals.concerns?.length > 0 && (
                                    <div className="psb-raw-item">
                                        <span className="psb-raw-label">Concerns</span>
                                        <div className="psb-chip-row">
                                            {briefing.vitals.concerns.map((c) => (
                                                <span key={c} className="psb-chip">{c}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {briefing.vitals.duration && (
                                    <div className="psb-raw-item">
                                        <span className="psb-raw-label">Duration</span>
                                        <span className="psb-raw-value">{briefing.vitals.duration}</span>
                                    </div>
                                )}
                                {briefing.vitals.severity && (
                                    <div className="psb-raw-item">
                                        <span className="psb-raw-label">Severity</span>
                                        <span className="psb-raw-value">{briefing.vitals.severity}</span>
                                    </div>
                                )}
                                {briefing.vitals.format_pref && (
                                    <div className="psb-raw-item">
                                        <span className="psb-raw-label">Format Preference</span>
                                        <span className="psb-raw-value">{briefing.vitals.format_pref}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {!briefing.vitals && (
                            <p className="psb-state-msg">This patient hasn't completed a Vitals Check questionnaire yet.</p>
                        )}
                    </>
                )}

                <button className="psb-close-footer-btn" onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default PreSessionBriefingModal;
