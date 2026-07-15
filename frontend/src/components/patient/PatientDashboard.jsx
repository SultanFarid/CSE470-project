import React, { useState, useEffect } from 'react';
import { 
  Bell, Calendar, CheckCircle, Clock, Play, User, Star, Search, 
  Users, LogOut, ArrowRight, Settings, Heart, Sliders, MapPin, 
  Globe, Phone, Video, ShieldAlert
} from 'lucide-react';
import './PatientDashboard.css';
import { getPatientProfile, updatePatientProfile, uploadPatientPhoto, SERVER_BASE_URL } from '../../services/api'; // Ensure this path points to your api.js

export default function PatientDashboard() {
  
  const [patientUser, setPatientUser] = useState({
    name: 'Loading...',
    email: '',
    location: 'Dhaka, Bangladesh',
    language: 'English, Bengali',
    contact: '+880 1712-345678',
    therapist: 'Dr. Sultan M. Farid',
    profile_photo_url: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [appointmentCancelled, setAppointmentCancelled] = useState(false);
  const [showRatingSuccess, setShowRatingSuccess] = useState(false);
  const [groupJoinRequested, setGroupJoinRequested] = useState(false);

  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    contact_number: '',
    location: '',
    preferred_language: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, text: "Take Morning Medication (Sertraline 50mg)", time: "8:00 AM", completed: true },
    { id: 2, text: "Complete 5-Minute Daily Mood Journaling", time: "10:30 AM", completed: true },
    { id: 3, text: "15-Min Guided Mindfulness Breathing Exercise", time: "DUE TODAY", completed: false, hasVideo: true }
  ]);

  
  useEffect(() => {
    const fetchPatientProfile = async () => {
      try {
        setLoading(true);
        
        const data = await getPatientProfile();
        
        if (data) {
          setPatientUser({
            name: data.name || 'No Name Provided',
            email: data.email,
            location: data.location || 'Dhaka, Bangladesh',
            language: data.preferred_language || 'English, Bengali',
            contact: data.contact_number || '+880 1712-345678',
            therapist: data.assigned_therapist || 'Dr. Sultan M. Farid',
            profile_photo_url: data.profile_photo_url || ''
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

  
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    return `${SERVER_BASE_URL}${photoPath}`;
  };

  
  const openEditModal = () => {
    setEditForm({
      name: patientUser.name,
      contact_number: patientUser.contact,
      location: patientUser.location,
      preferred_language: patientUser.language
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setSaveError('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setSaveError('');
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      
      let photoUrl = patientUser.profile_photo_url;
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const uploadResult = await uploadPatientPhoto(formData);
        photoUrl = uploadResult.url;
      }

      await updatePatientProfile({
        name: editForm.name,
        contact_number: editForm.contact_number,
        location: editForm.location,
        preferred_language: editForm.preferred_language,
        profile_photo_url: photoUrl
      });

      
      setPatientUser((prev) => ({
        ...prev,
        name: editForm.name,
        contact: editForm.contact_number,
        location: editForm.location,
        language: editForm.preferred_language,
        profile_photo_url: photoUrl
      }));

      setIsEditModalOpen(false);
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (error) {
      console.error("Error saving profile:", error);
      setSaveError(error.response?.data?.message || "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
            <div className="avatar-circle-sm">
              {patientUser.profile_photo_url ? (
                <img src={getPhotoUrl(patientUser.profile_photo_url)} alt="Profile" className="avatar-photo" />
              ) : (
                getInitials(patientUser.name)
              )}
            </div>
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
              <div className="avatar-circle-lg">
                {patientUser.profile_photo_url ? (
                  <img src={getPhotoUrl(patientUser.profile_photo_url)} alt="Profile" className="avatar-photo" />
                ) : (
                  getInitials(patientUser.name)
                )}
              </div>
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
            <button className="edit-profile-action-btn" onClick={openEditModal}>
              <Settings size={16} /><span>Edit Profile Info</span>
            </button>
          </section>
        </div>
      </main>

      {/* EDIT PROFILE MODAL */}
      {isEditModalOpen && (
        <div className="edit-modal-overlay" onClick={closeEditModal}>
          <div className="edit-modal-box" onClick={(e) => e.stopPropagation()}>
            <h2 className="edit-modal-title">Edit Profile Info</h2>

            <div className="edit-modal-photo-row">
              <div className="avatar-circle-lg edit-modal-avatar">
                {photoPreview || patientUser.profile_photo_url ? (
                  <img
                    src={photoPreview || getPhotoUrl(patientUser.profile_photo_url)}
                    alt="Profile preview"
                    className="avatar-photo"
                  />
                ) : (
                  getInitials(patientUser.name)
                )}
              </div>
              <label className="edit-modal-photo-upload-btn">
                Change Photo
                <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handlePhotoFileChange} hidden />
              </label>
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">Display Name</label>
              <input
                type="text"
                name="name"
                className="edit-modal-input"
                value={editForm.name}
                onChange={handleEditFormChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">Contact Number</label>
              <input
                type="text"
                name="contact_number"
                className="edit-modal-input"
                value={editForm.contact_number}
                onChange={handleEditFormChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">Location</label>
              <input
                type="text"
                name="location"
                className="edit-modal-input"
                value={editForm.location}
                onChange={handleEditFormChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label className="edit-modal-label">Preferred Language</label>
              <input
                type="text"
                name="preferred_language"
                className="edit-modal-input"
                value={editForm.preferred_language}
                onChange={handleEditFormChange}
              />
            </div>

            {saveError && <p className="edit-modal-error">{saveError}</p>}

            <div className="edit-modal-actions">
              <button className="edit-modal-cancel-btn" onClick={closeEditModal} disabled={isSaving}>Cancel</button>
              <button className="edit-modal-save-btn" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}