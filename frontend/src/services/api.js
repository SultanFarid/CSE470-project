import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

// 1. Create a reusable axios instance
const apiInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 2. Add an interceptor to inject the token into headers automatically
apiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// --- Your App Functions (Updated to use the new apiInstance) ---

export const login = async (email, password, role) => {
    // Send the role in the request body
    const response = await apiInstance.post('/auth/login', { email, password, role });
    return response.data;
};

export const registerPatient = async (name, email, password) => {
    const response = await apiInstance.post('/auth/register-patient', { name, email, password });
    return response.data;
};

export const applyForJob = async (applicationData) => {
    const response = await apiInstance.post('/therapist/apply', applicationData);
    return response.data;
};

export const updateTherapistProfile = async (profileData) => {
    const response = await apiInstance.put('/therapist/update-profile', profileData);
    return response.data;
};

export const getSystemSettings = async () => {
    const response = await apiInstance.get('/therapist/settings');
    return response.data;
};

export const SERVER_BASE_URL = 'http://localhost:5001';

export const getTherapistProfile = async (userId) => {
    const response = await apiInstance.get(`/therapist/profile/${userId}`);
    return response.data;
};

export const uploadProfilePhoto = async (formData) => {
    // Overriding content-type for image files
    const response = await apiInstance.post('/therapist/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getPatientProfile = async () => {
    const response = await apiInstance.get('/patient/profile');
    return response.data;
};

export const updatePatientProfile = async (profileData) => {
    const response = await apiInstance.put('/patient/profile', profileData);
    return response.data;
};

export const uploadPatientPhoto = async (formData) => {
    // Overriding content-type for image files
    const response = await apiInstance.post('/patient/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const getPatientTasks = async () => {
    const response = await apiInstance.get('/patient/tasks');
    return response.data;
};

export const createPatientTask = async (taskData) => {
    const response = await apiInstance.post('/patient/tasks', taskData);
    return response.data;
};

export const deletePatientTask = async (taskId) => {
    const response = await apiInstance.delete(`/patient/tasks/${taskId}`);
    return response.data;
};

// Feature 6b: Mark a task as done — records date for streak + removes from list
export const completeTask = async (taskId) =>
    apiInstance.post(`/patient/tasks/${taskId}/complete`).then(res => res.data);

// Feature 6b: Get the patient's current streak (consecutive days with completions)
export const getMyStreak = () =>
    apiInstance.get('/patient/streak').then(res => res.data.streak);

// Feature 6a: Care plan opt-in prompt
export const getPendingCarePlan = () =>
    apiInstance.get('/prescriptions/patient/pending-care-plan').then(res => res.data);

export const acceptCarePlan = (prescriptionId) =>
    apiInstance.put(`/prescriptions/patient/${prescriptionId}/accept-care-plan`).then(res => res.data);

export const getTherapistDirectory = async () => {
    const response = await apiInstance.get('/patient/therapist-directory');
    return response.data;
};

// --- Feature 5: Appointment API Endpoints ---
export const getAppointments = async () => {
    const response = await apiInstance.get('/patient/appointments');
    return response.data;
};

export const bookAppointment = async (bookingData) => {
    const response = await apiInstance.post('/patient/appointments/book', bookingData);
    return response.data;
};

export const cancelAppointment = async (appointmentId) => {
    const response = await apiInstance.put(`/patient/appointments/${appointmentId}/cancel`);
    return response.data;
};

export const getTherapistSlots = async (therapistId, date) => {
    const response = await apiInstance.get(`/patient/therapist-slots?therapistId=${therapistId}&date=${date}`);
    return response.data;
};

// Reads the therapist's weekly availability matrix + date exceptions for a single day.
// Backed by GET /api/availability/:therapistId/effective (public, no auth required).
export const getEffectiveAvailability = async (therapistId, date) => {
    const response = await apiInstance.get(`/availability/${therapistId}/effective`, {
        params: { from: date, to: date }
    });
    return response.data;
};

// --- Feature 7: Review & Feedback API Endpoints ---
export const submitReview = async (reviewData) => {
    const response = await apiInstance.post('/reviews/submit', reviewData);
    return response.data;
};

export const getPendingReview = async () => {
    const response = await apiInstance.get('/reviews/pending');
    return response.data;
};

export const getTherapistReviewSummary = async (therapistId) => {
    const response = await apiInstance.get(`/reviews/therapist/${therapistId}`);
    return response.data;
};

export const getAllTherapistReviewSummaries = async () => {
    const response = await apiInstance.get('/reviews/all-summaries');
    return response.data;
};

export const bookSession = async (therapistId) => {
    const response = await apiInstance.post('/sessions/book', { therapistId });
    return response.data;
};

// --- Therapist: Sessions (Command Center) ---
export const getMyTherapistSessions = () =>
    apiInstance.get('/sessions/my-sessions/therapist').then(res => res.data);

export const updateSessionStatus = (sessionId, status) =>
    apiInstance.put(`/sessions/${sessionId}/status`, { status }).then(res => res.data);

// --- Therapist: Prescription Studio (Feature 12) ---
export const savePrescription = (payload) =>
    apiInstance.post('/prescriptions/save', payload).then(res => res.data);

export const getPrescriptionForSession = (sessionId) =>
    apiInstance.get(`/prescriptions/session/${sessionId}`).then(res => res.data);

export const getPrescriptionPdfDataForTherapist = (sessionId) =>
    apiInstance.get(`/prescriptions/pdf-data/session/${sessionId}`).then(res => res.data);

// --- Therapist: Pre-Session Patient Briefings (Feature 11) ---
export const getPreSessionBriefing = (sessionId) =>
    apiInstance.get(`/briefings/session/${sessionId}`).then(res => res.data);

// --- Therapist: Medicine & Test catalog search (Prescription Builder) ---
export const searchMedicines = (q) =>
    apiInstance.get('/catalog/medicines/search', { params: { q } }).then(res => res.data);

export const searchTests = (q) =>
    apiInstance.get('/catalog/tests/search', { params: { q } }).then(res => res.data);

// --- Patient: Vitals Check persistence (backs the pre-session briefing) ---
export const saveVitals = (vitalsData) =>
    apiInstance.post('/vitals/save', vitalsData).then(res => res.data);

// --- Patient: Follow-up accept/decline prompt (Feature 12 extension) ---
export const getPendingFollowUp = () =>
    apiInstance.get('/prescriptions/patient/pending-follow-up').then(res => res.data);

export const respondToFollowUp = (prescriptionId, accept) =>
    apiInstance.put(`/prescriptions/patient/${prescriptionId}/respond-follow-up`, { accept }).then(res => res.data);

// --- Patient: My Prescriptions ---
export const getMyPrescriptionsList = () =>
    apiInstance.get('/prescriptions/patient/my').then(res => res.data);

export const getPrescriptionPdfDataForPatient = (sessionId) =>
    apiInstance.get(`/prescriptions/patient/session/${sessionId}/pdf-data`).then(res => res.data);

// --- Therapist: Active Caseload (Feature 13) ---
export const getMyCaseload = () =>
    apiInstance.get('/caseload/my').then(res => res.data.data);

// --- Therapist: Patient Archives (Feature 14) ---
export const searchMyPatients = (search) =>
    apiInstance.get('/archive/patients', { params: search ? { search } : {} }).then(res => res.data.data);

export const getPatientHistory = (patientId) =>
    apiInstance.get(`/archive/patients/${patientId}/history`).then(res => res.data.data);

// --- Therapist: Earnings & Jobs (Feature 15) ---
export const getMyEarnings = () =>
    apiInstance.get('/earnings/my').then(res => res.data.data);

// --- Therapist: Wallet (balance, transaction history, redeem) ---
export const getMyWallet = () =>
    apiInstance.get('/wallet/my').then(res => res.data.data);

export const redeemWallet = (payload) =>
    apiInstance.post('/wallet/redeem', payload).then(res => res.data);

// --- Therapist: Reviews summary (Command Center reputation card) ---
export const getMyReviewSummary = () =>
    apiInstance.get('/reviews/my-summary').then(res => res.data.data);

// --- Therapist: send a real check-in notification to a patient ---
export const sendCheckIn = (patientId, message) =>
    apiInstance.post('/notifications/send-checkin', { patientId, message }).then(res => res.data);


// --- Admin ---
export const adminGetAllUsers = async (search, role) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const response = await apiInstance.get(`/admin/users?${params.toString()}`);
    return response.data;
};

export const adminGetUserDetails = async (userId) => {
    const response = await apiInstance.get(`/admin/users/${userId}`);
    return response.data;
};

export const adminSuspendUser = async (userId) => {
    const response = await apiInstance.put(`/admin/users/${userId}/suspend`);
    return response.data;
};

export const adminDeactivateUser = async (userId) => {
    const response = await apiInstance.put(`/admin/users/${userId}/deactivate`);
    return response.data;
};

export const adminReactivateUser = async (userId) => {
    const response = await apiInstance.put(`/admin/users/${userId}/reactivate`);
    return response.data;
};

export const adminSignup = async (name, email, password, secretKey) => {
    const response = await axios.post(
        `${API_URL}/auth/admin-signup`,
        { name, email, password, secretKey }
    );
    return response.data;
};

// --- Admin: Therapist Verification (Feature 16) ---
export const adminGetApplications = (status) =>
    apiInstance.get(`/admin/verification/applications`, { params: { status } }).then(res => res.data);

export const adminGetApplicationDetails = (id) =>
    apiInstance.get(`/admin/verification/applications/${id}`).then(res => res.data);

export const adminApproveApplication = (id) =>
    apiInstance.put(`/admin/verification/applications/${id}/approve`).then(res => res.data);

export const adminRejectApplication = (id) =>
    apiInstance.put(`/admin/verification/applications/${id}/reject`).then(res => res.data);

export const adminScheduleViva = (id, vivaDate, notes) =>
    apiInstance.put(`/admin/verification/applications/${id}/schedule-viva`, { vivaDate, notes }).then(res => res.data);

export const adminGetAnalytics = async () => {
    const response = await apiInstance.get('/admin/analytics/dashboard');
    return response.data;
};

export const getMyNotifications = () =>
    apiInstance.get('/notifications').then(res => res.data);

export const getUnreadNotificationCount = () =>
    apiInstance.get('/notifications/unread-count').then(res => res.data.count);

export const markNotificationRead = (id) =>
    apiInstance.put(`/notifications/${id}/read`).then(res => res.data);

export const markAllNotificationsRead = () =>
    apiInstance.put('/notifications/mark-all-read').then(res => res.data);

// --- Admin: Group Approvals ---
export const adminGetGroupProposals = (status) => {
    const params = status && status !== 'all' ? { status } : {};
    return apiInstance.get(`/admin/groups/proposals`, { params }).then(res => res.data.data);
};

// Backend -এ router.patch ব্যবহার করা হয়েছে, তাই এখানে patch ব্যবহার করতে হবে
export const adminApproveGroupProposal = (id) =>
    apiInstance.patch(`/admin/groups/proposals/${id}/approve`).then(res => res.data);

export const adminRejectGroupProposal = (id, reason) =>
    apiInstance.patch(`/admin/groups/proposals/${id}/reject`, { reason }).then(res => res.data);

// --- Therapist: Group Proposals ---
export const therapistProposeGroup = (data) =>
    apiInstance.post('/groups/propose', data).then(res => res.data);

export const therapistGetMyProposals = () =>
    apiInstance.get('/groups/my-proposals').then(res => res.data.data);
// --- Therapist: Manage Group Session (Feature 20) ---
export const therapistGetEnrolledPatients = (sessionId) =>
    apiInstance.get(`/groups/${sessionId}/enrolled`).then(res => res.data.data);

export const therapistMarkAttendance = (enrollmentId, attended) =>
    apiInstance.put(`/groups/enrollment/${enrollmentId}/attendance`, { attended }).then(res => res.data);

export const therapistWriteSessionNotes = (sessionId, notes) =>
    apiInstance.put(`/groups/${sessionId}/notes`, { notes }).then(res => res.data);

// --- Patient: Group Sessions ---
export const patientGetOpenGroupSessions = () =>
    apiInstance.get('/groups/open').then(res => res.data);

export const patientJoinGroupSession = (sessionId) =>
    apiInstance.post(`/groups/${sessionId}/join`).then(res => res.data);

export const patientGetMyEnrollments = () =>
    apiInstance.get('/groups/my-enrollments').then(res => res.data);

// --- Therapist: Schedule Manager (Availability Matrix) ---
export const getMySchedule = () =>
    apiInstance.get('/availability/schedule').then(res => res.data);

export const saveMySchedule = (payload) =>
    apiInstance.put('/availability/schedule', payload).then(res => res.data);

export const getMyExceptions = () =>
    apiInstance.get('/availability/exceptions').then(res => res.data.exceptions);

export const addAvailabilityException = (payload) =>
    apiInstance.post('/availability/exceptions', payload).then(res => res.data);

export const deleteAvailabilityException = (id) =>
    apiInstance.delete(`/availability/exceptions/${id}`).then(res => res.data);

// --- Admin: System Settings (Application Deadline) ---
export const getAdminSettings = () =>
    apiInstance.get('/admin/verification/settings').then(res => res.data);

export const saveDeadline = ({ date, time, isActive }) =>
    apiInstance.put('/admin/verification/settings/deadline', { date, time, isActive }).then(res => res.data);

// --- Public: Check if applications are open (used by job form, no auth) ---
export const getApplicationSettings = () =>
    apiInstance.get('/therapist/settings').then(res => res.data);

export const getAiMatchmaker = (vitalsData) =>
    apiInstance.post('/patient/matchmaker', vitalsData).then(res => res.data);

