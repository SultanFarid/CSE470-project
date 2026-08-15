import React from 'react';
import { X } from 'lucide-react';

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

  return (
    <div className="edit-modal-overlay" onClick={() => setShowBookingModal(false)}>
      <div className="edit-modal-box booking-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tasks-modal-header">
          <h2 className="edit-modal-title">Book a Session</h2>
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
