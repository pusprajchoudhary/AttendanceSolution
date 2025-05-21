import React, { useState, useEffect } from 'react';
import { getActiveNotifications } from '../services/notificationService';
import { toast } from 'react-toastify';

const NotificationBanner = () => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await getActiveNotifications();
        if (response.success) {
          setNotifications(response.notifications);
        }
      } catch (error) {
        toast.error('Failed to fetch notifications');
      }
    };

    fetchNotifications();
  }, []);

  const handleClose = () => {
    setShowNotifications(false);
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-blue-500 text-white p-4 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex-1">
          {notifications.map((notification) => (
            <div key={notification._id} className="mb-2">
              <h3 className="font-bold">{notification.title}</h3>
              <p>{notification.message}</p>
            </div>
          ))}
        </div>
        <button
          onClick={handleClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default NotificationBanner; 