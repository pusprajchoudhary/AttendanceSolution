import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:5000/api' : 'https://attendance-solution-backend.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
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
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token-related errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
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
    console.log('Attempting login with credentials:', { ...credentials, password: '***' });
    console.log('Making request to:', api.defaults.baseURL + '/auth/login');
    
    const response = await api.post('/auth/login', credentials);
    console.log('Login response:', response.data);
    
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
      console.log('Token stored successfully');
    } else {
      console.warn('No token received in response');
    }
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    if (error.response) {
      console.error('Error response data:', error.response.data);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      // If we have a specific error message from the server, use it
      if (error.response.data && error.response.data.message) {
        throw new Error(error.response.data.message);
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
      console.error('No response received from server');
    } else {
      console.error('Error message:', error.message);
    }
    
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
    console.error('Registration error:', error);
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
      console.error('Logout error:', error);
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
    console.error('Get current user error:', error);
    return null;
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser
};
