const express = require('express');
const { 
  markAttendance, 
  getAttendanceByDate, 
  exportAttendance, 
  getTodayAttendance, 
  updateAttendanceLocation,
  markCheckout,
  getUserLocationHistory
} = require('../controllers/attendanceController');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  next(err);
};

// POST: Mark attendance with photo upload
router.post('/mark', 
  protect, 
  upload.single('image'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image' });
    }
    next();
  },
  markAttendance
);

// POST: Mark checkout
router.post('/checkout', protect, markCheckout);

// GET: Get attendance data for a specific date
router.get('/date/:date', protect, getAttendanceByDate);

// GET: Export attendance data to Excel
router.get('/export', protect, exportAttendance);

// GET: Get today's attendance
router.get('/today', protect, getTodayAttendance);

// PUT: Update attendance location
router.put('/:id/location', protect, updateAttendanceLocation);

// GET: Get location history for a user for today (admin only)
router.get('/:userId/location-history', protect, admin, getUserLocationHistory);

// PUT: Update attendance location (for periodic updates)
router.put('/location', protect, require('../controllers/attendanceController').updateAttendanceLocation);

// Error handling middleware
router.use(handleMulterError);

module.exports = router;
