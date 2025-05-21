import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md">
          <div className="p-4">
            <h2 className="text-xl font-semibold text-gray-800">Admin Menu</h2>
            <nav className="mt-6">
              <div className="space-y-2">
                <Link
                  to="/admin/dashboard"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Dashboard
                </Link>
                <Link
                  to="/admin/users"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Users
                </Link>
                <Link
                  to="/admin/attendance"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Attendance
                </Link>
                <Link
                  to="/admin/leave"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Leave Management
                </Link>
                <Link
                  to="/admin/reports"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Reports
                </Link>
                <Link
                  to="/admin/settings"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Settings
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="py-10">
            <header>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold leading-tight text-gray-900">
                  Admin Panel
                </h1>
              </div>
            </header>
            <main>
              <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                <div className="px-4 py-8 sm:px-0">
                  <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold">Welcome, {user?.name || 'Admin'}</h2>
                        <p className="text-gray-600">This is your admin control panel.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <h3 className="text-lg font-medium">User Management</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              Manage user accounts and permissions
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <h3 className="text-lg font-medium">System Settings</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              Configure system preferences
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                          <div className="p-5">
                            <h3 className="text-lg font-medium">Analytics</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              View system analytics and reports
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 