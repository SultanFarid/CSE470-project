import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
            <h2>Admin Dashboard</h2>
            <p>Admin features will go here.</p>

            <div style={{ marginTop: '24px' }}>
                <Link
                    to="/admin/users"
                    style={{
                        display: 'inline-block',
                        padding: '12px 20px',
                        backgroundColor: '#635BFF',
                        color: '#FFFFFF',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '14px'
                    }}
                >
                    Go to User Management →
                </Link>
            </div>
        </div>
    );
};

// THIS IS THE LINE VITE WAS LOOKING FOR!
export default AdminDashboard;