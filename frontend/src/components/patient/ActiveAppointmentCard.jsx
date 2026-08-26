import React from 'react';
import { ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function ActiveAppointmentCard({
  appointments,
  appointmentsLoading,
  patientUser,
  getPhotoUrl,
  getInitials,
  handleCancelAppointment,
  openDirectoryModal,
  cancelNotification,
  openReviewModal,
  pendingReview,
  reviewSubmitted,
  lastReviewedTherapist
}) {
  // Filter out any cancelled appointments so only active ones show
  const activeAppointments = (appointments || []).filter((a) => a.status !== 'cancelled');
  const currentApp = activeAppointments.length > 0 ? activeAppointments[0] : null;

  return (
    <section className="dashboard-card span-7 flex-column gap-16">
      <div className="card-header-row">
        <h2 className="card-title">Active Appointment & Visual Tracker</h2>
        <span
          className="card-header-link"
          onClick={openDirectoryModal}
          style={{ cursor: 'pointer' }}
        >
          Calendar →
        </span>
      </div>

      {cancelNotification && (
        <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#fee2e2', color: '#991b1b', fontSize: '13px', fontWeight: 600 }}>
          ✓ {cancelNotification}
        </div>
      )}

      {appointmentsLoading ? (
        <div className="appointment-details-box">
          <p className="checklist-empty-text">Loading appointments...</p>
        </div>
      ) : currentApp ? (
        <div className="appointment-details-box">
          <div className="appointment-meta-left">
            <div className="therapist-avatar-large">DR</div>
            <div className="therapist-info">
              <h3 className="therapist-name">{currentApp.therapist_name || patientUser.therapist || 'Your Therapist'}</h3>
              <p className="therapist-specialty">
                {currentApp.therapist_specialties ? `${currentApp.therapist_specialties} · ` : ''}{currentApp.session_type === 'in-person' ? 'In-Person Session' : 'Online Video Session'}
              </p>
              <p className="appointment-time-text">
                {new Date(currentApp.appointment_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {currentApp.time_slot}
              </p>
            </div>
          </div>
          <div className="appointment-status-right">
            {currentApp.status === 'pending' && <span className="status-badge-pending">● Pending</span>}
            {currentApp.status === 'confirmed' && <span className="status-badge-confirmed">● Confirmed</span>}
            {currentApp.status === 'completed' && <span className="status-badge-completed">● Completed</span>}
            <span className="countdown-badge">Room Opens Soon</span>
            <button
              onClick={() => handleCancelAppointment(currentApp.id)}
              className="cancel-action-link"
            >
              Cancel Appointment
            </button>
          </div>
        </div>
      ) : (
        <div className="appointment-details-box">
          <div className="appointment-meta-left">
            <div className="therapist-info">
              <h3 className="therapist-name">No Active Appointments</h3>
              <p className="therapist-specialty">Use our AI Matchmaker or Therapist Directory to book a session.</p>
            </div>
          </div>
          <div className="appointment-status-right">
            <button onClick={openDirectoryModal} className="edit-modal-save-btn" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Find a Therapist
            </button>
          </div>
        </div>
      )}

      {/* Feature 7: Post-Session Review & Feedback Banner — only appears when
          there's a real completed session waiting on a review. Brand-new
          accounts with no session history correctly show nothing here. */}
      {pendingReview ? (
        <div className="feedback-alert-box">
          <div className="feedback-text-content">
            <h4 className="feedback-alert-title">
              <ShieldAlert size={16} className="inline-icon warning" />
              Pending Review: Past Session with {pendingReview.therapist_name}
            </h4>
            <p className="feedback-alert-subtitle">Please rate your experience to help our AI Matchmaker guide others.</p>
          </div>
          <div className="feedback-action-row">
            <button
              className="rate-stars-btn"
              onClick={() => openReviewModal && openReviewModal({
                id: pendingReview.appointment_id,
                therapist_id: pendingReview.therapist_id,
                therapist_name: pendingReview.therapist_name,
                therapist_specialties: pendingReview.therapist_specialties
              })}
            >
              ★ Rate 1-5 Stars
            </button>
            <span
              className="feedback-tags-label"
              onClick={() => openReviewModal && openReviewModal({
                id: pendingReview.appointment_id,
                therapist_id: pendingReview.therapist_id,
                therapist_name: pendingReview.therapist_name,
                therapist_specialties: pendingReview.therapist_specialties
              })}
              style={{ cursor: 'pointer' }}
            >
              + Add Tags (#Communication, #Approach)
            </span>
          </div>
        </div>
      ) : reviewSubmitted ? (
        <div className="feedback-alert-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <div className="feedback-text-content">
            <h4 className="feedback-alert-title" style={{ color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} color="#16a34a" /> Review Submitted{lastReviewedTherapist?.name ? ` for ${lastReviewedTherapist.name}` : ''}
            </h4>
            <p className="feedback-alert-subtitle" style={{ color: '#166534', margin: 0, fontSize: '12px' }}>
              Thank you! Your ratings and structured tags have updated our AI Matchmaker weighted signals.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
