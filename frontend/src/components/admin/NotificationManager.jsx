import React, { useState, useEffect } from 'react';
import {
  createNotification,
  getAllNotifications,
  updateNotificationStatus,
  deleteNotification,
} from '../../services/notificationService';
import { toast } from 'react-toastify';

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    type: 'announcement',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await getAllNotifications();
      if (response.success) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      toast.error('Failed to fetch notifications');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const response = await createNotification(newNotification);
      if (response.success) {
        toast.success('Notification created successfully');
        setNewNotification({ title: '', message: '', type: 'announcement' });
        fetchNotifications();
      } else {
        setFormError(response.error || 'Failed to create notification');
      }
    } catch (error) {
      let errorMsg = 'Failed to create notification';
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = 'Unauthorized: Please log in as an admin.';
        } else if (error.response.status === 403) {
          errorMsg = 'Forbidden: Only admins can send notifications.';
        } else if (error.response.data && error.response.data.error) {
          errorMsg = error.response.data.error;
        }
      }
      setFormError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleStatusChange = async (id, isActive) => {
    try {
      const response = await updateNotificationStatus(id, isActive);
      if (response.success) {
        toast.success('Notification status updated');
        fetchNotifications();
      }
    } catch (error) {
      toast.error('Failed to update notification status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        const response = await deleteNotification(id);
        if (response.success) {
          toast.success('Notification deleted successfully');
          fetchNotifications();
        }
      } catch (error) {
        toast.error('Failed to delete notification');
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Notifications</h2>

      {/* Create Notification Form */}
      <form onSubmit={handleSubmit} className="mb-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Create New Notification</h3>
        {formError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={newNotification.title}
              onChange={(e) =>
                setNewNotification({ ...newNotification, title: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={newNotification.type}
              onChange={(e) =>
                setNewNotification({ ...newNotification, type: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="announcement">Announcement</option>
              <option value="policy">Policy</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Message</label>
          <textarea
            value={newNotification.message}
            onChange={(e) =>
              setNewNotification({ ...newNotification, message: e.target.value })
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            required
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Create Notification
        </button>
      </form>

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h3 className="text-lg font-semibold p-6 border-b">Existing Notifications</h3>
        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div key={notification._id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    {notification.title}
                  </h4>
                  <p className="text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Type: {notification.type} | Created:{' '}
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() =>
                      handleStatusChange(notification._id, !notification.isActive)
                    }
                    className={`px-3 py-1 rounded-md text-sm ${
                      notification.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {notification.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationManager; 