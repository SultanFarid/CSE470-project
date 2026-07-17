import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminSignup } from '../../services/api';
import illustration from '../../assets/sts-illustration.png';
import './Login.css';

const AdminSignup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        try {
            const data = await adminSignup(name, email, password, secretKey);
            const token = data.token || data.accessToken;

            if (token) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setSuccessMessage('Admin account created! Redirecting to login...');
                setTimeout(() => navigate('/login'), 1500);
            } else {
                setSuccessMessage('Admin account created. Please log in.');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed. Check your details.');
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-card-split">

                <div className="login-illustration">
                    <img src={illustration} alt="Smart Therapy System" />
                </div>

                <div className="login-form-container">
                    <h2 className="login-title">Create Admin Account</h2>
                    <p style={{ color: '#7C8098', fontSize: '13px', marginTop: '-8px', marginBottom: '16px' }}>
                        This page is restricted. You need a valid admin secret key
                        provided by the project owner to create an account here.
                    </p>

                    {error && <div className="alert alert-error">{error}</div>}
                    {successMessage && <div className="alert alert-success">{successMessage}</div>}

                    <form onSubmit={handleSignup} className="login-form">
                        <div className="input-group">
                            <label htmlFor="name">Full Name</label>
                            <div className="input-with-icon">
                                <input
                                    id="name"
                                    type="text"
                                    className="login-input"
                                    placeholder="Your full name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-with-icon">
                                <input
                                    id="email"
                                    type="email"
                                    className="login-input"
                                    placeholder="admin@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <input
                                    id="password"
                                    type="password"
                                    className="login-input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="secretKey">Admin Secret Key</label>
                            <div className="input-with-icon">
                                <input
                                    id="secretKey"
                                    type="password"
                                    className="login-input"
                                    placeholder="Provided by project owner"
                                    value={secretKey}
                                    onChange={(e) => setSecretKey(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-button">
                            CREATE ADMIN ACCOUNT
                        </button>
                    </form>

                    <div className="signup-box">
                        <span className="signup-text">Already have an account? </span>
                        <Link to="/login" className="signup-link">
                            GO TO LOGIN
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSignup;