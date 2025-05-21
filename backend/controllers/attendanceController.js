const Attendance = require('../models/AttendanceModel');
const User = require('../models/UserModel');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const axios = require('axios');

// Function to get address from coordinates using OpenStreetMap Nominatim
const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://nominatim.openstreetmap.org/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'Attendance-System/1.0'
      }
    });

    if (response.data && response.data.address) {
      const address = response.data.address;
      let formattedAddress = '';

      // Build address string from available components
      if (address.road) formattedAddress += address.road + ', ';
      if (address.suburb) formattedAddress += address.suburb + ', ';
      if (address.city) formattedAddress += address.city + ', ';
      if (address.state) formattedAddress += address.state + ', ';
      if (address.country) formattedAddress += address.country;

      // Remove trailing comma and space if present
      formattedAddress = formattedAddress.replace(/,\s*$/, '');

      return formattedAddress || `${latitude}, ${longitude}`;
    }
    return `${latitude}, ${longitude}`;
  } catch (error) {
    console.error('Error getting address from coordinates:', error);
    return `${latitude}, ${longitude}`;
  }
};

const markAttendance = async (req, res) => {
  try {
    console.log('Received attendance request:', {
      body: req.body,
      file: req.file,
      user: req.user
    });

    // Check if user is authenticated
    if (!req.user || !req.user._id) {
      console.error('User not authenticated');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { location } = req.body;
    const user = req.user._id;
    const photo = req.file ? req.file.filename : null;

    // Parse location from FormData fields if not a JSON string
    let parsedLocation;
    if (location && typeof location === 'string') {
      try {
        parsedLocation = JSON.parse(location);
      } catch (e) {
        // If parsing fails, fallback to old structure
        parsedLocation = null;
      }
    } else if (
      req.body['location[coordinates][latitude]'] &&
      req.body['location[coordinates][longitude]'] &&
      req.body['location[address]'] &&
      req.body['location[lastUpdated]']
    ) {
      parsedLocation = {
        coordinates: {
          latitude: req.body['location[coordinates][latitude]'],
          longitude: req.body['location[coordinates][longitude]']
        },
        address: req.body['location[address]'],
        lastUpdated: req.body['location[lastUpdated]']
      };
    } else {
      parsedLocation = location;
    }

    // Validate required fields
    if (!parsedLocation || !photo) {
      console.log('Missing required fields:', {
        location: !parsedLocation ? 'missing' : 'present',
        photo: !photo ? 'missing' : 'present'
      });
      return res.status(400).json({ 
        message: 'Location and photo are required',
        details: {
          location: !parsedLocation ? 'Location is required' : undefined,
          photo: !photo ? 'Photo is required' : undefined
        }
      });
    }

    // Check if user has already marked attendance today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      user,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'checked-in'
    });

    if (existingAttendance) {
      console.log('User already has active check-in:', existingAttendance);
      return res.status(400).json({ 
        message: 'Already checked in for today',
        attendance: existingAttendance
      });
    }

    // Get human-readable address from coordinates
    const address = await getAddressFromCoordinates(
      parsedLocation.coordinates.latitude,
      parsedLocation.coordinates.longitude
    );

    // Create a new attendance record
    const newAttendance = new Attendance({
      user,
      location: {
        coordinates: {
          latitude: parseFloat(parsedLocation.coordinates.latitude),
          longitude: parseFloat(parsedLocation.coordinates.longitude)
        },
        address: address,
        lastUpdated: new Date(parsedLocation.lastUpdated)
      },
      photo,
      timestamp: new Date(),
      status: 'checked-in',
      hoursWorked: 0,
      checkOutTime: null
    });

    console.log('Creating new attendance record:', {
      user: newAttendance.user,
      timestamp: newAttendance.timestamp,
      status: newAttendance.status
    });

    await newAttendance.save();

    res.status(201).json({ 
      message: 'Attendance marked successfully',
      attendance: {
        id: newAttendance._id,
        timestamp: newAttendance.timestamp,
        status: newAttendance.status,
        location: newAttendance.location,
        photo: newAttendance.photo
      }
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({ 
      message: 'Error marking attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.params;
    console.log('Received date parameter:', date);
    
    // Parse the date string and set it to local midnight
    const startOfDay = new Date(date);
    if (isNaN(startOfDay.getTime())) {
      console.error('Invalid date format:', date);
      return res.status(400).json({ message: 'Invalid date format' });
    }
    
    // Set to start of day in local timezone
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    console.log('Searching for attendance between:', {
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    });

    // First, check if the database is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('Database is not connected. Current state:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Try to find attendance records
    const attendanceLogs = await Attendance.find({
      timestamp: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    .populate({
      path: 'user',
      select: 'name email'
    })
    .sort({ timestamp: -1 })
    .lean(); // Use lean() for better performance

    console.log('Found attendance logs:', attendanceLogs.length);

    // Transform the data to include location history
    const transformedLogs = attendanceLogs.map(log => {
      try {
        const locationHistory = [];
        if (log.location) {
          locationHistory.push({
            time: log.location.lastUpdated,
            address: log.location.address,
            coordinates: log.location.coordinates
          });
        }

        return {
          ...log,
          locationHistory
        };
      } catch (transformError) {
        console.error('Error transforming log:', transformError);
        return {
          ...log,
          locationHistory: [],
          error: 'Error processing location data'
        };
      }
    });

    res.json(transformedLogs);
  } catch (error) {
    console.error('Error in getAttendanceByDate:', error);
    console.error('Error stack:', error.stack);
    
    // Check if it's a database error
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ 
        message: 'Database error occurred',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Check if it's a validation error
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // Generic error
    res.status(500).json({ 
      message: 'Error fetching attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const exportAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log('Starting attendance export for date range:', { startDate, endDate });

    if (!startDate) {
      return res.status(400).json({ message: 'Start date is required' });
    }

    // Parse and validate dates
    const startOfRange = new Date(startDate);
    const endOfRange = endDate ? new Date(endDate) : new Date(startDate);

    if (isNaN(startOfRange.getTime()) || isNaN(endOfRange.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Set to start of day in UTC
    startOfRange.setUTCHours(0, 0, 0, 0);
    endOfRange.setUTCHours(23, 59, 59, 999);

    console.log('Query date range:', {
      startOfRange: startOfRange.toISOString(),
      endOfRange: endOfRange.toISOString()
    });

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Database connection not ready. State:', mongoose.connection.readyState);
      return res.status(500).json({ message: 'Database connection error' });
    }

    // Fetch attendance records with user details
    const attendanceRecords = await Attendance.find({
      timestamp: {
        $gte: startOfRange,
        $lte: endOfRange
      }
    })
    .populate({
      path: 'user',
      select: 'name email',
      model: 'User'
    })
    .lean()
    .exec();

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return res.status(404).json({ message: 'No attendance records found for the specified date range' });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Attendance System';
    workbook.lastModifiedBy = 'Attendance System';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Add worksheet
    const worksheet = workbook.addWorksheet('Attendance');

    // Add headers
    worksheet.columns = [
      { header: 'Employee Name', key: 'name', width: 20 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Check In Time', key: 'checkIn', width: 20 },
      { header: 'Check Out Time', key: 'checkOut', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Hours Worked', key: 'hoursWorked', width: 15 },
      { header: 'Location', key: 'location', width: 30 }
    ];

    // Add data
    attendanceRecords.forEach(record => {
      worksheet.addRow({
        name: record.user?.name || 'N/A',
        email: record.user?.email || 'N/A',
        checkIn: new Date(record.timestamp).toLocaleString(),
        checkOut: record.checkOutTime ? new Date(record.checkOutTime).toLocaleString() : 'N/A',
        status: record.status,
        hoursWorked: record.hoursWorked || 0,
        location: record.location?.address || 'N/A'
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=attendance_${startDate}_to_${endDate || startDate}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting attendance:', error);
    res.status(500).json({ 
      message: 'Error exporting attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user's location for today's attendance record
// @route   PUT /api/attendance/location
// @access  Private
const updateAttendanceLocation = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's attendance record for the user
    const attendance = await Attendance.findOne({
      user: req.user._id,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today.' });
    }

    // Get human-readable address from coordinates
    const address = await getAddressFromCoordinates(
      req.body.coordinates.latitude,
      req.body.coordinates.longitude
    );

    // Update the location
    attendance.location = {
      coordinates: {
        latitude: req.body.coordinates.latitude,
        longitude: req.body.coordinates.longitude
      },
      address: address,
      lastUpdated: new Date()
    };

    // Push to locationHistory
    attendance.locationHistory = attendance.locationHistory || [];
    attendance.locationHistory.push({
      coordinates: {
        latitude: req.body.coordinates.latitude,
        longitude: req.body.coordinates.longitude
      },
      address: address,
      lastUpdated: new Date()
    });

    await attendance.save();

    res.json({
      message: 'Location updated successfully',
      attendance: attendance
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

// @desc    Get today's attendance
// @route   GET /api/attendance/today
// @access  Private
const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log('Getting today\'s attendance for user:', userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Date range:', {
      start: today.toISOString(),
      end: tomorrow.toISOString()
    });

    const attendanceLogs = await Attendance.find({
      user: userId,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .sort({ timestamp: -1 })
    .populate('user', 'name email');

    console.log('Found attendance logs:', {
      count: attendanceLogs.length,
      logs: attendanceLogs.map(log => ({
        id: log._id,
        timestamp: log.timestamp,
        status: log.status
      }))
    });

    res.json(attendanceLogs);
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({ 
      message: 'Error fetching attendance data',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const markCheckout = async (req, res) => {
  try {
    const user = req.user._id;
    const { location } = req.body;

    console.log('Checkout request for user:', user);
    console.log('Location data:', location);

    // Validate location structure
    if (!location || !location.coordinates || !location.coordinates.latitude || !location.coordinates.longitude) {
      return res.status(400).json({ 
        message: 'Invalid location data',
        details: {
          coordinates: !location?.coordinates ? 'Coordinates are required' : undefined,
          latitude: !location?.coordinates?.latitude ? 'Latitude is required' : undefined,
          longitude: !location?.coordinates?.longitude ? 'Longitude is required' : undefined
        }
      });
    }

    // Get human-readable address from coordinates
    const address = await getAddressFromCoordinates(
      location.coordinates.latitude,
      location.coordinates.longitude
    );

    // Find today's check-in record
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log('Searching for attendance between:', {
      today: today.toISOString(),
      tomorrow: tomorrow.toISOString(),
      user: user
    });

    // Find the active check-in
    const attendanceRecord = await Attendance.findOne({
      user: user,
      timestamp: {
        $gte: today,
        $lt: tomorrow
      },
      status: { $ne: 'checked-out' } // Find record that is not checked out
    }).sort({ timestamp: -1 });

    console.log('Found attendance record:', attendanceRecord);

    if (!attendanceRecord) {
      return res.status(400).json({ 
        message: 'No active check-in found for today',
        details: {
          user,
          dateRange: {
            start: today,
            end: tomorrow
          }
        }
      });
    }

    // Calculate hours worked
    const checkOutTime = new Date();
    const hoursWorked = (checkOutTime - attendanceRecord.timestamp) / (1000 * 60 * 60);

    console.log('Updating attendance record:', {
      id: attendanceRecord._id,
      checkInTime: attendanceRecord.timestamp,
      checkOutTime: checkOutTime,
      hoursWorked: hoursWorked
    });

    // Update the attendance record
    attendanceRecord.checkOutTime = checkOutTime;
    attendanceRecord.status = 'checked-out';
    attendanceRecord.hoursWorked = parseFloat(hoursWorked.toFixed(2));
    attendanceRecord.location = {
      coordinates: {
        latitude: parseFloat(location.coordinates.latitude),
        longitude: parseFloat(location.coordinates.longitude)
      },
      address: address,
      lastUpdated: new Date()
    };

    await attendanceRecord.save();
    console.log('Updated attendance record:', attendanceRecord);

    res.status(200).json({
      message: 'Checkout successful',
      attendance: {
        id: attendanceRecord._id,
        checkInTime: attendanceRecord.timestamp,
        checkOutTime: attendanceRecord.checkOutTime,
        hoursWorked: attendanceRecord.hoursWorked,
        location: attendanceRecord.location,
        status: attendanceRecord.status
      }
    });
  } catch (error) {
    console.error('Error marking checkout:', error);
    res.status(500).json({ 
      message: 'Error marking checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get location history for a user for today
// @route   GET /api/attendance/:userId/location-history
// @access  Admin
const getUserLocationHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Find today's attendance record for the user
    const attendance = await Attendance.findOne({
      user: userId,
      timestamp: { $gte: today, $lt: tomorrow }
    });

    if (!attendance) {
      return res.status(404).json({ message: 'No attendance record found for today.' });
    }

    res.json({
      user: attendance.user,
      locationHistory: attendance.locationHistory || []
    });
  } catch (error) {
    console.error('Error fetching user location history:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByDate,
  getTodayAttendance,
  exportAttendance,
  updateAttendanceLocation,
  markCheckout,
  getUserLocationHistory
};
