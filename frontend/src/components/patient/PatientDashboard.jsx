import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, CheckCircle, Clock, Play, User, Star, Search, 
  Users, LogOut, ArrowRight, Settings, Heart, Sliders, MapPin, 
  Globe, Phone, Video, ShieldAlert
} from 'lucide-react';
import './PatientDashboard.css';
import { getPatientProfile } from '../../services/api'; // Ensure this path points to your api.js

export default function PatientDashboard() {
  // 1. STATE FOR LIVE DATABASE USER DATA
  const [patientUser, setPatientUser] = useState({
    name: 'Loading...',
    email: '',
    location: 'Dhaka, Bangladesh',
    language: 'English, Bengali',
    contact: '+880 1712-345678',
    therapist: 'Dr. Sultan M. Farid'
  });
  
  const [loading, setLoading] = useState(true);
  const [appointmentCancelled, setAppointmentCancelled] = useState(false);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [groupJoinRequested, setGroupJoinRequested] = useState(false);
  
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Take Morning Medication (Sertraline 50mg)", time: "8:00 AM", completed: true },
    { id: 2, text: "Complete 5-Minute Daily Mood Journaling", time: "10:30 AM", completed: true },
    { id: 3, text: "15-Min Guided Mindfulness Breathing Exercise", time: "DUE TODAY", completed: false, hasVideo: true }
  ]);

  // 2. FETCH REAL USER DATA FROM BACKEND
  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        // The interceptor in api.js handles the token, so we just call the function
        const data = await getPatientProfile();
        
        if (data) {
          setPatientUser({
            name: data.name || 'No Name Provided',
            email: data.email,
            location: data.location || 'Dhaka, Bangladesh',
            language: data.language || 'English, Bengali',
            contact: data.contact || '+880 1712-345678',
            therapist: data.assigned_therapist || 'Dr. Sultan M. Farid'
          });
        }
      } catch (error) {
        console.error("Error pulling live patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientProfile();
  }, []);

  const toggleChecklistItem = (id) => {
    setChecklistItems(checklistItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const getInitials = (name) => {
    if (!name || name === 'Loading...') return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
      return <div className="loading-screen">Loading your dashboard...</div>;
  }

  return (
    <div className="portal-container">
      {/* A. TOP NAVIGATION BAR */}
      <nav className="top-navbar">
        <div className="navbar-left">
          <div className="brand-logo">S</div>
          <span className="brand-text">Smart Recovery Portal</span>
          <span className="mode-badge">Patient Mode</span>
        </div>
        <div className="navbar-right">
          <div className="notifications-box">
            <Bell size={18} className="icon-bell" />
            <span className="notification-text">Reminders (1)</span>
          </div>
          <div className="user-profile-tile">
            <div className="avatar-circle-sm">{getInitials(patientUser.name)}</div>
            <span className="profile-name-text">{patientUser.name}</span>
          </div>
        </div>
      </nav>

      {/* B. LEFT SIDEBAR FRAME */}
      <aside className="left-sidebar">
        <div className="sidebar-menu-wrapper">
          <div className="menu-item active"><Heart size={18} /><span>Recovery Hub</span></div>
          <div className="menu-item"><Calendar size={18} /><span>My Appointments</span></div>
          <div className="menu-item"><CheckCircle size={18} /><span>Daily Checklist</span></div>
          <div className="menu-item"><Sliders size={18} /><span>AI Matchmaker</span></div>
          <div className="menu-item"><Search size={18} /><span>Therapist Directory</span></div>
          <div className="menu-item"><Users size={18} /><span>Group Sessions</span></div>
          <div className="menu-item"><Clock size={18} /><span>Vitals & Progress</span></div>
          <div className="menu-item"><Settings size={18} /><span>Profile Settings</span></div>
        </div>
        <button className="sidebar-logout-btn" onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>
          <LogOut size={18} /><span>Logout</span>
        </button>
      </aside>

      {/* MAIN LAYOUT CANVAS */}
      <main className="main-content">
        <div className="dashboard-grid">
          
          <section className="dashboard-card span-12 banner-card">
            <div className="banner-left">
              <h1 className="banner-welcome">Welcome back, {patientUser.name.split(' ')[0]} 👋</h1>
              <p className="banner-subtitle">You're on a 5-day care plan streak! Keep up the great progress.</p>
            </div>
            <div className="banner-right">
              <div className="streak-pill">★ 5-Day Streak</div>
              <div className="reminder-pill">
                <Clock size={14} /><span>Next: Tomorrow 10:00 AM</span>
              </div>
            </div>
          </section>

          <section className="dashboard-card span-7 flex-column gap-16">
            <div className="card-header-row">
              <h2 className="card-title">Active Appointment & Visual Tracker</h2>
              <a href="#calendar" className="card-header-link">Calendar →</a>
            </div>
            
            {!appointmentCancelled ? (
              <div className="appointment-details-box">
                <div className="appointment-meta-left">
                  <div className="therapist-avatar-large">DR</div>
                  <div className="therapist-info">
                    <h3 className="therapist-name">{patientUser.therapist}</h3>
                    <p className="therapist-specialty">Clinical Psychology • Online Video Session</p>
                    <p className="appointment-time-text">Tomorrow, 10:00 AM - 10:50 AM</p>
                  </div>
                </div>
                <div className="appointment-status-right">
                  <span className="status-badge-confirmed">● Confirmed</span>
                  <span className="countdown-badge">Room Opens in 18h</span>
                  <button onClick={() => setAppointmentCancelled(true)} className="cancel-action-link">Cancel Appointment</button>
                </div>
              </div>
            ) : (
              <div className="appointment-details-box alert-danger-box">
                <p className="alert-text">This appointment has been cancelled successfully.</p>
              </div>
            )}

            <div className="feedback-alert-box">
              <div className="feedback-text-content">
                <h4 className="feedback-alert-title"><ShieldAlert size={16} className="inline-icon warning" />Pending Review: Past Session with Dr. Ayesha</h4>
                <p className="feedback-alert-subtitle">Please rate your experience to help our AI Matchmaker guide others.</p>
              </div>
              <div className="feedback-action-row">
                <button className="rate-stars-btn" onClick={() => setShowRatingSuccess(true)} disabled={showRatingSuccess}>
                  {showRatingSuccess ? "✓ Submitted" : "★ Rate 1-5 Stars"}
                </button>
                <span className="feedback-tags-label">+ Add Tags (#Communication, #Approach)</span>
              </div>
            </div>
          </section>

          <section className="dashboard-card span-5 flex-column gap-16">
            <h2 className="card-title">Smart Routing & Discovery Hub</h2>
            <div className="shortcut-card matchmaker-shortcut">
              <div className="shortcut-left">
                <h3 className="shortcut-title text-blue">AI-Powered Therapist Matchmaker</h3>
                <p className="shortcut-desc">Answer vitals questionnaire to get top 3 instant matches</p>
              </div>
              <ArrowRight size={18} className="text-blue" />
            </div>
            <div className="shortcut-card directory-shortcut">
              <div className="shortcut-left">
                <h3 className="shortcut-title text-slate">Manual Therapist Directory</h3>
                <p className="shortcut-desc">Filter by specialty, language, gender & public reviews</p>
              </div>
              <ArrowRight size={18} className="text-slate" />
            </div>
            <div className="shortcut-card group-shortcut">
              <div className="shortcut-left">
                <h3 className="shortcut-title text-green">Group Therapy: "Anxiety Management"</h3>
                <p className="shortcut-desc">Thu 4:00 PM • 3 Spots Left</p>
              </div>
              <button className={`group-join-btn ${groupJoinRequested ? 'requested' : ''}`} onClick={() => setGroupJoinRequested(!groupJoinRequested)}>
                {groupJoinRequested ? "Requested" : "Join Request"}
              </button>
            </div>
          </section>

          <section className="dashboard-card span-7 flex-column">
            <div className="card-header-row margin-bottom-16">
              <h2 className="card-title">Daily Care Plan & Video Checklist</h2>
              <a href="#tasks" className="card-header-link">View All Tasks →</a>
            </div>
            <div className="checklist-wrapper">
              {checklistItems.map((item) => (
                <div key={item.id} className={`checklist-row-container ${item.completed ? 'row-completed' : 'row-active'}`}>
                  <div className="checklist-item-main">
                    <div className="checklist-row-top">
                      <button onClick={() => toggleChecklistItem(item.id)} className="checkbox-toggle-btn">
                        {item.completed ? <CheckCircle size={20} className="icon-checked" /> : <div className="icon-unchecked" />}
                      </button>
                      <span className={`checklist-task-text ${item.completed ? 'line-through' : 'text-bold'}`}>{item.text}</span>
                      {!item.completed && item.time === "DUE TODAY" && <span className="due-today-badge">DUE TODAY</span>}
                    </div>
                    {item.hasVideo && !item.completed && (
                      <div className="video-player-placeholder">
                        <div className="video-play-layer">
                          <div className="red-play-circle"><Play size={20} fill="white" color="white" /></div>
                          <span className="video-main-title">Prescribed Exercise Video</span>
                          <span className="video-sub-caption">Assigned by {patientUser.therapist.split(' ')[0] + ' ' + patientUser.therapist.split(' ')[1]}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="checklist-time-stamp">{item.time}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard-card span-5 flex-column">
            <h2 className="card-title margin-bottom-16">Personal Profile & Preferences</h2>
            <div className="profile-snapshot-tile">
              <div className="avatar-circle-lg">{getInitials(patientUser.name)}</div>
              <div className="profile-snapshot-meta">
                <h3 className="profile-snapshot-name">{patientUser.name}</h3>
                <p className="profile-snapshot-role">Registered Patient Account</p>
              </div>
            </div>
            <div className="profile-data-list">
              <div className="profile-data-row">
                <span className="data-field-label"><MapPin size={14} /> LOCATION:</span>
                <span className="data-field-value">{patientUser.location}</span>
              </div>
              <div className="profile-data-row">
                <span className="data-field-label"><Globe size={14} /> LANGUAGE:</span>
                <span className="data-field-value">{patientUser.language}</span>
              </div>
              <div className="profile-data-row">
                <span className="data-field-label"><Phone size={14} /> CONTACT:</span>
                <span className="data-field-value">{patientUser.contact}</span>
              </div>
              <div className="profile-data-row">
                <span className="data-field-label"><Video size={14} /> THERAPIST:</span>
                <span className="data-field-value color-link-blue">{patientUser.therapist}</span>
              </div>
            </div>
            <button className="edit-profile-action-btn"><Settings size={16} /><span>Edit Profile Info</span></button>
          </section>
        </div>
      </main>
    </div>
  );
}