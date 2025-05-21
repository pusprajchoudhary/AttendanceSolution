import axios from "axios";

// Use environment variable for API URL or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Enable sending cookies
});

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
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// login
export const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials);
    
    // Check if user is blocked before storing token
    if (response.data.user.isBlocked) {
      throw {
        response: {
          status: 403,
          data: {
            message: 'Your account has been blocked by the administrator. Please contact support.'
          }
        }
      };
    }
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    // Handle blocked user error
    if (error.response?.status === 403) {
      // Clear any existing auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Rethrow with the server's message or a default message
      throw {
        response: {
          status: 403,
          data: {
            message: error.response.data.message || 'Your account has been blocked. Please contact support.'
          }
        }
      };
    }
    
    throw error;
  }
};

// register
export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error;
  }
};

// logout
export const logout = async () => {
  try {
    // Try to call the backend logout endpoint
    await api.post('/auth/logout');
  } catch (error) {
    // If the endpoint is not found (404), we'll still proceed with local logout
    if (error.response?.status !== 404) {
      throw error;
    }
  } finally {
    // Always clear local storage and remove token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// get current user
export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    return null;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser
};
