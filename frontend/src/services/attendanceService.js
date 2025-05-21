// frontend/src/services/attendanceService.js

import api from './api';
import { startLocationTracking } from './locationService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://attendance-solution-backend.onrender.com/api';

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Mark attendance (check-in)
export const markAttendance = async (formData) => {
  try {
    console.log('Marking attendance with data:', formData);
    
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Adjust timeout for mobile devices
    const timeout = isMobile ? 30000 : 10000; // 30 seconds for mobile, 10 for desktop
    
    const response = await axios.post(
      `${API_URL}/attendance/mark`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        timeout: timeout,
        // Add retry logic for mobile
        retry: isMobile ? 3 : 1,
        retryDelay: 1000
      }
    );
    
    console.log('Attendance marked successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error marking attendance:', error);
    
    // Enhanced error handling for mobile
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your internet connection and try again.');
    }
    
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }
    
    if (error.response?.status === 413) {
      throw new Error('Image size too large. Please try with a smaller image.');
    }
    
    throw error;
  }
};

// Mark checkout
export const markCheckout = async (location) => {
  try {
    console.log('Marking checkout with location:', location);
    // Format location data to match backend expectations
    const formattedLocation = {
      coordinates: {
        latitude: parseFloat(location.coordinates.latitude),
        longitude: parseFloat(location.coordinates.longitude)
      },
      address: location.address,
      lastUpdated: new Date().toISOString()
    };
    
    console.log('Formatted location data:', formattedLocation);
    const response = await axios.post(
      `${API_URL}/attendance/checkout`,
      { location: formattedLocation },
      getAuthHeader()
    );
    console.log('Checkout marked successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error marking checkout:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    throw error;
  }
};

// Get today's attendance
export const getTodayAttendance = async () => {
  try {
    console.log('Fetching today\'s attendance...');
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await axios.get(`${API_URL}/attendance/today`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('Today\'s attendance:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    throw error;
  }
};

// Get attendance history
export const getAttendanceHistory = async () => {
  try {
    console.log('Fetching attendance history...');
    const response = await axios.get(
      `${API_URL}/attendance/history`,
      getAuthHeader()
    );
    console.log('Attendance history:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    throw error;
  }
};

export const getAttendanceByDate = async (date) => {
  try {
    console.log('Fetching attendance for date:', date);
    const response = await axios.get(
      `${API_URL}/attendance/date/${date}`,
      getAuthHeader()
    );
    console.log('Attendance for date:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance by date:', error);
    throw error;
  }
};

export const exportAttendance = async (startDate, endDate) => {
  try {
    // If endDate is not provided, use the same date as startDate
    if (!endDate) {
      endDate = startDate;
    }

    // Format dates to ISO string
    const formattedStartDate = new Date(startDate).toISOString();
    const formattedEndDate = new Date(endDate).toISOString();

    console.log('Exporting attendance from', formattedStartDate, 'to', formattedEndDate);
    const response = await axios.get(
      `${API_URL}/attendance/export`,
      {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        ...getAuthHeader(),
        responseType: 'blob'
      }
    );
    console.log('Attendance exported successfully');
    return response.data;
  } catch (error) {
    console.error('Error exporting attendance:', error);
    throw error;
  }
};

// Update location for attendance
export const updateAttendanceLocation = async (locationData) => {
  try {
    const response = await axios.put(`${API_URL}/attendance/location`, locationData, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating attendance location:', error);
    throw error;
  }
};

// Start location tracking for attendance
export const startAttendanceLocationTracking = async (attendanceId, onLocationUpdate) => {
  const handleLocationUpdate = async (locationData) => {
    try {
      await updateAttendanceLocation(locationData);
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    } catch (error) {
      // Don't throw error to keep tracking running
    }
  };

  const { start, stop } = await startLocationTracking(handleLocationUpdate);
  
  // Start tracking immediately
  start();

  return {
    start,
    stop,
    updateNow: async () => {
      try {
        await handleLocationUpdate({
          coordinates: await getCurrentLocation(),
          address: 'Updating...',
          lastUpdated: new Date()
        });
      } catch (error) {
        // Don't throw error to keep tracking running
      }
    }
  };
};

// Export all functions
export default {
  markAttendance,
  markCheckout,
  getTodayAttendance,
  getAttendanceHistory,
  getAttendanceByDate,
  exportAttendance,
  updateAttendanceLocation,
  startAttendanceLocationTracking
};
