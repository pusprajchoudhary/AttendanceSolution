const Message = require('../models/messageModel');
const User = require('../models/UserModel');

// Send a message
const sendMessage = async (req, res) => {
  try {
    const { content, receiverId } = req.body;
    const senderId = req.user._id;

    console.log('Message sending attempt:', {
      senderId,
      receiverId,
      content: content?.substring(0, 50) // Log first 50 chars of content
    });

    // Validate input
    if (!content || !receiverId) {
      console.log('Invalid input:', { content: !!content, receiverId: !!receiverId });
      return res.status(400).json({ 
        success: false,
        message: 'Content and receiver ID are required' 
      });
    }

    // Get sender details
    const sender = await User.findOne({ 
      _id: senderId,
      isBlocked: false 
    });

    console.log('Sender lookup result:', {
      found: !!sender,
      senderId,
      role: sender?.role,
      isBlocked: sender?.isBlocked,
      name: sender?.name
    });

    if (!sender) {
      return res.status(400).json({ 
        success: false,
        message: 'Your account is blocked' 
      });
    }

    // Get receiver details
    const receiver = await User.findOne({ _id: receiverId });
    console.log('Receiver lookup result:', {
      found: !!receiver,
      receiverId,
      role: receiver?.role,
      isBlocked: receiver?.isBlocked,
      name: receiver?.name
    });

    if (!receiver) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid receiver: User not found' 
      });
    }

    if (receiver.isBlocked) {
      return res.status(400).json({ 
        success: false,
        message: 'Receiver is blocked' 
      });
    }

    // Role-based validation
    if (sender.role === 'user' && receiver.role !== 'admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Users can only message admins' 
      });
    }

    if (sender.role === 'admin' && receiver.role !== 'user') {
      return res.status(400).json({ 
        success: false,
        message: 'Admins can only message users' 
      });
    }

    // Create threadId (combination of sender and receiver IDs)
    const threadId = [senderId, receiverId].sort().join('_');

    console.log('Creating message with threadId:', threadId);

    const message = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      threadId
    });

    await message.save();

    // Populate sender and receiver details
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');

    console.log('Message saved successfully:', {
      messageId: message._id,
      threadId: message.threadId,
      sender: message.sender.name,
      receiver: message.receiver.name
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages for a thread
const getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { threadId } = req.params;

    // If threadId is provided, verify user is part of the thread
    if (threadId) {
      const [user1, user2] = threadId.split('_');
      if (user1 !== userId.toString() && user2 !== userId.toString()) {
        return res.status(403).json({ message: 'Not authorized to view these messages' });
      }
    }

    // Get all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'name email')
    .populate('receiver', 'name email');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get messages by date range (for admin)
const getMessagesByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const adminId = req.user._id;

    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const query = {
      $or: [
        { sender: adminId },
        { receiver: adminId }
      ],
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };

    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .populate('sender', 'name email')
      .populate('receiver', 'name email');

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error getting messages by date:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting messages by date',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark messages as read
const markAsRead = async (req, res) => {
  try {
    const { messageIds } = req.body;
    const userId = req.user._id;

    await Message.updateMany(
      {
        _id: { $in: messageIds },
        receiver: userId
      },
      {
        $set: { isRead: true, status: 'read' }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking messages as read',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const count = await Message.countDocuments({
      receiver: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getMessagesByDate,
  markAsRead,
  getUnreadCount
}; 