const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  getMessagesByDate,
  markAsRead,
  getUnreadCount
} = require('../controllers/messageController');
const { protect, admin } = require('../middleware/authMiddleware');

// User routes
router.post('/send', protect, sendMessage);
router.get('/thread/:threadId', protect, getMessages);
router.get('/unread/count', protect, getUnreadCount);
router.post('/mark-read', protect, markAsRead);

// Admin routes
router.get('/by-date', protect, admin, getMessagesByDate);

module.exports = router; 