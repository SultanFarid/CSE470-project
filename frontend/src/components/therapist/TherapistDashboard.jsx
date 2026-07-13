import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Bell, Video, Calendar, AlertTriangle, CheckCircle, LogOut,
    LayoutDashboard, ClipboardList, FileText, Archive, Users,
    Briefcase, UserCog, Bot, Star
} from 'lucide-react';
import './TherapistDashboard.css';

const NAV_ITEMS = [
    { label: 'Command Center', icon: LayoutDashboard, path: '/therapist-dashboard' },
    { label: 'Schedule Manager', icon: Calendar, path: null },
    { label: 'Active Caseload', icon: ClipboardList, path: null },
    { label: 'Prescription Studio', icon: FileText, path: null },
    { label: 'Patient Archives', icon: Archive, path: null },
    { label: 'Group Classes', icon: Users, path: null },
    { label: 'Earnings & Jobs', icon: Briefcase, path: null },
    { label: 'Profile Editor', icon: UserCog, path: '/therapist-dashboard/profile' },
];

// Mock data shaped to mirror the real relational schema
const SCHEDULE = [
    { session_id: 101, therapist_id: 6, patient_id: 12, patient_name: 'Patient A', time: '10:00 AM', session_type: 'online', session_status: 'in_progress' },
    { session_id: 102, therapist_id: 6, patient_id: 15, patient_name: 'Patient B', time: '11:30 AM', session_type: 'in-person', session_status: 'confirmed' },
    { session_id: 103, therapist_id: 6, patient_id: 19, patient_name: 'Patient C', time: '2:00 PM', session_type: 'online', session_status: 'confirmed' },
];

const COMPLIANCE = [
    { patient_id: 12, patient_name: 'Patient A', adherence_rate: 85 },
    { patient_id: 33, patient_name: 'Patient X', adherence_rate: 25 },
    { patient_id: 15, patient_name: 'Patient B', adherence_rate: 60 },
];

const RED_FLAG = {
    patient_id: 33,
    patient_name: 'Patient X',
    message: "missed medication check-offs and assigned YouTube exercise videos for 3 consecutive days."
};

