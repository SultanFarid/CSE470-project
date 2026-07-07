import axios from 'axios';
const API_URL = 'http://localhost:5000/api';

export const login = async (email, password, role) => {
    // Send the role in the request body
    const response = await axios.post(`${API_URL}/auth/login`, { email, password, role });
    return response.data;
}
export const applyForJob = async (applicationData) => {
    const response = await axios.post(`${API_URL}/therapist/apply`, applicationData);
    return response.data;
};

export const updateTherapistProfile = async (profileData) => {
    const response = await axios.post(`${API_URL}/therapist/update-profile`, profileData);
    return response.data;
};

export const getSystemSettings = async () => {
    const response = await axios.get(`${API_URL}/therapist/settings`);
    return response.data;
};