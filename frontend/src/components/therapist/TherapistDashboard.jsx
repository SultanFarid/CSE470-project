import React, { useState } from 'react';
import { updateTherapistProfile } from '../../services/api';
import '../auth/Login.css';

const TherapistDashboard = () => {
    // In a full implementation, you would fetch these initial values from the DB on load.
    // We are defaulting them to empty/dummy values for this layout iteration.
    const [profile, setProfile] = useState({
        user_id: 1, // Hardcoded for testing. Eventually comes from Login state/localStorage
        profile_photo_url: '',
        biography: '',
        specialties: '',
        languages: '',
        consultation_fee: '',
        session_type: 'both'
    });
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const res = await updateTherapistProfile(profile);
            setMessage({ text: res.message, type: 'success' });
        } catch (err) {
            setMessage({ text: 'Failed to update profile.', type: 'error' });
        }
    };

    return (
        <div style={{ padding: '40px', backgroundColor: '#f0f4f8', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <div className="login-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 className="login-title">Therapist Dashboard: Edit Profile</h2>
                
                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Profile Photo URL</label>
                        <input type="text" className="login-input" value={profile.profile_photo_url} onChange={(e) => setProfile({...profile, profile_photo_url: e.target.value})} />
                    </div>
                    
                    <div className="input-group" style={{ gridColumn: 'span 2' }}>
                        <label>Biography</label>
                        <textarea className="login-input" rows="4" value={profile.biography} onChange={(e) => setProfile({...profile, biography: e.target.value})} />
                    </div>

                    <div className="input-group">
                        <label>Specialties (e.g., CBT, Anxiety)</label>
                        <input type="text" className="login-input" value={profile.specialties} onChange={(e) => setProfile({...profile, specialties: e.target.value})} />
                    </div>

                    <div className="input-group">
                        <label>Languages Spoken</label>
                        <input type="text" className="login-input" value={profile.languages} onChange={(e) => setProfile({...profile, languages: e.target.value})} />
                    </div>

                    <div className="input-group">
                        <label>Consultation Fee (BDT)</label>
                        <input type="number" className="login-input" value={profile.consultation_fee} onChange={(e) => setProfile({...profile, consultation_fee: e.target.value})} />
                    </div>

                    <div className="input-group">
                        <label>Session Type</label>
                        <select className="login-input" value={profile.session_type} onChange={(e) => setProfile({...profile, session_type: e.target.value})}>
                            <option value="both">Both (Online & In-Person)</option>
                            <option value="online">Online Only</option>
                            <option value="in-person">In-Person Only</option>
                        </select>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                        <button type="submit" className="login-button" style={{ width: '100%' }}>Save Profile Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TherapistDashboard;