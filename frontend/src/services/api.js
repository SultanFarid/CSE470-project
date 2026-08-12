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