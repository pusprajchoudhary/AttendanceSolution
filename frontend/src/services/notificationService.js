import axios from 'axios';

const API_URL = 'http://localhost:5000/api/notifications';

// Get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to update token for each request
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Admin: Send a notification
export const sendNotification = async (notificationData) => {
  try {
    const response = await api.post('/', notificationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// User: Get latest notification
export const getLatestNotification = async () => {
  try {
    console.log('Making API call to get latest notification');
    const response = await api.get('/latest');
    console.log('Latest notification API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in getLatestNotification:', error.response?.data || error.message);
    throw error;
  }
};

// User: Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    console.log('Marking notification as read:', notificationId);
    const response = await api.put(`/${notificationId}/read`);
    console.log('Mark as read response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error.response?.data || error.message);
    throw error;
  }
};

export const getActiveNotifications = async () => {
  try {
    const response = await api.get('/active');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createNotification = async (notificationData) => {
  try {
    const response = await api.post('/', notificationData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getAllNotifications = async () => {
  try {
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateNotificationStatus = async (id, isActive) => {
  try {
    const response = await api.put(`/${id}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await api.delete(`/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}; 