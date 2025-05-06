import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Remplacez par l'URL de votre backend

export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const loginUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const resetPassword = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, userData);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
