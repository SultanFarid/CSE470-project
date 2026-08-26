import React, { useState, useEffect } from 'react';
import { applyForJob, getApplicationSettings } from '../../services/api';
import { getSystemTime } from '../../utils/systemTime';
import './JobForm.css';

const TherapistJobForm = () => {
    const [isExpired, setIsExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deadlineLabel, setDeadlineLabel] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });

    // Massive Form State
    const [formData, setFormData] = useState({
        name: '', email: '', address: '', phone: '', national_id: '', emergency_contact: '',
        position_applied: '', employment_type: 'Full-time', shift_availability: '', start_date: '', desired_salary: '',
        primary_license: '', npi: '', basic_certs: '', specialty_certs: '',
        education_history: '', emr_experience: '', languages: '', therapeutic_modalities: '',
        malpractice_history: 'None', license_suspension: false, criminal_record: false, oig_exclusion: false,
        immunization_proof: false, physical_capability: false, truthfulness_attestation: false,
    });

    // Check Deadline on Load — uses dev time override if active
    useEffect(() => {
        const checkDeadline = async () => {
            try {
                const { deadline, isOpen } = await getApplicationSettings();
                if (!isOpen) {
                    setIsExpired(true);
                    if (deadline?.date) {
                        const d = new Date(`${deadline.date}T${deadline.time || '23:59'}:00`);
                        setDeadlineLabel(d.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }));
                    }
                } else if (deadline?.date && deadline?.isActive) {
                    // Show a soft "closes on" notice even when still open
                    const now = getSystemTime(); // respects dev override
                    const d = new Date(`${deadline.date}T${deadline.time || '23:59'}:00`);
                    if (d > now) {
                        setDeadlineLabel(d.toLocaleString([], { dateStyle: 'long', timeStyle: 'short' }));
                    }
                }
            } catch (error) {
                console.error("Could not fetch deadline settings.");
            } finally {
                setIsLoading(false);
            }
        };
        checkDeadline();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.truthfulness_attestation) {
            setMessage({ text: 'You must attest to the truthfulness of this application to proceed.', type: 'error' });
            return;
        }
        
        try {
            const res = await applyForJob(formData);
            setMessage({ text: res.message, type: 'success' });
            window.scrollTo(0, 0);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'Error submitting application', type: 'error' });
            window.scrollTo(0, 0);
        }
    };

    if (isLoading) return <div style={{textAlign: 'center', marginTop: '100px'}}>Loading Application...</div>;

    // Formal Deadline Expired View
    if (isExpired) {
        return (
            <div className="job-form-wrapper">
                <div className="deadline-expired-card">
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚫</div>
                    <h2>Applications Are Closed</h2>
                    <p>The submission deadline has passed.</p>
                    {deadlineLabel && (
                        <p style={{ marginTop: '8px', fontSize: '14px', color: '#6b7280' }}>
                            Closed on: <strong>{deadlineLabel}</strong>
                        </p>
                    )}
                    <p style={{ marginTop: '16px', fontSize: '13px', color: '#9ca3af' }}>
                        If you believe this is an error, please contact hospital administration.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="job-form-wrapper">
            <div className="job-form-container">
                <div className="form-header">
                    <h2>Therapist Job Application</h2>
                    <p>Tell us about yourself and your experience</p>
                    {deadlineLabel && (
                        <div style={{
                            marginTop: '10px',
                            background: '#FEF3C7',
                            border: '1px solid #FDE68A',
                            borderRadius: '8px',
                            padding: '8px 14px',
                            fontSize: '13px',
                            color: '#92400E',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            ⏰ Application deadline: <strong>{deadlineLabel}</strong>
                        </div>
                    )}
                </div>

                {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}

                <form onSubmit={handleSubmit}>
                    
                    {/* Section 1: Personal Information */}
                    <div className="form-section">
                        <div className="section-title">1. Your Basic Details</div>
                        <div className="grid-2">
                            <div className="form-group"><label>Full Legal Name</label><input type="text" name="name" onChange={handleChange} required /></div>
                            <div className="form-group"><label>Professional Email</label><input type="email" name="email" onChange={handleChange} required /></div>
                            <div className="form-group full-width"><label>Current Mailing Address</label><input type="text" name="address" onChange={handleChange} required /></div>
                            <div className="form-group"><label>Primary Phone</label><input type="text" name="phone" onChange={handleChange} required /></div>
                            <div className="form-group"><label>National ID / SSN / Passport</label><input type="text" name="national_id" onChange={handleChange} required /></div>
                            <div className="form-group full-width"><label>Emergency Contact (Name & Phone)</label><input type="text" name="emergency_contact" onChange={handleChange} required /></div>
                        </div>
                    </div>

                    {/* Section 2: Position & Availability */}
                    <div className="form-section">
                        <div className="section-title">2. Position & Availability</div>
                        <div className="grid-2">
                            <div className="form-group">
                                <label>Position Applied For</label>
                                <select name="position_applied" onChange={handleChange} required>
                                    <option value="">Select Position...</option>
                                    <option value="Clinical Psychologist">Clinical Psychologist</option>
                                    <option value="Physical Therapist">Physical Therapist</option>
                                    <option value="Occupational Therapist">Occupational Therapist</option>
                                    <option value="Psychiatrist">Psychiatrist</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Employment Type</label>
                                <select name="employment_type" onChange={handleChange}>
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="PRN">PRN (As Needed)</option>
                                    <option value="Contract">Contract</option>
                                </select>
                            </div>
                            <div className="form-group"><label>Shift Availability (Days, Nights, Weekends)</label><input type="text" name="shift_availability" onChange={handleChange} /></div>
                            <div className="form-group"><label>Available Start Date</label><input type="date" name="start_date" onChange={handleChange} required /></div>
                        </div>
                    </div>

                    {/* Section 3: Professional Credentialing */}
                    <div className="form-section">
                        <div className="section-title">3. Licenses & Certifications</div>
                        <div className="grid-2">
                            <div className="form-group full-width"><label>Primary Clinical License (Type, State, Number, Expiration)</label><input type="text" name="primary_license" onChange={handleChange} required /></div>
                            <div className="form-group"><label>National Provider Identifier (NPI)</label><input type="text" name="npi" onChange={handleChange} /></div>
                            <div className="form-group"><label>Basic Certifications (e.g., BLS/CPR)</label><input type="text" name="basic_certs" onChange={handleChange} /></div>
                            <div className="form-group full-width"><label>Specialty Certifications</label><input type="text" name="specialty_certs" onChange={handleChange} /></div>
                        </div>
                    </div>

                    {/* Section 4 & 5: Education & Skills */}
                    <div className="form-section">
                        <div className="section-title">4. Education & Experience</div>
                        <div className="grid-2">
                            <div className="form-group full-width"><label>Highest Degree Earned (Institution & Year)</label><input type="text" name="education_history" onChange={handleChange} required /></div>
                            <div className="form-group"><label>EMR Systems Experience (Epic, Cerner, etc.)</label><input type="text" name="emr_experience" onChange={handleChange} /></div>
                            <div className="form-group"><label>Languages Spoken (Fluency Level)</label><input type="text" name="languages" onChange={handleChange} /></div>
                            <div className="form-group full-width"><label>Therapy Styles (e.g., CBT, EMDR, Manual Therapy)</label><input type="text" name="therapeutic_modalities" onChange={handleChange} /></div>
                        </div>
                    </div>

                    {/* Section 6: Legal, Compliance & Health */}
                    <div className="form-section">
                        <div className="section-title">5. Background & Health Information</div>
                        <div className="form-group" style={{marginBottom: '15px'}}>
                            <label>Have you ever had professional complaints or legal issues? (If no, write "None")</label>
                            <textarea name="malpractice_history" rows="3" onChange={handleChange} required defaultValue="None"></textarea>
                        </div>
                        <div className="grid-2">
                            <div className="checkbox-group"><input type="checkbox" name="license_suspension" id="susp" onChange={handleChange}/><label htmlFor="susp">My license has previously been suspended/revoked.</label></div>
                            <div className="checkbox-group"><input type="checkbox" name="criminal_record" id="crim" onChange={handleChange}/><label htmlFor="crim">I have a criminal conviction record.</label></div>
                            <div className="checkbox-group"><input type="checkbox" name="immunization_proof" id="imm" onChange={handleChange}/><label htmlFor="imm">I can provide proof of required hospital immunizations (TB, Hep B).</label></div>
                            <div className="checkbox-group"><input type="checkbox" name="physical_capability" id="phys" onChange={handleChange}/><label htmlFor="phys">I am physically able to perform the daily duties of this job.</label></div>
                        </div>
                    </div>

                    {/* Final Declaration */}
                    <div className="form-section" style={{ borderLeft: '4px solid #3b74ce' }}>
                        <div className="section-title">Declaration & Signature</div>
                        <p style={{fontSize: '13px', color: '#64748b', marginBottom: '15px'}}>
                            By submitting this application, I authorize the hospital to conduct a background credentialing check.
                        </p>
                        <div className="checkbox-group">
                            <input type="checkbox" name="truthfulness_attestation" id="truth" onChange={handleChange} required />
                            <label htmlFor="truth" style={{fontWeight: 'bold', color: '#1e293b'}}>
                                I attest that all information provided is completely true and accurate. I understand falsification is grounds for immediate termination.
                            </label>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn">Submit Formal Application</button>
                </form>
            </div>
        </div>
    );
};

export default TherapistJobForm;