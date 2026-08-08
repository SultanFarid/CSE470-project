import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import PatientDashboard from './components/patient/PatientDashboard';
import TherapistDashboard from './components/therapist/TherapistDashboard';
import TherapistProfileEditor from './components/therapist/TherapistProfileEditor';
import TherapistJobForm from './components/therapist/TherapistJobForm';
import AdminUserManagement from "./components/admin/AdminUserManagement";
import AdminSignup from "./components/auth/AdminSignup";
import AdminVerificationDashboard from "./components/admin/AdminVerificationDashboard";
import AdminAnalyticsDashboard from "./components/admin/AdminAnalyticsDashboard";
import AdminGroupApprovals from "./components/admin/AdminGroupApprovals";
import TherapistGroupProposals from "./components/therapist/TherapistGroupProposals";
import PatientGroupSessions from "./components/patient/PatientGroupSessions";
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
<Route path="/therapist-dashboard/profile" element={<TherapistProfileEditor />} />
        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin/verification" element={<AdminVerificationDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsDashboard />} />
        <Route path="/admin/group-approvals" element={<AdminGroupApprovals />} />
        <Route path="/therapist-dashboard/group-proposals" element={<TherapistGroupProposals />} />
        <Route path="/patient/group-sessions" element={<PatientGroupSessions />} />

      </Routes>
    </Router>
  );
}

export default App;