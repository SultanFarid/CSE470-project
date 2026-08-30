import React from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';

const todayLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSlotPastToday = (slotStr, selectedDate) => {
  if (!selectedDate || selectedDate !== todayLocal()) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startPart = slotStr.split('-')[0].trim();
  const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && h < 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return (h * 60 + m) <= currentMinutes;
};

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
  bookedSlots = [],
  TIME_SLOT_OPTIONS = [],
  selectedDayAvailability,
  slotsLoading,
  getPhotoUrl,
  getInitials
}) {
  if (!showBookingModal) return null;

  const therapistSessionType = selectedTherapistForBooking?.session_type || 'both';
  const isOnlineSupported = therapistSessionType === 'online' || therapistSessionType === 'both';
  const isInPersonSupported = therapistSessionType === 'in-person' || therapistSessionType === 'both';
  const isSelectedFormatUnsupported =
    (bookingForm.sessionType === 'online' && !isOnlineSupported) ||
    (bookingForm.sessionType === 'in-person' && !isInPersonSupported);

  const activeSlots = TIME_SLOT_OPTIONS.filter((slot) => {
    const isBooked = bookedSlots.includes(slot);
    const isPast = isSlotPastToday(slot, bookingForm.date);
    return !isBooked && !isPast;
  });

  const getEmptyMessage = () => {
    if (isSelectedFormatUnsupported) {
      const needed = isOnlineSupported ? 'Online Video Session' : 'In-Person Session';
      return `This therapist only offers ${isOnlineSupported ? 'online' : 'in-person'} consultations. Please select "${needed}".`;
    }
    if (selectedDayAvailability?.is_blocked) {
      return `This therapist is unavailable on this date (${selectedDayAvailability.blocked_reason || 'Day off / Leave'}). Please choose another date.`;
    }
    if (TIME_SLOT_OPTIONS.length === 0) {
      const dayLabel = selectedDayAvailability?.day_name ? ` on ${selectedDayAvailability.day_name}s` : '';
      return `No available schedule slots for this therapist${dayLabel}. Please choose another date.`;
    }
    const allBooked = TIME_SLOT_OPTIONS.every((s) => bookedSlots.includes(s));
    if (allBooked) {
      return 'All available slots on this date are already booked. Please choose another date.';
    }
    const allPast = TIME_SLOT_OPTIONS.every((s) => isSlotPastToday(s, bookingForm.date));
    if (allPast) {
      return 'All time slots for today have already passed. Please select a future date.';
    }
    return 'No available slots on the selected date. Please choose another date.';
  };

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
                <img
                  src={getPhotoUrl(selectedTherapistForBooking.profile_photo_url)}
                  alt={selectedTherapistForBooking.name}
                  className="avatar-photo"
                />
              ) : (
                getInitials(selectedTherapistForBooking.name)
              )}
            </div>
            <div>
              <h3 className="directory-therapist-name">{selectedTherapistForBooking.name}</h3>
              <p className="directory-therapist-fee">
                {selectedTherapistForBooking.consultation_fee
                  ? `৳${selectedTherapistForBooking.consultation_fee} / session`
                  : 'Standard Consultation'} · Format: {therapistSessionType === 'both' ? 'Online & In-Person' : therapistSessionType === 'online' ? 'Online Video' : 'In-Person'}
              </p>
            </div>
          </div>
        )}

        {bookingError && <p className="checklist-empty-text checklist-error-text">{bookingError}</p>}
        {bookingSuccess && (
          <p className="alert-text" style={{ color: '#15803d', fontWeight: 700, marginBottom: 12 }}>
            ✓ {bookingSuccess}
          </p>
        )}

        <form onSubmit={handleConfirmBooking}>
          <div className="edit-modal-field">
            <label className="edit-modal-label">
              <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Select Date
            </label>
            <input
              type="date"
              className="edit-modal-input"
              min={todayLocal()}
              value={bookingForm.date}
              onChange={(e) => handleBookingDateChange(e.target.value)}
              required
            />
          </div>

          <div className="edit-modal-field">
            <label className="edit-modal-label">
              <Clock size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              Select Open Time Slot
            </label>
            {slotsLoading ? (
              <p className="checklist-empty-text">Loading this therapist's availability...</p>
            ) : activeSlots.length === 0 ? (
              <div className="checklist-empty-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <span>{getEmptyMessage()}</span>
              </div>
            ) : (
              <div className="time-slot-grid">
                {TIME_SLOT_OPTIONS.map((slot) => {
                  const isBooked = bookedSlots.includes(slot);
                  const isPast = isSlotPastToday(slot, bookingForm.date);
                  const isUnavailable = isBooked || isPast;
                  const isSelected = bookingForm.timeSlot === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isUnavailable}
                      className={`time-slot-btn ${isSelected ? 'time-slot-selected' : ''} ${isUnavailable ? 'time-slot-disabled' : ''}`}
                      onClick={() => setBookingForm((prev) => ({ ...prev, timeSlot: slot }))}
                      title={isBooked ? 'Slot already booked' : isPast ? 'Time has passed' : 'Click to select slot'}
                    >
                      {slot} {isBooked ? '(Booked)' : isPast ? '(Passed)' : ''}
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
              {isOnlineSupported && <option value="online">Online Video Session</option>}
              {isInPersonSupported && <option value="in-person">In-Person Session</option>}
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
              disabled={bookingLoading || activeSlots.length === 0 || isSelectedFormatUnsupported}
            >
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
