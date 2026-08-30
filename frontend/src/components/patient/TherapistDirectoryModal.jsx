import React from 'react';
import { X, Search, RotateCcw, Calendar, AlertCircle } from 'lucide-react';

export default function TherapistDirectoryModal({
  showDirectoryModal,
  closeDirectoryModal,
  directorySearch,
  setDirectorySearch,
  directorySpecialtyFilter,
  setDirectorySpecialtyFilter,
  directorySpecialtyOptions,
  directoryFormatFilter,
  setDirectoryFormatFilter,
  directoryFormatOptions,
  directoryLoading,
  directoryError,
  handleClearFilters,
  handleRetryDirectory,
  filteredDirectoryTherapists,
  totalTherapistsCount = 0,
  getPhotoUrl,
  getInitials,
  openBookingModal
}) {
  if (!showDirectoryModal) return null;

  const hasActiveFilters =
    (directorySearch && directorySearch.trim() !== '') ||
    (directorySpecialtyFilter && directorySpecialtyFilter !== 'All') ||
    (directoryFormatFilter && directoryFormatFilter !== 'All');

  // Build descriptive live summary text
  let summaryText = `${filteredDirectoryTherapists.length} therapist${filteredDirectoryTherapists.length === 1 ? '' : 's'} found`;
  if (hasActiveFilters) {
    const parts = [];
    if (directorySearch && directorySearch.trim() !== '') {
      parts.push(`matching "${directorySearch.trim()}"`);
    }
    if (directorySpecialtyFilter && directorySpecialtyFilter !== 'All') {
      parts.push(directorySpecialtyFilter);
    }
    if (directoryFormatFilter && directoryFormatFilter !== 'All') {
      parts.push(directoryFormatFilter);
    }
    summaryText = `${filteredDirectoryTherapists.length} therapist${filteredDirectoryTherapists.length === 1 ? '' : 's'} · ${parts.join(' · ')}`;
  }

  return (
    <div className="edit-modal-overlay" onClick={closeDirectoryModal}>
      <div
        className="edit-modal-box tasks-modal-box directory-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="tasks-modal-header directory-modal-header">
          <div>
            <h2 className="edit-modal-title">Therapist Directory</h2>
            <p className="vitals-step-subtitle">Find a verified therapist that matches your needs.</p>
          </div>
          <button
            className="tasks-modal-close-btn"
            onClick={closeDirectoryModal}
            aria-label="Close directory"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="directory-filter-bar">
          <div className="directory-search-box">
            <Search size={16} className="directory-search-icon" />
            <input
              type="text"
              className="directory-search-input"
              placeholder="Search by name, specialty, or language..."
              value={directorySearch}
              onChange={(e) => setDirectorySearch(e.target.value)}
            />
          </div>

          <div className="directory-dropdowns-group">
            <select
              className="directory-filter-select"
              value={directorySpecialtyFilter}
              onChange={(e) => setDirectorySpecialtyFilter(e.target.value)}
            >
              {directorySpecialtyOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'All Specialties' : opt}
                </option>
              ))}
            </select>

            <select
              className="directory-filter-select"
              value={directoryFormatFilter}
              onChange={(e) => setDirectoryFormatFilter(e.target.value)}
            >
              {directoryFormatOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'All' ? 'All Formats' : opt}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                className="directory-clear-filters-btn"
                onClick={handleClearFilters}
                title="Reset all filters"
              >
                <RotateCcw size={13} />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Live Summary */}
        {!directoryLoading && !directoryError && (
          <div className="directory-results-summary">
            <span className="directory-results-count">{summaryText}</span>
          </div>
        )}

        {/* Scrollable Results Area */}
        <div className="directory-results-list">
          {directoryLoading ? (
            <div className="directory-loading-state">
              <div className="directory-spinner" />
              <p>Loading therapists...</p>
            </div>
          ) : directoryError ? (
            <div className="directory-error-state">
              <AlertCircle size={28} className="directory-error-icon" />
              <p>{directoryError}</p>
              {handleRetryDirectory && (
                <button className="directory-retry-btn" onClick={handleRetryDirectory}>
                  Retry
                </button>
              )}
            </div>
          ) : filteredDirectoryTherapists.length === 0 ? (
            <div className="directory-empty-state">
              <p className="directory-empty-title">No therapists found</p>
              <p className="directory-empty-subtitle">
                {hasActiveFilters
                  ? 'Try changing your search or filters to see more results.'
                  : 'No therapists are currently available.'}
              </p>
              {hasActiveFilters && (
                <button
                  className="directory-clear-filters-btn empty-clear-btn"
                  onClick={handleClearFilters}
                >
                  <RotateCcw size={13} />
                  <span>Clear Filters</span>
                </button>
              )}
            </div>
          ) : (
            filteredDirectoryTherapists.map((t) => {
              const formatLabel =
                t.session_type === 'both' ||
                (t.formats && t.formats.includes('Online Video') && t.formats.includes('In-Person'))
                  ? 'Online & In-Person'
                  : t.session_type === 'online' ||
                    (t.formats && t.formats.includes('Online Video') && !t.formats.includes('In-Person'))
                  ? 'Online Video'
                  : 'In-Person';

              const feeLabel =
                t.consultation_fee && Number(t.consultation_fee) > 0
                  ? `৳${Number(t.consultation_fee).toLocaleString()} / session`
                  : 'Fee not specified';

              return (
                <div key={t.id} className="directory-card-horizontal">
                  {/* Left Avatar */}
                  <div className="directory-card-avatar-wrap">
                    {t.profile_photo_url ? (
                      <img
                        src={getPhotoUrl(t.profile_photo_url)}
                        alt={t.name}
                        className="avatar-photo directory-card-avatar"
                      />
                    ) : (
                      <div className="avatar-circle-lg directory-card-avatar-initials">
                        {getInitials(t.name)}
                      </div>
                    )}
                  </div>

                  {/* Middle Info Column */}
                  <div className="directory-card-content">
                    <div className="directory-card-top-row">
                      <h3 className="directory-card-name">{t.name}</h3>
                      <span className="directory-card-fee">{feeLabel}</span>
                    </div>

                    {t.biography && t.biography !== 'Not specified' && (
                      <p className="directory-card-bio">{t.biography}</p>
                    )}

                    {/* Specialties Tags */}
                    {Array.isArray(t.specialties) && t.specialties.length > 0 && (
                      <div className="directory-card-tags">
                        {t.specialties.map((s) => (
                          <span key={s} className="directory-tag-specialty">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Languages & Formats */}
                    <div className="directory-card-meta-row">
                      <span className="directory-meta-item">
                        <strong>Languages:</strong>{' '}
                        {Array.isArray(t.languages) && t.languages.length > 0
                          ? t.languages.join(', ')
                          : 'Not specified'}
                      </span>
                      <span className="directory-meta-dot">·</span>
                      <span className="directory-meta-item">
                        <strong>Format:</strong> {formatLabel}
                      </span>
                    </div>

                    {/* Real Next Available Preview Badge */}
                    <div className="directory-card-avail-badge">
                      <Calendar size={13} className="directory-avail-icon" />
                      <span>
                        Next Available:{' '}
                        <strong>{t.next_available_slot || 'Check availability'}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Right Action Column */}
                  <div className="directory-card-action">
                    <button
                      className="directory-request-btn"
                      onClick={() => openBookingModal(t)}
                    >
                      Request Session
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
