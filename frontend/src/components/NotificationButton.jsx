import React, { useState, useEffect, useRef } from 'react';
import { getActiveNotifications } from '../services/notificationService';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const NotificationButton = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const prevNotificationIds = useRef([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    let intervalId;
    const fetchNotifications = async () => {
      try {
        const response = await getActiveNotifications();
        if (response.success) {
          const latestNotifications = response.notifications.slice(0, 5);
          setNotifications(latestNotifications);

          // Detect new notification
          const newIds = latestNotifications.map(n => n._id);
          if (
            prevNotificationIds.current.length > 0 &&
            newIds[0] &&
            newIds[0] !== prevNotificationIds.current[0]
          ) {
            toast.info('New notification received!');
          }
          prevNotificationIds.current = newIds;
        }
      } catch (error) {
        toast.error('Failed to fetch notifications');
      }
    };

    fetchNotifications();
    intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [user]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    // Handle notification click
    setIsOpen(false);
  };

  // Only render if user is logged in
  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
        aria-label="Notifications"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-x-0 top-auto mx-4 mt-2 sm:absolute sm:inset-auto sm:right-0 sm:w-96 sm:mx-0 bg-white rounded-lg shadow-lg overflow-hidden z-50 max-h-[80vh] overflow-y-auto"
          style={{
            maxWidth: '96vw',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <div className="sticky top-0 bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                    notification.isRead ? 'bg-white' : 'bg-blue-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {notification.title && (
                    <div className="font-bold text-gray-900 mb-1">{notification.title}</div>
                  )}
                  <div className="text-sm text-gray-900">{notification.message}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationButton; 