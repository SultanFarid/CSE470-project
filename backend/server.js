const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminVerificationRoutes = require('./routes/adminVerificationRoutes');
const adminGroupApprovalRoutes = require('./routes/adminGroupApprovalRoutes');
const groupSessionRoutes = require('./routes/groupSessionRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const prescriptionRoutes = require('./routes/prescriptionRoutes');
const caseloadRoutes = require('./routes/caseloadRoutes');
const archiveRoutes = require('./routes/archiveRoutes');
const earningsRoutes = require('./routes/earningsRoutes');
const therapistDirectoryRoutes = require('./routes/therapistDirectoryRoutes');
const { startExerciseReminderJob } = require('./jobs/exerciseReminderJob');
const { startBookNextSessionJob } = require('./jobs/bookNextSessionJob');
const { startScheduleConfirmationReminderJob } = require('./jobs/scheduleConfirmationReminderJob');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Bind Routes
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin/verification', adminVerificationRoutes); 
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/admin', adminGroupApprovalRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/groups', groupSessionRoutes);

// Therapist Dashboard build-out: Active Caseload, Prescription Studio,
// Patient Archives, and Earnings & Jobs.
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/caseload', caseloadRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/patient', therapistDirectoryRoutes);

// Feature 11 (Pre-Session Briefings) + Prescription Builder upgrade (Feature 12)
app.use('/api/vitals', require('./routes/vitalsRoutes'));
app.use('/api/catalog', require('./routes/catalogRoutes'));
app.use('/api/briefings', require('./routes/briefingRoutes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    if (typeof startExerciseReminderJob === 'function') startExerciseReminderJob();
    if (typeof startBookNextSessionJob === 'function') startBookNextSessionJob();
    if (typeof startScheduleConfirmationReminderJob === 'function') startScheduleConfirmationReminderJob();
});