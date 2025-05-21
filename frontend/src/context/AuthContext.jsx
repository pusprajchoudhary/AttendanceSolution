import React, { createContext, useState, useContext, useEffect } from 'react';
import { login, register, logout, getCurrentUser } from '../services/authService';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        // Check for stored credentials first
        const storedCredentials = localStorage.getItem('rememberedCredentials');
        if (storedCredentials) {
          const { email, password } = JSON.parse(storedCredentials);
          const data = await login({ email, password });
          if (data && !data.user.isBlocked) {
            setUser(data.user);
            return;
          }
        }

        // If no stored credentials or login failed, try normal session
        const userData = await getCurrentUser();
        if (userData && userData.isBlocked) {
          setUser(null);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('rememberedCredentials');
          setError('Your account has been blocked. Please contact the administrator.');
        } else {
          setUser(userData);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const loginUser = async (credentials) => {
    try {
      setError(null);
      const data = await login(credentials);
      
      // Check if user is blocked
      if (data.user.isBlocked) {
        setError('Your account has been blocked. Please contact the administrator.');
        return { isBlocked: true };
      }
      
      // Handle remember me
      if (credentials.rememberMe) {
        localStorage.setItem('rememberedCredentials', JSON.stringify({
          email: credentials.email,
          password: credentials.password
        }));
      } else {
        localStorage.removeItem('rememberedCredentials');
      }
      
      setUser(data.user);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Your account has been blocked. Please contact the administrator.');
        return { isBlocked: true };
      } else {
        setError(error.response?.data?.message || 'Login failed');
        toast.error(error.response?.data?.message || 'Login failed');
      }
      throw error;
    }
  };

  const registerUser = async (userData) => {
    try {
      setError(null);
      const response = await register(userData);
      // Immediately log in with the new credentials to refresh context
      const loginResponse = await login({ email: userData.email, password: userData.password });
      setUser(loginResponse.user);
      toast.success('Registration successful!');
      return loginResponse;
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logoutUser = async () => {
    try {
      await logout();
      setUser(null);
      setError(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't remove remembered credentials on logout if remember me was checked
      toast.success('Logged out successfully!');
    } catch (error) {
      setError(error.message);
      toast.error('Logout failed. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    error,
    loginUser,
    registerUser,
    logoutUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 