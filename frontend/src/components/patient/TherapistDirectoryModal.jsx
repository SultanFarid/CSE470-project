import React from 'react';
import { X } from 'lucide-react';

export default function TherapistDirectoryModal({
  showDirectoryModal,
  closeDirectoryModal,
  directorySearch,
  setDirectorySearch,
  directorySpecialtyFilter,
  setDirectorySpecialtyFilter,
  directorySpecialtyOptions,
  directoryLanguageFilter,
  setDirectoryLanguageFilter,
  directoryLanguageOptions,
  directoryFormatFilter,
  setDirectoryFormatFilter,
  directoryFormatOptions,
  directoryLoading,
  directoryError,
  filteredDirectoryTherapists,
  getPhotoUrl,
  getInitials,
  openBookingModal
}) {
  if (!showDirectoryModal) return null;

  return (
    <div className="edit-modal-overlay" onClick={closeDirectoryModal}>
      <div className="edit-modal-box tasks-modal-box directory-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="tasks-modal-header">
          <h2 className="edit-modal-title">Therapist Directory</h2>
          <button className="tasks-modal-close-btn" onClick={closeDirectoryModal}>
            <X size={20} />
          </button>
        </div>

        <input
          type="text"
          className="edit-modal-input directory-search-input"
          placeholder="Search by name or specialty..."
          value={directorySearch}
          onChange={(e) => setDirectorySearch(e.target.value)}
        />

        <div className="directory-filter-row">
          <select className="directory-filter-select" value={directorySpecialtyFilter} onChange={(e) => setDirectorySpecialtyFilter(e.target.value)}>
            {directorySpecialtyOptions.map((opt) => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Specialties' : opt}</option>
            ))}
          </select>
          <select className="directory-filter-select" value={directoryLanguageFilter} onChange={(e) => setDirectoryLanguageFilter(e.target.value)}>
            {directoryLanguageOptions.map((opt) => (
              <option key={opt} value={opt}>{opt === 'All' ? 'All Languages' : opt}</option>
            ))}
          </select>
          <select className="directory-filter-select" value={directoryFormatFilter} onChange={(e) => setDirectoryFormatFilter(e.target.value)}>
            {directoryFormatOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'Any Format' : opt === 'online' ? 'Online Video' : opt === 'in-person' ? 'In-Person' : 'Both'}
              </option>
            ))}
          </select>
        </div>

        <div className="directory-results-list">
          {directoryLoading ? (
            <p className="checklist-empty-text">Loading therapists...</p>
          ) : directoryError ? (
            <p className="checklist-empty-text checklist-error-text">{directoryError}</p>
          ) : filteredDirectoryTherapists.length === 0 ? (
            <p className="checklist-empty-text">No therapists match your filters yet.</p>
          ) : (
            filteredDirectoryTherapists.map((t) => (
              <div key={t.id} className="directory-therapist-card">
                <div className="directory-therapist-header">
                  <div className="avatar-circle-lg directory-therapist-avatar">
                    {t.profile_photo_url ? (
                      <img src={getPhotoUrl(t.profile_photo_url)} alt={t.name} className="avatar-photo" />
                    ) : (
                      getInitials(t.name)
                    )}
                  </div>
                  <div>
                    <h3 className="directory-therapist-name">{t.name}</h3>
                    <p className="directory-therapist-fee">
                      {t.consultation_fee > 0 ? `৳${t.consultation_fee} / session` : 'Fee not listed'} · {t.session_type === 'both' ? 'Online & In-Person' : t.session_type === 'online' ? 'Online Video' : 'In-Person'}
                    </p>
                  </div>
                </div>
                {t.biography && <p className="directory-therapist-bio">{t.biography}</p>}
                <div className="vitals-match-tags">
                  {t.specialties.map((s) => <span key={s} className="vitals-match-tag">{s}</span>)}
                  {t.languages.map((l) => <span key={l} className="vitals-match-tag directory-language-tag">{l}</span>)}
                </div>
                <button className="vitals-request-btn" onClick={() => openBookingModal(t)}>
                  Request Session
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
