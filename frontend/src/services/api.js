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

export const bookSession = async (therapistId) => {
    const response = await apiInstance.post('/sessions/book', { therapistId });
    return response.data;
};

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
    apiInstance.post('/therapist/groups/propose', data).then(res => res.data);

export const therapistGetMyProposals = () =>
    apiInstance.get('/therapist/groups/my-proposals').then(res => res.data.data);

// --- Patient: Group Sessions ---
export const patientGetOpenGroupSessions = () =>
    apiInstance.get('/groups/open').then(res => res.data);

export const patientJoinGroupSession = (sessionId) =>
    apiInstance.post(`/groups/${sessionId}/join`).then(res => res.data);

export const patientGetMyEnrollments = () =>
    apiInstance.get('/groups/my-enrollments').then(res => res.data);
