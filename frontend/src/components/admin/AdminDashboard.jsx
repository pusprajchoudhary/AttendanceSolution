import React, { useState, useEffect } from 'react';
import { FaUsers, FaCalendarCheck, FaChartLine, FaCog } from 'react-icons/fa';
import { BsPersonPlus } from 'react-icons/bs';
import { HiDocumentReport } from 'react-icons/hi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 2458,
    todayAttendance: 186,
    presentPercentage: 78,
    activeSessions: 42
  });

  const [recentCheckins, setRecentCheckins] = useState([
    { id: 1, name: 'John Smith', time: '9:15 AM', status: 'Present' },
    { id: 2, name: 'Emily Johnson', time: '9:20 AM', status: 'Present' },
    { id: 3, name: 'Michael Brown', time: '9:30 AM', status: 'Late' },
    { id: 4, name: 'Sarah Davis', time: '9:35 AM', status: 'Present' },
    { id: 5, name: 'Robert Wilson', time: '9:40 AM', status: 'Late' }
  ]);

  const [departmentStats, setDepartmentStats] = useState([
    { name: 'Engineering', present: 45, absent: 3, late: 2 },
    { name: 'Marketing', present: 35, absent: 2, late: 3 },
    { name: 'Sales', present: 25, absent: 1, late: 2 },
    { name: 'HR', present: 15, absent: 1, late: 1 },
    { name: 'Finance', present: 20, absent: 2, late: 0 }
  ]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">Admin User</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<FaUsers className="text-blue-500" />}
          trend="+5.7%"
        />
        <StatsCard
          title="Today's Attendance"
          value={stats.todayAttendance}
          icon={<FaCalendarCheck className="text-green-500" />}
          trend="+2.1%"
        />
        <StatsCard
          title="Present Percentage"
          value={`${stats.presentPercentage}%`}
          icon={<FaChartLine className="text-purple-500" />}
          trend="-0.5%"
        />
        <StatsCard
          title="Active Sessions"
          value={stats.activeSessions}
          icon={<FaCog className="text-orange-500" />}
          trend="+1.2%"
        />
      </div>

      {/* Attendance Monitoring */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Recent Check-ins</h2>
          <div className="space-y-4">
            {recentCheckins.map((checkin) => (
              <div key={checkin.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-medium">{checkin.name}</p>
                    <p className="text-sm text-gray-500">{checkin.time}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  checkin.status === 'Present' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  {checkin.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Location Map</h2>
          <div className="bg-blue-100 h-64 rounded-lg flex items-center justify-center">
            <p className="text-blue-500">Interactive map available in full version</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-4">
            <QuickActionButton
              icon={<BsPersonPlus />}
              text="Add New User"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={<HiDocumentReport />}
              text="Export Reports"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={<FaCalendarCheck />}
              text="Add Holiday"
              onClick={() => {}}
            />
            <QuickActionButton
              icon={<FaCog />}
              text="System Settings"
              onClick={() => {}}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold mb-4">Department Statistics</h2>
          {departmentStats.map((dept, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{dept.name}</span>
                <span className="text-sm text-gray-500">
                  {dept.present + dept.absent + dept.late} total
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(dept.present / (dept.present + dept.absent + dept.late)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className="p-3 bg-gray-100 rounded-lg">{icon}</div>
    </div>
    <p className={`text-sm ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
      {trend} vs last week
    </p>
  </div>
);

const QuickActionButton = ({ icon, text, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
  >
    <span className="p-2 bg-gray-100 rounded-lg">{icon}</span>
    <span className="font-medium">{text}</span>
  </button>
);

export default AdminDashboard; 