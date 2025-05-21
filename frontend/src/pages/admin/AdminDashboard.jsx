import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserAddModal from '../../components/admin/UserAddModal';
import { getUsers, toggleUserStatus, deleteUser } from '../../services/userService';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { getAttendanceByDate, exportAttendance } from '../../services/attendanceService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { sendNotification } from '../../services/notificationService';
import TrackUser from './TrackUser';
import AdminChat from '../../components/admin/chat/AdminChat';

const formatDate = (date) => {
  try {
    if (!date || isNaN(new Date(date).getTime())) {
      return 'Invalid date';
    }
    return format(new Date(date), 'hh:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

const formatLocation = (location) => {
  if (!location) return 'Location not available';
  
  if (location.address) {
    return location.address;
  }
  
  if (location.coordinates) {
    return `${location.coordinates.latitude}, ${location.coordinates.longitude}`;
  }
  
  return 'Location not available';
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState('');
  const { user, logoutUser, loading } = useAuth();

  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Location tracking state
  const [locationHistory, setLocationHistory] = useState({});

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Notification state
  const [notificationMsg, setNotificationMsg] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationType, setNotificationType] = useState('announcement');
  const [sending, setSending] = useState(false);

  // Theme state
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'light';
    }
    return 'light';
  });

  // Update active section based on URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path && path !== 'admin') {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!loading) {
        if (!user || user.role !== 'admin') {
          navigate('/login');
          return;
        }
        try {
          await fetchUsers();
        } catch (error) {
          console.error('Error fetching users:', error);
          setError('Failed to fetch users. Please try again.');
        }
      }
    };

    checkAuth();
  }, [user, loading, navigate]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    }
  };

  const fetchAttendanceData = async (date) => {
    try {
      setAttendanceLoading(true);
      const data = await getAttendanceByDate(date);
      setAttendanceLogs(data);
      
      // Group location history by user
      const history = {};
      data.forEach(log => {
        if (log.location) {
          if (!history[log.user._id]) {
            history[log.user._id] = [];
          }
          history[log.user._id].push({
            time: new Date(log.location.lastUpdated),
            address: log.location.address,
            coordinates: log.location.coordinates
          });
        }
      });
      setLocationHistory(history);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendanceData(selectedDate);
    }
  }, [activeTab, selectedDate]);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleUserAdded = (newUser) => {
    setUsers([...users, newUser]);
  };

  const handleDateChange = async (date) => {
    setSelectedDate(date);
    setAttendanceLoading(true);
    try {
      const logs = await getAttendanceByDate(date);
      setAttendanceLogs(logs);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleExportAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const blob = await exportAttendance(selectedDate);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${format(selectedDate, 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Attendance data exported successfully');
    } catch (error) {
      console.error('Error exporting attendance:', error);
      toast.error('Failed to export attendance data');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus, userRole) => {
    try {
      // Prevent blocking admin users on the frontend
      if (userRole === 'admin') {
        toast.error('Cannot block admin users');
        return;
      }

      await toggleUserStatus(userId);
      // Refresh the users list
      fetchUsers();
      toast.success(`User has been ${currentStatus ? 'unblocked' : 'blocked'} successfully`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.message || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user._id !== userId));
        toast.success('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error(error.message);
      }
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notificationTitle.trim() || !notificationMsg.trim() || !notificationType) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    try {
      await sendNotification({
        title: notificationTitle,
        message: notificationMsg,
        type: notificationType
      });
      toast.success('Notification sent successfully!');
      setNotificationTitle('');
      setNotificationMsg('');
      setNotificationType('announcement');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.error || 'Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'attendance', label: 'Attendance', icon: '📝' },
    { id: 'policies', label: 'Policies', icon: '📢' },
    { id: 'trackuser', label: 'Track User', icon: '🛰️' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'chat', label: 'Messages', icon: '💬' },
  ];

  // Add mobile menu toggle handler
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close mobile menu when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">+{users.filter(u => !u.isBlocked).length} Active</span>
                  <span className="text-sm text-red-600 ml-2">+{users.filter(u => u.isBlocked).length} Blocked</span>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Admin Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'admin').length}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">System Administrators</span>
                </div>
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Regular Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.role === 'user').length}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-500">Standard Users</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{user.role}</p>
                      <p className={`text-xs ${user.isBlocked ? 'text-red-600' : 'text-green-600'}`}>
                        {user.isBlocked ? 'Blocked' : 'Active'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-4 md:p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Add New User</span>
                </button>

                <button
                  onClick={() => setActiveTab('attendance')}
                  className="flex items-center justify-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">View Attendance</span>
                </button>

                <button
                  onClick={() => setActiveTab('policies')}
                  className="flex items-center justify-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">Send Announcement</span>
                </button>
              </div>
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.name}
                    </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.role}
                    </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(user._id, user.isBlocked, user.role)}
                            className={`px-2 py-1 rounded-md text-sm ${
                              user.isBlocked 
                                ? 'bg-green-600 text-white hover:bg-green-700' 
                                : 'bg-red-600 text-white hover:bg-red-700'
                            }`}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-2 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        );
      case 'attendance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Calendar</h2>
                <Calendar
                  onChange={handleDateChange}
                  value={selectedDate}
                  className="w-full border-none"
                />
              </div>

              <div className="bg-white p-4 md:p-6 rounded-lg shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                  <h2 className="text-xl font-semibold mb-2 md:mb-0">
                    Attendance Logs for {format(selectedDate, 'MMMM d, yyyy')}
                  </h2>
                  <button
                    onClick={handleExportAttendance}
                    disabled={attendanceLoading || attendanceLogs.length === 0}
                    className="w-full md:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {attendanceLoading ? 'Exporting...' : 'Export Attendance'}
                  </button>
                </div>
                
                {attendanceLoading ? (
                  <div className="text-center py-4">Loading...</div>
                ) : attendanceLogs.length > 0 ? (
                  <div className="space-y-4">
                    {attendanceLogs.map((log) => (
                      <div key={log._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex items-start space-x-4">
                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                              <img 
                                src={`http://localhost:5000/api/uploads/${log.photo}`} 
                                alt={`${log.user?.name}'s attendance`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.error('Error loading image:', e);
                                  e.target.onerror = null;
                                  e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(log.user?.name || 'User') + '&background=random';
                                }}
                              />
                            </div>
                            <div>
                              <h3 className="font-semibold">{log.user?.name}</h3>
                              <p className="text-sm text-gray-600">
                                Time: {formatDate(log.timestamp)}
                              </p>
                              <div className="mt-2">
                                <p className="text-sm text-gray-600">
                                  Location: {formatLocation(log.location)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Last Updated: {log.location?.lastUpdated ? new Date(log.location.lastUpdated).toLocaleTimeString() : 'N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    No attendance records found for this date
                  </div>
                )}
              </div>
            </div>

            {/* Attendance History Table */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Attendance History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceLogs.map((record) => (
                      <tr key={record._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {/* <div className="h-10 w-10 flex-shrink-0">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={record.user?.profileImage || '/default-avatar.png'}
                                alt=""
                              />
                            </div> */}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {record.user?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.user?.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(record.timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'Not checked out'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatLocation(record.location)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            record.checkOutTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {record.checkOutTime ? 'Completed' : 'In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'policies':
        return (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">Policies & Announcements</h2>
            <form onSubmit={handleSendNotification} className="mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={notificationTitle}
                  onChange={e => setNotificationTitle(e.target.value)}
                  placeholder="Enter notification title"
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              
              {/* To add Type Section just uncomment the below code */}
              
              <div>
                {/* <label className="block text-sm font-medium text-gray-700 mb-1">Type</label> */}
                {/* <select */}
                  {/* value={notificationType}
                  onChange={e => setNotificationType(e.target.value)}
                  // className="w-full border rounded px-3 py-2"
                > */}
                  {/* <option value="announcement">Announcement</option>
                  <option value="policy">Policy</option> */}
                {/* </select> */}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={notificationMsg}
                  onChange={e => setNotificationMsg(e.target.value)}
                  placeholder="Enter notification message"
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  required
                />
              </div>
              <button 
                type="submit" 
                className="bg-red-600 text-white px-4 py-2 rounded" 
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Notification'}
              </button>
            </form>
          </div>
        );
      case 'trackuser':
        return <TrackUser />;
      case 'settings':
        return (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 dark:text-gray-200">Dark Mode</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={theme === 'dark'}
                    onChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {theme === 'dark' ? 'On' : 'Off'}
                  </span>
                </label>
              </div>
            </div>
          </div>
        );
      case 'chat':
        return <AdminChat />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMobileMenu}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg"
      >
        <svg
          className="w-6 h-6 text-gray-600 dark:text-gray-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isMobileMenuOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out`}
      >
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 768) {
                  setIsMobileMenuOpen(false);
                  setIsSidebarOpen(false);
                }
              }}
              className={`flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                activeTab === item.id ? 'bg-red-50 dark:bg-gray-700 text-red-600 dark:text-red-400' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2 md:mb-0">
              {sidebarItems.find(item => item.id === activeTab)?.label}
            </h2>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full md:w-auto px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Add User
              </button>
              <button
                onClick={handleLogout}
                className="w-full md:w-auto px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      {/* User Add Modal */}
      <UserAddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
};

export default AdminDashboard;
