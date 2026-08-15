import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import PatientSignup from './components/auth/PatientSignup';
import PatientDashboard from './components/patient/PatientDashboard';
import TherapistLayout from './components/therapist/TherapistLayout';
import TherapistDashboard from './components/therapist/TherapistDashboard';
import TherapistProfileEditor from './components/therapist/TherapistProfileEditor';
import TherapistJobForm from './components/therapist/TherapistJobForm';
import ActiveCaseload from './components/therapist/ActiveCaseload';
import PrescriptionStudio from './components/therapist/PrescriptionStudio';
import PatientArchives from './components/therapist/PatientArchives';
import EarningsJobs from './components/therapist/EarningsJobs';
import AdminUserManagement from "./components/admin/AdminUserManagement";
import AdminSignup from "./components/auth/AdminSignup";
import AdminVerificationDashboard from "./components/admin/AdminVerificationDashboard";
import AdminAnalyticsDashboard from "./components/admin/AdminAnalyticsDashboard";
import AdminGroupApprovals from "./components/admin/AdminGroupApprovals";
import TherapistGroupProposals from "./components/therapist/TherapistGroupProposals";
import PatientGroupSessions from "./components/patient/PatientGroupSessions";
import ScheduleManager from './components/therapist/ScheduleManager';

function App() {
  return (
    <Router>
      <Routes>
        {/* Make sure Navigate is imported at the top! */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patient-signup" element={<PatientSignup />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/apply" element={<TherapistJobForm />} />

        {/* Every therapist page renders inside TherapistLayout, so the
            navbar + sidebar stay on screen no matter which nav item is active. */}
        <Route path="/therapist-dashboard" element={<TherapistLayout />}>
          <Route index element={<TherapistDashboard />} />
          <Route path="schedule" element={<ScheduleManager />} />
          <Route path="caseload" element={<ActiveCaseload />} />
          <Route path="prescriptions" element={<PrescriptionStudio />} />
          <Route path="archive" element={<PatientArchives />} />
          <Route path="group-proposals" element={<TherapistGroupProposals />} />
          <Route path="earnings" element={<EarningsJobs />} />
          <Route path="profile" element={<TherapistProfileEditor />} />
        </Route>

        <Route path="/admin/users" element={<AdminUserManagement />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route path="/admin/verification" element={<AdminVerificationDashboard />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsDashboard />} />
        <Route path="/admin/group-approvals" element={<AdminGroupApprovals />} />
        <Route path="/patient/group-sessions" element={<PatientGroupSessions />} />
      </Routes>
    </Router>
  );
}

export default App;
