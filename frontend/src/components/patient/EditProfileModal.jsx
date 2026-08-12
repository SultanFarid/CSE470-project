import React from 'react';

export default function EditProfileModal({
  isOpen,
  onClose,
  editForm,
  setEditForm,
  photoPreview,
  handlePhotoSelect,
  handleSaveProfile,
  isSaving,
  saveError,
  getPhotoUrl,
  getInitials,
  patientUser
}) {
  if (!isOpen) return null;

  return (
    <div className="edit-modal-overlay" onClick={onClose}>
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
            <input type="file" accept="image/png, image/jpeg, image/jpg, image/webp" onChange={handlePhotoSelect} hidden />
          </label>
        </div>

        <div className="edit-modal-form-group">
          <label className="edit-modal-label">Display Name</label>
          <input
            type="text"
            className="edit-modal-input"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
        </div>

        <div className="edit-modal-form-group">
          <label className="edit-modal-label">Contact Number</label>
          <input
            type="text"
            className="edit-modal-input"
            value={editForm.contact_number}
            onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
          />
        </div>

        <div className="edit-modal-form-group">
          <label className="edit-modal-label">Location</label>
          <input
            type="text"
            className="edit-modal-input"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
        </div>

        <div className="edit-modal-form-group">
          <label className="edit-modal-label">Preferred Language</label>
          <input
            type="text"
            className="edit-modal-input"
            value={editForm.preferred_language}
            onChange={(e) => setEditForm({ ...editForm, preferred_language: e.target.value })}
          />
        </div>

        {saveError && <p className="edit-modal-error">{saveError}</p>}

        <div className="edit-modal-actions">
          <button className="edit-modal-cancel-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button className="edit-modal-save-btn" onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
