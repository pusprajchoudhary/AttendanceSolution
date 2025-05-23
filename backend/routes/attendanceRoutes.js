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

// Base routes
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

router.post('/checkout', protect, markCheckout);
router.get('/today', protect, getTodayAttendance);
router.get('/export', protect, exportAttendance);

// Routes with parameters
router.get('/date/:date', protect, getAttendanceByDate);
router.get('/:userId/location-history', protect, admin, getUserLocationHistory);
router.put('/location/:recordId', protect, updateAttendanceLocation);

// Error handling middleware
router.use(handleMulterError);

module.exports = router;