const adherenceClass = (rate) => (rate >= 75 ? 'success' : rate >= 40 ? 'warning' : 'danger');
const getInitials = (fullName = '') => {
    return fullName
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};
const TherapistDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'therapist') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="dashboard-shell">
            {/* Top Navbar */}
            <header className="navbar">
                <div className="navbar-left">
                    <div className="brand-logo">S</div>
                    <span className="brand-name">Smart Recovery Portal</span>
                    <span className="badge-role">Therapist Mode</span>
                </div>
                <div className="navbar-right">
                    <div className="bell-wrapper">
                        <Bell size={20} />
                        <span className="alert-dot">2</span>
                    </div>
                    <div className="user-chip">
                        <div className="avatar">{getInitials(user.name)}</div>
                        <span className="user-name">{user.name}</span>
                    </div>
                </div>
            </header>

            {/* Left Sidebar */}
            <aside className="sidebar">
                <nav className="nav-list">
                    {NAV_ITEMS.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = idx === 0;
                        const className = `nav-item ${isActive ? 'active' : ''}`;

                        if (item.path && !isActive) {
                            return (
                                <Link key={item.label} to={item.path} className={className}>
                                    <Icon size={18} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        }
                        return (
                            <div key={item.label} className={className}>
                                <Icon size={18} />
                                <span>{item.label}</span>
                            </div>
                        );
                    })}
                </nav>
                <button className="logout-btn" onClick={handleLogout}>
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <div className="dashboard-grid">

                    {/* Tier 1: Daily Pulse Banner */}
                    <div className="card span-12 pulse-banner">
                        <div>
                            <h1 className="pulse-title">Good Morning, {user.name} 👋</h1>
                            <p className="pulse-subtitle">Here is your daily practice overview and urgent triage feed</p>
                        </div>
                        <div className="pulse-metrics">
                            <div className="pill pill-online">● Online (Taking Patients)</div>
                            <div className="pill pill-metric">📅 Today's Bookings: 4</div>
                            <div className="pill pill-metric">💰 Today's Est. Revenue: $450</div>
                            <div className="pill pill-danger">
                                <AlertTriangle size={14} /> 1 Critical Flag
                            </div>
                        </div>
                    </div>

                    {/* Tier 2 Left: Schedule & Telehealth Hub */}
                    <div className="card span-7 schedule-card">
                        <div className="card-header">
                            <h2>Today's Schedule & Telehealth Hub</h2>
                            <span className="link">View Matrix →</span>
                        </div>
                        <div className="appointment-list">
                            {SCHEDULE.map((appt) => (
                                <div key={appt.session_id} className="appointment-row">
                                    <div className="appointment-info">
                                        <span className="appointment-time">{appt.time} — {appt.patient_name}</span>
                                        {appt.session_type === 'online' ? (
                                            <span className="badge badge-online">
                                                <Video size={12} /> Online Video
                                            </span>
                                        ) : (
                                            <span className="badge badge-in-person">🏥 In-Person</span>
                                        )}
                                        <button className="btn-ai-briefing">
                                            <Bot size={13} /> Read AI Briefing
                                        </button>
                                    </div>
                                    <div className="appointment-action">
                                        {appt.session_type === 'online' ? (
                                            <button className="btn-launch-room">
                                                <Video size={14} /> Launch Room
                                            </button>
                                        ) : (
                                            <span className="badge-confirmed">
                                                <CheckCircle size={14} /> Confirmed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tier 2 Right: Red-Flag Feed & Shortcuts */}
                    <div className="span-5 stack-col">
                        <div className="card red-flag-card">
                            <h2 className="card-header-simple">Clinical Red-Flag Feed</h2>
                            <div className="alert-card">
                                <span className="alert-title">🚨 High-Priority Adherence Alert</span>
                                <p className="alert-message">
                                    {RED_FLAG.patient_name} {RED_FLAG.message}
                                </p>
                                <div className="alert-actions">
                                    <button className="btn-checkin">✉️ Send Check-In</button>
                                    <button className="btn-care-plan">View Care Plan</button>
                                </div>
                            </div>
                        </div>

                        <div className="card shortcuts-card">
                            <h3 className="card-header-simple">Quick Command Shortcuts</h3>
                            <div className="shortcuts-grid">
                                <button className="shortcut-btn shortcut-primary">+ Prescription Studio</button>
                                <button className="shortcut-btn shortcut-secondary">+ Propose Group Class</button>
                                <button className="shortcut-btn shortcut-muted">📅 Log Time-Off Override</button>
                                <button className="shortcut-btn shortcut-muted">👤 Invite Patient</button>
                            </div>
                        </div>
                    </div>

                    {/* Tier 3 Left: Caseload Compliance Snapshot */}
                    <div className="card span-7 compliance-card">
                        <div className="card-header">
                            <h2>Active Caseload Compliance Snapshot</h2>
                            <span className="link">View All (18) →</span>
                        </div>
                        <div className="compliance-list">
                            {COMPLIANCE.map((c) => {
                                const level = adherenceClass(c.adherence_rate);
                                return (
                                    <div key={c.patient_id} className="compliance-row">
                                        <div className="compliance-top">
                                            <span className="compliance-name">{c.patient_name} — Daily Care Checklist & Exercises</span>
                                            <span className={`compliance-percent text-${level}`}>{c.adherence_rate}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div className={`bar-fill fill-${level}`} style={{ width: `${c.adherence_rate}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tier 3 Right: Practice Performance Mini-Card */}
                    <div className="card span-5 performance-card">
                        <h2 className="card-header-simple">Practice Performance & Analytics</h2>
                        <div className="stats-grid">
                            <div className="stat-tile">
                                <span className="stat-label">Monthly Revenue</span>
                                <span className="stat-value">$4,250</span>
                            </div>
                            <div className="stat-tile">
                                <span className="stat-label">Completed Sessions</span>
                                <span className="stat-value">34</span>
                            </div>
                        </div>
                        <div className="reputation-box">
                            <span className="reputation-title">AI Matchmaker Signals & Reputation</span>
                            <div className="rating-row">
                                <span className="rating">
                                    <Star size={16} fill="currentColor" /> 4.9 / 5.0
                                </span>
                                <span className="rating-count">(42 Patient Reviews)</span>
                            </div>
                            <div className="tag-row">
                                <span className="tag-pill tag-primary"># Communication Style</span>
                                <span className="tag-pill tag-muted"># Clinical Approach</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TherapistDashboard;