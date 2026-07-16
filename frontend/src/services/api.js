import axios from 'axios';

const API_URL = '/api';

export const login = async (email, password, role) => {
    const response = await axios.post(
        `${API_URL}/auth/login`, 
        { email, password, role }
    );
    return response.data;
};

export const applyForJob = async (applicationData) => {
    const response = await axios.post(
        `${API_URL}/therapist/apply`, 
        applicationData
    );
    return response.data;
};

export const updateTherapistProfile = async (profileData) => {
    const response = await axios.post(
        `${API_URL}/therapist/update-profile`, 
        profileData
    );
    return response.data;
};

export const getSystemSettings = async () => {
    const response = await axios.get(
        `${API_URL}/therapist/settings`
    );
    return response.data;
};

export const adminGetAllUsers = async (search, role) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role) params.append('role', role);
    const response = await axios.get(
        `${API_URL}/admin/users?${params.toString()}`
    );
    return response.data;
};

export const adminGetUserDetails = async (userId) => {
    const response = await axios.get(
        `${API_URL}/admin/users/${userId}`
    );
    return response.data;
};

export const adminSuspendUser = async (userId) => {
    const response = await axios.put(
        `${API_URL}/admin/users/${userId}/suspend`
    );
    return response.data;
};

export const adminDeactivateUser = async (userId) => {
    const response = await axios.put(
        `${API_URL}/admin/users/${userId}/deactivate`
    );
    return response.data;
};

export const adminReactivateUser = async (userId) => {
    const response = await axios.put(
        `${API_URL}/admin/users/${userId}/reactivate`
    );
    return response.data;
};

export const SERVER_BASE_URL = 'http://localhost:5000';

export const getTherapistProfile = async (userId) => {
    const response = await axios.get(
        `${API_URL}/therapist/profile/${userId}`
    );
    return response.data;
};

export const uploadProfilePhoto = async (formData) => {
    const response = await axios.post(
        `${API_URL}/therapist/upload-photo`, 
        formData
    );
    return response.data;
};