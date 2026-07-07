import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../../services/api';
import illustration from '../../assets/sts-illustration.png';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activeRole, setActiveRole] = useState('patient');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            // We pass the activeRole (the currently selected tab) to the backend
            const data = await login(email, password, activeRole);
            const userRole = data.user.role;

            setSuccessMessage(`Welcome ${data.user.name}! Routing...`);
            setTimeout(() => {
                if (userRole === 'patient') navigate('/patient-dashboard');
                else if (userRole === 'therapist') navigate('/therapist-dashboard');
                else if (userRole === 'admin') navigate('/admin-dashboard');
            }, 1000);
            
        } catch (err) {
            // This will now display the custom 403 error message from the backend
            setError(err.response?.data?.message || 'Network error.');
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-card-split">
                
                {/* Left Side: Illustration */}
                <div className="login-illustration">
                    <img src={illustration} alt="Smart Therapy System" />
                </div>

                {/* Right Side: Login Form */}
                <div className="login-form-container">
                    <h2 className="login-title">Welcome!</h2>
                    
                    {error && <div className="alert alert-error">{error}</div>}
                    {successMessage && <div className="alert alert-success">{successMessage}</div>}
                    
                    {/* Role Toggle */}
                    <div className="role-toggle-container">
                        <span className="role-toggle-label">LOGIN AS</span>
                        <div className="role-toggle">
                            <button 
                                type="button" 
                                className={`role-btn ${activeRole === 'patient' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRole('patient');
                                    setError(''); // Clear errors on tab switch
                                }}
                            >
                                PATIENT
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${activeRole === 'therapist' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRole('therapist');
                                    setError('');
                                }}
                            >
                                THERAPIST
                            </button>
                            <button 
                                type="button" 
                                className={`role-btn ${activeRole === 'admin' ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRole('admin');
                                    setError('');
                                }}
                            >
                                ADMIN
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="input-group">
                            <label htmlFor="email">Email</label>
                            <div className="input-with-icon">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                    <polyline points="22,6 12,13 2,6"></polyline>
                                </svg>
                                <input 
                                    id="email"
                                    type="email" 
                                    className="login-input"
                                    placeholder="your.email@example.com" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required 
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-with-icon">
                                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
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

                        <button type="submit" className="login-button">
                            LOGIN
                        </button>
                        <a href="#" className="forgot-password">Forgot Password?</a>
                    </form>

                    {/* Dynamic Signup Box: Only shows if the active tab is NOT admin */}
                    {activeRole !== 'admin' && (
                        <div className="signup-box">
                            <span className="signup-text">Don't have an account? </span>
                            <Link 
                                to={activeRole === 'therapist' ? '/apply' : '/patient-signup'} 
                                className="signup-link"
                            >
                                SIGN UP AS {activeRole.toUpperCase()}
                            </Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default Login;