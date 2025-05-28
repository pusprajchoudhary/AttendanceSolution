import api from './api';

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token-related errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const createUser = async (userData) => {
  try {
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to create user');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to create user');
    }
  }
};

export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch users');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }
};

export const toggleUserStatus = async (userId) => {
  try {
    const response = await api.patch(`/users/${userId}/toggle-status`);
    return response.data;
  } catch (error) {
    console.error('Error toggling user status:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to toggle user status');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to toggle user status');
    }
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete user');
    } else if (error.request) {
      throw new Error('No response from server');
    } else {
      throw new Error(error.message || 'Failed to delete user');
    }
  }
};
