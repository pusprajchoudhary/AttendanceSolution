// Helper function to get auth configuration with token
export const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

// Helper function to get auth configuration with multipart form data (for file uploads)
export const getAuthConfigMultipart = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
}; 