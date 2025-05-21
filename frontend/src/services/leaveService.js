import axios from 'axios';
import { getAuthConfig } from '../utils/config';

const API_URL = '/api/leaves';

// Apply for leave
export const applyLeave = async (leaveData) => {
  try {
    const response = await axios.post(API_URL, leaveData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error applying for leave';
  }
};

// Get user's leaves
export const getMyLeaves = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-leaves`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching leaves';
  }
};

// Get all leaves (admin only)
export const getAllLeaves = async () => {
  try {
    const response = await axios.get(`${API_URL}/all`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error fetching all leaves';
  }
};

// Update leave status (admin only)
export const updateLeaveStatus = async (leaveId, updateData) => {
  try {
    const response = await axios.patch(`${API_URL}/${leaveId}`, updateData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error updating leave status';
  }
};

// Delete leave request
export const deleteLeave = async (leaveId) => {
  try {
    const response = await axios.delete(`${API_URL}/${leaveId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error deleting leave request';
  }
}; 