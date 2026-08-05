import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

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

// --- Auth ---
export const login = async (email, password, role) => {
    const response = await apiInstance.post('/auth/login', { email, password, role });
    return response.data;
};

// --- Therapist ---
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

export const getTherapistProfile = async (userId) => {
    const response = await apiInstance.get(`/therapist/profile/${userId}`);
    return response.data;
};

export const uploadProfilePhoto = async (formData) => {
    const response = await apiInstance.post('/therapist/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

// --- Patient ---
export const getPatientProfile = async () => {
    const response = await apiInstance.get('/patient/profile');
    return response.data;
};

export const updatePatientProfile = async (profileData) => {
    const response = await apiInstance.put('/patient/profile', profileData);
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

export const SERVER_BASE_URL = 'http://localhost:5000';