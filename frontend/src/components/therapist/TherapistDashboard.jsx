import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Video, AlertTriangle, FileText, Star, History, PlayCircle } from 'lucide-react';
import './TherapistDashboard.css';
import {
    getMyTherapistSessions, updateSessionStatus,
    getMyCaseload, getMyEarnings, getMyReviewSummary, sendCheckIn
} from '../../services/api';

const OPEN_STATUSES = ['pending', 'confirmed', 'in_progress'];
const RED_FLAG_THRESHOLD = 40;

const adherenceClass = (rate) => (rate >= 75 ? 'success' : rate >= RED_FLAG_THRESHOLD ? 'warning' : 'danger');
const isSameDay = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};
const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const TherapistDashboard = () => {
    const { user } = useOutletContext();

    const [sessions, setSessions] = useState([]);
    const [caseload, setCaseload] = useState([]);
    const [earnings, setEarnings] = useState(null);
    const [reviewSummary, setReviewSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionMsg, setActionMsg] = useState('');
    const [sendingCheckin, setSendingCheckin] = useState(false);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        try {
            const [sessionsData, caseloadData, earningsData, reviewData] = await Promise.all([
                getMyTherapistSessions().catch(() => []),
                getMyCaseload().catch(() => []),
                getMyEarnings().catch(() => null),
                getMyReviewSummary().catch(() => null),
            ]);
            setSessions(Array.isArray(sessionsData) ? sessionsData : []);
            setCaseload(Array.isArray(caseloadData) ? caseloadData : []);
            setEarnings(earningsData);
            setReviewSummary(reviewData);
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

    const handleAdvanceStatus = async (sessionId, nextStatus) => {
        setActionMsg('');
        try {
            await updateSessionStatus(sessionId, nextStatus);
            setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status: nextStatus } : s)));
        } catch (err) {
            console.error('Failed to update session status', err);
            setActionMsg('Could not update that session — try again.');
        }
    };

    const handleSendCheckIn = async (patientId, patientName) => {
        setSendingCheckin(true);
        setActionMsg('');
        try {
            await sendCheckIn(patientId, `Hi — just checking in. We noticed you haven't logged your daily care plan much this week. Let us know if anything needs adjusting.`);
            setActionMsg(`Check-in message sent to ${patientName}.`);
        } catch (err) {
            console.error('Failed to send check-in', err);
            setActionMsg('Could not send the check-in — try again.');
        } finally {
            setSendingCheckin(false);
        }
    };

    const openSessions = sessions.filter((s) => OPEN_STATUSES.includes(s.status));
    const todaysSessions = openSessions.filter((s) => isSameDay(s.scheduled_date || s.created_at));
    // Fallback for existing bookings that predate scheduled_date/time support in the booking flow.
    const scheduleToShow = todaysSessions.length > 0
        ? todaysSessions
        : [...openSessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);
    const showingFallbackSchedule = todaysSessions.length === 0 && scheduleToShow.length > 0;

    const todaysEarnings = todaysSessions.reduce((sum, s) => sum + (Number(s.fee) || 0), 0);

    const sortedCaseload = [...caseload].sort((a, b) => {
        const aRate = a.adherence_rate === null ? 101 : a.adherence_rate;
        const bRate = b.adherence_rate === null ? 101 : b.adherence_rate;
        return aRate - bRate;
    });
    const complianceSnapshot = sortedCaseload.slice(0, 4);
    const patientsNeedingAttention = sortedCaseload.filter((c) => c.adherence_rate !== null && c.adherence_rate < RED_FLAG_THRESHOLD);
    const topFlag = patientsNeedingAttention[0] || null;

    if (loading) {
        return <p className="dashboard-loading">Loading your dashboard...</p>;
    }

    return (
        <div className="dashboard-grid">

            {actionMsg && <div className="card span-12 action-toast">{actionMsg}</div>}

            {/* Tier 1: Welcome banner */}
            <div className="card span-12 pulse-banner">
                <div>
                    <h1 className="pulse-title">Good to see you, {user.name} 👋</h1>
                    <p className="pulse-subtitle">Here's what's happening in your practice today.</p>
                </div>
                <div className="pulse-metrics">
                    <div className="pill pill-metric">📅 {todaysSessions.length} session{todaysSessions.length === 1 ? '' : 's'} today</div>
                    <div className="pill pill-metric">💰 ${todaysEarnings.toLocaleString()} expected today</div>
                    {patientsNeedingAttention.length > 0 ? (
                        <div className="pill pill-danger">
                            <AlertTriangle size={14} /> {patientsNeedingAttention.length} patient{patientsNeedingAttention.length === 1 ? '' : 's'} need{patientsNeedingAttention.length === 1 ? 's' : ''} attention
                        </div>
                    ) : (
                        <div className="pill pill-metric">✅ All patients on track</div>
                    )}
                </div>
            </div>

            {/* Tier 2 Left: Today's schedule */}
            <div className="card span-7 schedule-card">
                <div className="card-header">
                    <div>
                        <h2>{showingFallbackSchedule ? 'Recent Sessions' : "Today's Schedule"}</h2>
                        <p className="card-subtitle">Sessions you can start, and quick access to patient notes.</p>
                    </div>
                    <Link to="/therapist-dashboard/schedule" className="link">Edit Schedule →</Link>
                </div>
                {showingFallbackSchedule && (
                    <p className="schedule-fallback-note">
                        Nothing's scheduled for today yet — showing your most recent bookings instead.
                    </p>
                )}
                {scheduleToShow.length === 0 ? (
                    <p className="empty-state-msg">No upcoming sessions right now.</p>
                ) : (
                    <div className="appointment-list">
                        {scheduleToShow.map((appt) => (
                            <div key={appt.id} className="appointment-row">
                                <div className="appointment-info">
                                    <span className="appointment-time">
                                        {appt.scheduled_date ? formatTime(`${appt.scheduled_date}T${appt.scheduled_time || '00:00'}`) : formatTime(appt.created_at)} — {appt.patient_name}
                                    </span>
                                    {appt.session_type === 'online' ? (
                                        <span className="badge badge-online">
                                            <Video size={12} /> Online
                                        </span>
                                    ) : (
                                        <span className="badge badge-in-person">🏥 In-Person</span>
                                    )}
                                    <Link to="/therapist-dashboard/archive" className="btn-ai-briefing">
                                        <History size={13} /> View Patient History
                                    </Link>
                                </div>
                                <div className="appointment-action">
                                    {appt.status === 'in_progress' ? (
                                        <Link to="/therapist-dashboard/prescriptions" className="btn-launch-room">
                                            <FileText size={14} /> Write Session Notes
                                        </Link>
                                    ) : (
                                        <button className="btn-launch-room" onClick={() => handleAdvanceStatus(appt.id, 'in_progress')}>
                                            <PlayCircle size={14} /> Start Session
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tier 2 Right: Needs attention + quick actions */}
            <div className="span-5 stack-col">
                <div className="card red-flag-card">
                    <div>
                        <h2 className="card-header-simple">Needs Your Attention</h2>
                        <p className="card-subtitle">Patients who've fallen behind on their daily care plan.</p>
                    </div>
                    {topFlag ? (
                        <div className="alert-card">
                            <span className="alert-title">⚠️ Falling behind on care plan</span>
                            <p className="alert-message">
                                {topFlag.patient_name} has completed only {topFlag.adherence_rate}% of their daily checklist this week.
                            </p>
                            <div className="alert-actions">
                                <button
                                    className="btn-checkin"
                                    disabled={sendingCheckin}
                                    onClick={() => handleSendCheckIn(topFlag.patient_id, topFlag.patient_name)}
                                >
                                    ✉️ {sendingCheckin ? 'Sending...' : 'Send Check-In'}
                                </button>
                                <Link to="/therapist-dashboard/archive" className="btn-care-plan">View Patient Details</Link>
                            </div>
                            {patientsNeedingAttention.length > 1 && (
                                <Link to="/therapist-dashboard/caseload" className="alert-more-link">
                                    +{patientsNeedingAttention.length - 1} more patient{patientsNeedingAttention.length - 1 === 1 ? '' : 's'} need attention →
                                </Link>
                            )}
                        </div>
                    ) : (
                        <p className="empty-state-msg">All your patients are on track — nice work!</p>
                    )}
                </div>

                <div className="card shortcuts-card">
                    <h3 className="card-header-simple">Quick Actions</h3>
                    <div className="shortcuts-grid">
                        <Link to="/therapist-dashboard/prescriptions" className="shortcut-btn shortcut-primary">+ Write Session Notes</Link>
                        <Link to="/therapist-dashboard/group-proposals" className="shortcut-btn shortcut-secondary">+ Propose Group Session</Link>
                        <Link to="/therapist-dashboard/schedule" className="shortcut-btn shortcut-muted">📅 Edit My Schedule</Link>
                        <Link to="/therapist-dashboard/archive" className="shortcut-btn shortcut-muted">🗄 Patient History</Link>
                    </div>
                </div>
            </div>

            {/* Tier 3 Left: Patient progress overview */}
            <div className="card span-7 compliance-card">
                <div className="card-header">
                    <div>
                        <h2>Patient Progress Overview</h2>
                        <p className="card-subtitle">How well each patient is keeping up with their care plan.</p>
                    </div>
                    <Link to="/therapist-dashboard/caseload" className="link">View All ({caseload.length}) →</Link>
                </div>
                {complianceSnapshot.length === 0 ? (
                    <p className="empty-state-msg">No patients yet — once someone books with you, they'll show up here.</p>
                ) : (
                    <div className="compliance-list">
                        {complianceSnapshot.map((c) => {
                            const level = c.adherence_rate === null ? null : adherenceClass(c.adherence_rate);
                            return (
                                <div key={c.patient_id} className="compliance-row">
                                    <div className="compliance-top">
                                        <span className="compliance-name">{c.patient_name}</span>
                                        {level ? (
                                            <span className={`compliance-percent text-${level}`}>{c.adherence_rate}%</span>
                                        ) : (
                                            <span className="compliance-percent text-muted-inline">No care plan yet</span>
                                        )}
                                    </div>
                                    <div className="progress-bar">
                                        <div className={`bar-fill ${level ? `fill-${level}` : ''}`} style={{ width: `${c.adherence_rate || 0}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Tier 3 Right: This month at a glance */}
            <div className="card span-5 performance-card">
                <div>
                    <h2 className="card-header-simple">This Month at a Glance</h2>
                    <p className="card-subtitle">A quick snapshot — see full numbers on the Earnings page.</p>
                </div>
                <div className="stats-grid stats-grid-3">
                    <div className="stat-tile">
                        <span className="stat-label">Earnings</span>
                        <span className="stat-value">${(earnings?.currentMonthRevenue ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="stat-label">Sessions Done</span>
                        <span className="stat-value">{earnings?.completedSessions ?? 0}</span>
                    </div>
                    <div className="stat-tile">
                        <span className="stat-label">Avg. Rating</span>
                        <span className="stat-value">
                            {reviewSummary && Number(reviewSummary.totalReviews) > 0 ? (
                                <><Star size={15} fill="currentColor" style={{ marginRight: 3 }} />{reviewSummary.avgRating}</>
                            ) : '—'}
                        </span>
                    </div>
                </div>
                {reviewSummary && Number(reviewSummary.totalReviews) > 0 ? (
                    <p className="reputation-footnote">Based on {reviewSummary.totalReviews} patient review{reviewSummary.totalReviews === 1 ? '' : 's'}{reviewSummary.topTags.length > 0 ? ` · often praised for ${reviewSummary.topTags[0]}` : ''}</p>
                ) : (
                    <p className="reputation-footnote">No patient reviews yet.</p>
                )}
                <Link to="/therapist-dashboard/earnings" className="link view-earnings-link">View Earnings Details →</Link>
            </div>

        </div>
    );
};

export default TherapistDashboard;
