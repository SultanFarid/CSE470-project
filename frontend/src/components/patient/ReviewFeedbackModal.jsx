import React, { useState } from 'react';
import { X, Star, CheckCircle, ShieldCheck } from 'lucide-react';

export const REVIEW_CATEGORIES = [
  {
    category: 'Communication Style',
    icon: '🗣️',
    tags: ['Listens carefully', 'Explains clearly', 'Easy to talk to']
  },
  {
    category: 'Personality',
    icon: '💖',
    tags: ['Calm', 'Non-judgmental', 'Warm and supportive']
  },
  {
    category: 'Clinical Approach',
    icon: '🔬',
    tags: ['Good at treatment', 'Structured sessions', 'Focus on practical steps']
  },
  {
    category: 'Session Experience',
    icon: '⏰',
    tags: ['On time', 'Comfortable pace', 'Felt understood']
  }
];

export default function ReviewFeedbackModal({
  showReviewModal,
  setShowReviewModal,
  therapist,
  appointmentId,
  onReviewSubmitted,
  getInitials
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Warm and supportive', 'Listens carefully']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!showReviewModal) return null;

  const therapistName = therapist?.name || therapist?.therapist_name || 'Dr. Sultan M. Farid';
  const therapistSpecialties = therapist?.specialties || therapist?.therapist_specialties || 'Clinical Psychology';

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setErrorMessage('Please choose a rating between 1 and 5 stars.');
      return;
    }
    if (selectedTags.length === 0) {
      setErrorMessage('Please select at least 1 keyword tag to help our AI Matchmaker.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage('');
      
      const payload = {
        appointment_id: appointmentId || 1,
        therapist_id: therapist?.id || therapist?.therapist_id || 2,
        rating: rating,
        tags: selectedTags
      };

      if (onReviewSubmitted) {
        await onReviewSubmitted(payload);
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowReviewModal(false);
      }, 1500);
    } catch (err) {
      console.error("Error submitting review:", err);
      setErrorMessage(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-modal-overlay" onClick={() => setShowReviewModal(false)}>
      <div className="edit-modal-box review-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="tasks-modal-header">
          <div>
            <h2 className="edit-modal-title">Rate & Review Your Session</h2>
            <p className="vitals-step-subtitle">Your structured feedback feeds weighted signals into our AI Matchmaker.</p>
          </div>
          <button className="tasks-modal-close-btn" onClick={() => setShowReviewModal(false)}>
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#15803d', marginBottom: '8px' }}>
              Feedback Submitted Successfully!
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Thank you for rating {therapistName}. Your signals have updated our AI recommendation database.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Therapist Info Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div className="therapist-avatar-large" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                {getInitials ? getInitials(therapistName) : 'DR'}
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>{therapistName}</h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>{therapistSpecialties} · Recent Session</p>
              </div>
            </div>

            {/* 1. Star Rating Section */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                1. Overall Session Rating <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        transition: 'transform 0.15s ease',
                        transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      <Star
                        size={28}
                        fill={isFilled ? '#f59e0b' : 'none'}
                        color={isFilled ? '#f59e0b' : '#cbd5e1'}
                        strokeWidth={1.5}
                      />
                    </button>
                  );
                })}
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#92400e', marginLeft: '10px' }}>
                  {rating === 5 ? '5.0 - Excellent' : rating === 4 ? '4.0 - Very Good' : rating === 3 ? '3.0 - Good' : rating === 2 ? '2.0 - Fair' : '1.0 - Poor'}
                </span>
              </div>
            </div>

            {/* 2. Categorized Tag Selection Panel */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  2. Select Descriptive Feedback Tags <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                  {selectedTags.length} selected
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Choose keywords that best capture your session experience. These act as weighted signals for Feature 3 AI matchmaking.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {REVIEW_CATEGORIES.map((catGroup) => (
                  <div key={catGroup.category} style={{ background: '#fdfdfd', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{catGroup.icon}</span>
                      <span>{catGroup.category}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {catGroup.tags.map((tag) => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              border: isSelected ? '1px solid #0284c7' : '1px solid #cbd5e1',
                              background: isSelected ? '#eff6ff' : '#ffffff',
                              color: isSelected ? '#0284c7' : '#475569',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            {isSelected ? '✓ ' : '+ '}{tag}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div style={{ padding: '10px 14px', borderRadius: '6px', background: '#fee2e2', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="edit-modal-actions">
              <button
                type="button"
                className="edit-modal-cancel-btn"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="edit-modal-save-btn"
                disabled={isSubmitting}
                style={{ background: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ShieldCheck size={16} />
                {isSubmitting ? 'Submitting...' : 'Submit Review & Tags'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
