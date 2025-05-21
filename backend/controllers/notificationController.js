const Notification = require('../models/Notification');

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    console.log('Creating notification with data:', { title, message, type });
    
    // Validate required fields
    if (!title || !message || !type) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ 
        success: false, 
        error: 'Title, message, and type are required' 
      });
    }

    // Validate notification type
    if (!['announcement', 'policy'].includes(type)) {
      console.log('Validation failed: Invalid notification type');
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification type. Must be either "announcement" or "policy"' 
      });
    }

    const notification = new Notification({
      title,
      message,
      type,
      isActive: true, // Explicitly set isActive to true
      readBy: [] // Initialize empty readBy array
    });

    await notification.save();
    console.log('Notification created successfully:', notification);

    // Keep only the latest 5 notifications, delete the rest
    const notifications = await Notification.find().sort({ createdAt: -1 });
    if (notifications.length > 5) {
      const idsToDelete = notifications.slice(5).map(n => n._id);
      await Notification.deleteMany({ _id: { $in: idsToDelete } });
    }

    res.status(201).json({ 
      success: true, 
      notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification. Please try again.' 
    });
  }
};

// Get latest active notification
exports.getLatestNotification = async (req, res) => {
  try {
    console.log('Fetching latest notification');
    const notification = await Notification.findOne({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(1)
      .populate('readBy', '_id');
    
    console.log('Latest notification found:', notification);
    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching latest notification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    // Add user to readBy array if not already there
    if (!notification.readBy.includes(userId)) {
      notification.readBy.push(userId);
      await notification.save();
    }

    res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all active notifications
exports.getActiveNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ isActive: true })
      .sort({ createdAt: -1 })
      .populate('readBy', '_id');
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all notifications (admin only)
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate('readBy', '_id');
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update notification status
exports.updateNotificationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );
    res.status(200).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}; 