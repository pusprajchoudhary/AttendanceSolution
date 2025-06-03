import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://attendance-solution-backend.onrender.com/api';

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

// Create axios instance with auth header
const axiosWithAuth = axios.create({
  baseURL: API_URL,
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

// Get admin ID with retry logic
export const getAdminId = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} to get admin ID...`);
      const response = await axiosWithAuth.get(`${API_URL}/users/admin`);
      
      console.log('Admin response:', response.data);
      
      if (!response.data?.data?._id) {
        console.error('Invalid admin data received:', response.data);
        throw new Error('Invalid admin data received');
      }

      const adminId = response.data.data._id;
      console.log('Admin ID received:', adminId);
      
      // Validate admin ID format
      if (!/^[0-9a-fA-F]{24}$/.test(adminId)) {
        console.error('Invalid admin ID format:', adminId);
        throw new Error('Invalid admin ID format');
      }

      return adminId;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed to get admin ID:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (i === retries - 1) {
        throw new Error(`Failed to get admin ID after ${retries} attempts: ${error.message}`);
      }
      // Wait for 1 second before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    console.log('Attempting to send message:', {
      hasContent: !!messageData.content,
      hasReceiverId: !!messageData.receiverId,
      receiverId: messageData.receiverId,
      content: messageData.content?.substring(0, 50) // Log first 50 chars
    });

    if (!messageData.content || !messageData.receiverId) {
      throw new Error('Message content and receiver ID are required');
    }

    // Ensure receiverId is a valid MongoDB ObjectId
    if (!/^[0-9a-fA-F]{24}$/.test(messageData.receiverId)) {
      throw new Error('Invalid receiver ID format');
    }

    const response = await axiosWithAuth.post(`${API_URL}/messages/send`, {
      content: messageData.content,
      receiverId: messageData.receiverId
    });

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to send message');
    }

    console.log('Message sent successfully:', {
      messageId: response.data.data._id,
      threadId: response.data.data.threadId,
      sender: response.data.data.sender?.name,
      receiver: response.data.data.receiver?.name
    });

    return response.data.data;
  } catch (error) {
    console.error('Error sending message:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });

    if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid message data');
    }
    if (error.response?.status === 403) {
      throw new Error('You are not authorized to send messages');
    }
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