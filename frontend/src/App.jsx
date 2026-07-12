import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import PatientDashboard from './components/patient/PatientDashboard';
import TherapistDashboard from './components/therapist/TherapistDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TherapistJobForm from './components/therapist/TherapistJobForm';
function App() {
  return (
    <Router>
      <Routes>
        {/* Make sure Navigate is imported at the top! */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/apply" element={<TherapistJobForm />} />
        <Route path="/therapist-dashboard" element={<TherapistDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

condsole.log("Hello Hi")