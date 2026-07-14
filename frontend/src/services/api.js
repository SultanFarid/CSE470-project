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