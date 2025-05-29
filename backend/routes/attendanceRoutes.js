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
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'attendance_photos', // Optional: folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage }).single('image');

// Error handling middleware for multer (still useful for file type/size errors)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer errors (like file size limits) will still be caught here
    console.error('Multer Error:', err.message);
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Other potential errors during upload (e.g., Cloudinary errors)
    console.error('File upload failed:', err.message);
    return res.status(500).json({ message: 'File upload failed', error: err.message });
  }
  next();
};

// Base routes
router.post('/mark', 
  protect, 
  (req, res, next) => {
    upload(req, res, function (err) {
      if (err) {
        // Pass Multer/Cloudinary errors to the error handling middleware
        req.multerError = err; // Attach error to request for middleware
        return handleMulterError(err, req, res, next);
      }
      // If req.file is undefined but no Multer error, it could be a non-Multer issue or no file sent
      if (!req.file) {
         return res.status(400).json({ message: 'Image upload failed or no image provided.' });
      }
      next(); // Proceed to markAttendance controller
    });
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

// Error handling middleware for Multer and others
router.use(handleMulterError);

module.exports = router;
