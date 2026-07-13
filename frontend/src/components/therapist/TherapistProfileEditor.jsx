import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTherapistProfile, updateTherapistProfile, uploadProfilePhoto, SERVER_BASE_URL } from '../../services/api';
import './TherapistProfileEditor.css';

const SESSION_TYPES = [
    { value: 'both', label: 'Both (Online & In-Person)' },
    { value: 'online', label: 'Online Only' },
    { value: 'in-person', label: 'In-Person Only' }
];

const TherapistProfileEditor = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState({
        profile_photo_url: '',
        biography: '',
        specialties: '',
        languages: '',
        consultation_fee: '',
        session_type: 'both'
    });
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (!storedUser || storedUser.role !== 'therapist') {
            navigate('/login');
            return;
        }
        setUser(storedUser);

        const loadProfile = async () => {
            try {
                const data = await getTherapistProfile(storedUser.id);
                setProfile({
                    profile_photo_url: data.profile_photo_url || '',
                    biography: data.biography || '',
                    specialties: data.specialties || '',
                    languages: data.languages || '',
                    consultation_fee: data.consultation_fee || '',
                    session_type: data.session_type || 'both'
                });
            } catch (err) {
                setMessage({ text: 'Could not load existing profile. You can still fill it out below.', type: 'error' });
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [navigate]);

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('photo', file);

        setUploading(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await uploadProfilePhoto(formData);
            setProfile((prev) => ({ ...prev, profile_photo_url: res.url }));
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Photo upload failed.', type: 'error' });
        } finally {
            setUploading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });
        try {
            const res = await updateTherapistProfile({ user_id: user.id, ...profile });
            setMessage({ text: res.message, type: 'success' });
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Failed to update profile.', type: 'error' });
        }
    };

    if (loading) {
        return <div className="dashboard-wrapper"><p>Loading profile...</p></div>;
    }

    return (
        <div className="dashboard-wrapper">
            <div className="profile-card">
                <h2 className="dashboard-title">Edit My Public Profile</h2>
                <p className="dashboard-subtitle">Changes here update instantly on the Therapist Directory patients see.</p>

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                <form onSubmit={handleUpdate} className="profile-form">
                    <div className="form-group form-group-full">
                        <label>Profile Photo</label>
                        <div className="photo-upload-row">
                            {profile.profile_photo_url && (
                                <img
                                    src={`${SERVER_BASE_URL}${profile.profile_photo_url}`}
                                    alt="Profile preview"
                                    className="photo-preview"
                                />
                            )}
                            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handlePhotoChange} />
                        </div>
                        {uploading && <span className="upload-status">Uploading...</span>}
                    </div>

                    <div className="form-group form-group-full">
                        <label>Biography</label>
                        <textarea
                            className="form-textarea"
                            rows="4"
                            value={profile.biography}
                            onChange={(e) => setProfile({ ...profile, biography: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Specialties (e.g., CBT, Anxiety)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={profile.specialties}
                            onChange={(e) => setProfile({ ...profile, specialties: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Languages Spoken</label>
                        <input
                            type="text"
                            className="form-input"
                            value={profile.languages}
                            onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Consultation Fee (BDT)</label>
                        <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={profile.consultation_fee}
                            onChange={(e) => setProfile({ ...profile, consultation_fee: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Session Type</label>
                        <select
                            className="form-select"
                            value={profile.session_type}
                            onChange={(e) => setProfile({ ...profile, session_type: e.target.value })}
                        >
                            {SESSION_TYPES.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group form-group-full">
                        <button type="submit" className="save-button" disabled={uploading}>
                            Save Profile Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TherapistProfileEditor;