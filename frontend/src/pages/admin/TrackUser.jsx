import React, { useState } from 'react';
import { getUsers } from '../../services/userService';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TrackUser = () => {
  const [search, setSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    setError('');
    setUserResults([]);
    setSelectedUser(null);
    setLocationHistory([]);
    if (!search.trim()) return;
    setLoading(true);
    try {
      const users = await getUsers();
      const filtered = users.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
      setUserResults(filtered);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setLocationHistory([]);
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/attendance/${user._id}/location-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocationHistory(res.data.locationHistory || []);
    } catch (err) {
      setError('Failed to fetch location history');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Track User</h2>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search user by name or email..."
          className="w-full border rounded px-3 py-2"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Search
        </button>
      </div>
      {loading && <div className="mb-2 text-gray-500">Loading...</div>}
      {error && <div className="mb-2 text-red-500">{error}</div>}
      {userResults.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Select a user:</h3>
          <ul className="divide-y divide-gray-200">
            {userResults.map(user => (
              <li key={user._id} className="py-2 cursor-pointer hover:bg-gray-100 px-2 rounded" onClick={() => handleSelectUser(user)}>
                <span className="font-medium">{user.name}</span> <span className="text-gray-500">({user.email})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedUser && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Location History for {selectedUser.name} ({selectedUser.email})</h3>
          <ul className="divide-y divide-gray-200">
            {locationHistory.length === 0 ? (
              <li className="py-2 text-gray-500">No location history found.</li>
            ) : (
              locationHistory.map((loc, idx) => (
                <li key={idx} className="py-2">
                  <div><span className="font-semibold">Time:</span> {new Date(loc.lastUpdated).toLocaleString()}</div>
                  <div><span className="font-semibold">Address:</span> {loc.address}</div>
                  <div><span className="font-semibold">Coordinates:</span> {loc.coordinates.latitude}, {loc.coordinates.longitude}</div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackUser; 