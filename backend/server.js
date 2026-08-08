const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 1. Import Routes
const authRoutes = require('./routes/authRoutes');
const therapistRoutes = require('./routes/therapistRoutes');
const patientRoutes = require('./routes/patientRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminVerificationRoutes = require('./routes/adminVerificationRoutes');
const adminGroupApprovalRoutes = require('./routes/adminGroupApprovalRoutes');
const groupSessionRoutes = require('./routes/groupSessionRoutes');

const { startExerciseReminderJob } = require('./jobs/exerciseReminderJob');
const { startBookNextSessionJob } = require('./jobs/bookNextSessionJob');

// 2. Initialize the app
const app = express();

// 3. Setup Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Bind Routes
app.use('/api/auth', authRoutes);
app.use('/api/therapist', therapistRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/admin/verification', adminVerificationRoutes); 
app.use('/api/admin/analytics', require('./routes/adminAnalyticsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/admin', adminGroupApprovalRoutes);

// Fix: Registered as /api/groups to match frontend api.js
app.use('/api/groups', groupSessionRoutes);

// 5. Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    startExerciseReminderJob();
    startBookNextSessionJob();
});