import React, { useState } from 'react';
import { X, Sparkles, Heart, Brain, Moon, ShieldCheck, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const INTAKE_TRIGGERS = [
  "Sudden overwhelming panic or racing heart",
  "Intrusive negative self-talk or self-doubt",
  "Social withdrawal & isolating from loved ones",
  "Chronic emotional exhaustion & burnout",
  "Relationship tension or fear of abandonment",
  "Unresolved grief, loss, or flashback intrusions"
];

const INTAKE_SOMATIC = [
  "Difficulty falling asleep / racing thoughts at night",
  "Neck, shoulder stiffness or muscle tension",
  "Morning exhaustion & persistent low energy",
  "Appetite swings or stress-induced digestive discomfort"
];

const INTAKE_GOALS = [
  "Learn practical somatic & breathing exercises",
  "Discuss medication & psychiatric evaluations",
  "Unpack root emotional patterns in a safe space",
  "Build structured daily recovery habits & care plan"
];

export default function BookingModal({
  showBookingModal,
  setShowBookingModal,
  selectedTherapistForBooking,
  bookingForm,
  setBookingForm,
  handleBookingDateChange,
  handleConfirmBooking,
  bookingLoading,
  bookingError,
  bookingSuccess,
  bookedSlots,
  TIME_SLOT_OPTIONS,
  slotsLoading,
  getPhotoUrl,
  getInitials
}) {
  if (!showBookingModal) return null;

  const includeBriefing = bookingForm.includeBriefing || false;
  const intakeData = bookingForm.intakeData || {
    triggers: [],
    sleepPhysical: [],
    hiddenThoughts: '',
    sessionGoals: [],
    confidentialNotes: ''
  };

  const handleToggleIncludeBriefing = (enable) => {
    setBookingForm((prev) => ({
      ...prev,
      includeBriefing: enable
    }));
  };

  const handleToggleArrayItem = (field, item) => {
    setBookingForm((prev) => {
      const currentList = prev.intakeData?.[field] || [];
      const exists = currentList.includes(item);
      const updatedList = exists
        ? currentList.filter((i) => i !== item)
        : [...currentList, item];
      return {
        ...prev,
        intakeData: {
          ...prev.intakeData,
          [field]: updatedList
        }
      };
    });
  };

  const handleSetIntakeField = (field, value) => {
    setBookingForm((prev) => ({
      ...prev,
      intakeData: {
        ...prev.intakeData,
        [field]: value
      }
    }));
  };

  return (
    <div className="edit-modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="edit-modal-box booking-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="tasks-modal-header">
          <h2 className="edit-modal-title">Book a Consultation</h2>
          <button className="tasks-modal-close-btn" onClick={() => setShowBookingModal(false)}>
            <X size={20} />
          </button>
        </div>

        {selectedTherapistForBooking && (
          <div className="booking-therapist-header">
            <div className="avatar-circle-lg directory-therapist-avatar">
              {selectedTherapistForBooking.profile_photo_url ? (
                <img src={getPhotoUrl(selectedTherapistForBooking.profile_photo_url)} alt={selectedTherapistForBooking.name} className="avatar-photo" />
              ) : (
                getInitials(selectedTherapistForBooking.name)
              )}
            </div>
            <div>
              <h3 className="directory-therapist-name">{selectedTherapistForBooking.name}</h3>
              <p className="directory-therapist-fee">
                {selectedTherapistForBooking.consultation_fee ? `৳${selectedTherapistForBooking.consultation_fee} / session` : 'Standard Consultation'}
              </p>
            </div>
          </div>
        )}

        {bookingError && <p className="checklist-empty-text checklist-error-text">{bookingError}</p>}
        {bookingSuccess && <p className="alert-text" style={{ color: '#15803d', fontWeight: 700, marginBottom: 12 }}>✓ {bookingSuccess}</p>}

        <form onSubmit={handleConfirmBooking}>
          {/* Step 1: Booking Essentials */}
          <div className="edit-modal-field">
            <label className="edit-modal-label">Select Date</label>
            <input
              type="date"
              className="edit-modal-input"
              min={new Date().toISOString().slice(0, 10)}
              value={bookingForm.date}
              onChange={(e) => handleBookingDateChange(e.target.value)}
              required
            />
          </div>

          <div className="edit-modal-field">
            <label className="edit-modal-label">Select Open Time Slot</label>
            {slotsLoading ? (
              <p className="checklist-empty-text">Loading this therapist's availability...</p>
            ) : TIME_SLOT_OPTIONS.length === 0 ? (
              <p className="checklist-empty-text">
                This therapist has no available slots on the selected date. Try another date.
              </p>
            ) : (
              <div className="time-slot-grid">
                {TIME_SLOT_OPTIONS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isSelected = bookingForm.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isBooked}
                      className={`time-slot-btn ${isSelected ? 'time-slot-selected' : ''} ${isBooked ? 'time-slot-disabled' : ''}`}
                      onClick={() => setBookingForm((prev) => ({ ...prev, timeSlot: slot }))}
                    >
                      {slot} {isBooked ? '(Booked)' : ''}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="edit-modal-field">
            <label className="edit-modal-label">Session Format</label>
            <select
              className="edit-modal-input"
              value={bookingForm.sessionType}
              onChange={(e) => setBookingForm((prev) => ({ ...prev, sessionType: e.target.value }))}
            >
              <option value="online">Online Video Session</option>
              <option value="in-person">In-Person Session</option>
            </select>
          </div>

          {/* Step 2: Pre-Session Briefing Intake Participation Prompt */}
          <div style={{
            marginTop: '20px',
            marginBottom: '20px',
            padding: '16px',
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '1px solid #ddd6fe',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#7c3aed',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: '#4c1d95' }}>
                  Pre-Session Intake Briefing
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6d28d9' }}>
                  Would you like to complete a confidential intake to help your therapist prepare personalized research, exercises & support?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => handleToggleIncludeBriefing(true)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: includeBriefing ? '2px solid #7c3aed' : '1px solid #c4b5fd',
                  background: includeBriefing ? '#7c3aed' : '#ffffff',
                  color: includeBriefing ? '#ffffff' : '#5b21b6',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                ✨ Yes, Complete Intake Briefing
              </button>
              <button
                type="button"
                onClick={() => handleToggleIncludeBriefing(false)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: !includeBriefing ? '2px solid #6b7280' : '1px solid #e5e7eb',
                  background: !includeBriefing ? '#f3f4f6' : '#ffffff',
                  color: !includeBriefing ? '#1f2937' : '#6b7280',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Skip for now
              </button>
            </div>

            {/* Expandable Questionnaire if user selected "Yes" */}
            {includeBriefing && (
              <div style={{
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid #ddd6fe',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                {/* 1. Emotional Triggers & Deep Struggles */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b0764', marginBottom: '6px' }}>
                    <Brain size={14} color="#7c3aed" /> 1. Emotional Challenges & Hidden Triggers
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {INTAKE_TRIGGERS.map((t) => {
                      const checked = (intakeData.triggers || []).includes(t);
                      return (
                        <label key={t} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          background: checked ? '#f3e8ff' : '#ffffff',
                          border: checked ? '1px solid #c084fc' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleArrayItem('triggers', t)}
                          />
                          <span>{t}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Somatic & Sleep Sensations */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b0764', marginBottom: '6px' }}>
                    <Moon size={14} color="#7c3aed" /> 2. Sleep Quality & Physical/Somatic Tension
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {INTAKE_SOMATIC.map((s) => {
                      const checked = (intakeData.sleepPhysical || []).includes(s);
                      return (
                        <label key={s} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          background: checked ? '#f3e8ff' : '#ffffff',
                          border: checked ? '1px solid #c084fc' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleArrayItem('sleepPhysical', s)}
                          />
                          <span>{s}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Deep Thoughts / Hard to say aloud */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b0764', marginBottom: '6px' }}>
                    <Heart size={14} color="#dc2626" /> 3. What feels hardest to say out loud to others?
                  </label>
                  <textarea
                    rows={2}
                    className="edit-modal-input"
                    placeholder="E.g., I feel like I am falling behind everyone else, or I feel constantly anxious in quiet rooms..."
                    value={intakeData.hiddenThoughts || ''}
                    onChange={(e) => handleSetIntakeField('hiddenThoughts', e.target.value)}
                    style={{ fontSize: '12.5px', resize: 'vertical' }}
                  />
                </div>

                {/* 4. Session Goals */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b0764', marginBottom: '6px' }}>
                    <CheckCircle2 size={14} color="#16a34a" /> 4. What would you like to achieve from this session?
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {INTAKE_GOALS.map((g) => {
                      const checked = (intakeData.sessionGoals || []).includes(g);
                      return (
                        <label key={g} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 10px',
                          background: checked ? '#f3e8ff' : '#ffffff',
                          border: checked ? '1px solid #c084fc' : '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleArrayItem('sessionGoals', g)}
                          />
                          <span>{g}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Confidential Note */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: '#3b0764', marginBottom: '6px' }}>
                    <ShieldCheck size={14} color="#7c3aed" /> 5. Confidential Note for Doctor
                  </label>
                  <textarea
                    rows={2}
                    className="edit-modal-input"
                    placeholder="Any private trigger warnings, context, or specific focus you'd like your therapist to review..."
                    value={intakeData.confidentialNotes || ''}
                    onChange={(e) => handleSetIntakeField('confidentialNotes', e.target.value)}
                    style={{ fontSize: '12.5px', resize: 'vertical' }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="edit-modal-actions">
            <button
              type="button"
              className="edit-modal-cancel-btn"
              onClick={() => setShowBookingModal(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="edit-modal-save-btn"
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
