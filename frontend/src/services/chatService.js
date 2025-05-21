import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthToken = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return `Bearer ${token}`;
};

// Get user ID from localStorage
const getUserId = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    throw new Error('User not found');
  }
  const user = JSON.parse(userStr);
  return user._id;
};

// Configure axios with auth header
const axiosWithAuth = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
axiosWithAuth.interceptors.request.use(
  (config) => {
    config.headers.Authorization = getAuthToken();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get messages by date range
export const getMessagesByDate = async (startDate, endDate) => {
  try {
    const response = await axiosWithAuth.get(`${API_URL}/messages/by-date`, {
      params: { 
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    if (!messageData.receiverId) {
      throw new Error('Receiver ID is required');
    }

    const response = await axiosWithAuth.post(`${API_URL}/messages/send`, {
      content: messageData.content,
      receiverId: messageData.receiverId
    });
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid receiver ID. Please contact support.');
    }
    throw error;
  }
};

// Mark messages as read
export const markAsRead = async (messageIds) => {
  try {
    const response = await axiosWithAuth.post(`${API_URL}/messages/mark-read`, {
      messageIds: Array.isArray(messageIds) ? messageIds : [messageIds]
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get messages for a thread
export const getMessages = async () => {
  try {
    const userId = getUserId();
    const response = await axiosWithAuth.get(`${API_URL}/messages/thread/${userId}`);
    return response.data.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to view these messages.');
    }
    throw error;
  }
};

// Get unread message count
export const getUnreadCount = async () => {
  try {
    const response = await axiosWithAuth.get(`${API_URL}/messages/unread/count`);
    return response.data;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
}; 