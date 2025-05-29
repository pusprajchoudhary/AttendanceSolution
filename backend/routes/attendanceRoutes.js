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

const upload = multer({ storage: storage });

// Error handling middleware for multer (still useful for file type/size errors)
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer errors (like file size limits) will still be caught here
    return res.status(400).json({ message: err.message });
  } else if (err) {
    // Other potential errors during upload
    return res.status(500).json({ message: 'File upload failed', error: err.message });
  }
  next();
};

// Base routes
router.post('/mark', 
  protect, 
  upload.single('image'),
  (req, res, next) => {
    // Multer upload errors should be handled by handleMulterError middleware
    if (!req.file) {
       // If upload failed and no error from Multer, it could be a different issue, but 
       // CloudinaryStorage usually throws an error captured by middleware.
       // Keep this check for robustness, though handleMulterError is primary.
       if (!req.multerError) { // Avoid sending duplicate error if multerError is set
          return res.status(400).json({ message: 'Image upload failed or no image provided.' });
       }
    }
    // If req.file exists, upload to Cloudinary was successful
    // The file object now contains Cloudinary details, including secure_url
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

// Error handling middleware for Multer and others
router.use(handleMulterError);

module.exports = router;
