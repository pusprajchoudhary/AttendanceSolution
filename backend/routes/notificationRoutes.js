const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth, isAdmin } = require('../middleware/auth');

// User routes
router.get('/active', auth, notificationController.getActiveNotifications);
router.get('/latest', auth, notificationController.getLatestNotification);
router.put('/:notificationId/read', auth, notificationController.markAsRead);

// Admin routes
router.post('/', isAdmin, notificationController.createNotification);
router.get('/', isAdmin, notificationController.getAllNotifications);
router.put('/:id/status', isAdmin, notificationController.updateNotificationStatus);
router.delete('/:id', isAdmin, notificationController.deleteNotification);

module.exports = router; 