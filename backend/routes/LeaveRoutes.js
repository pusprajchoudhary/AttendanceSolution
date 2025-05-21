const express = require('express');
const router = express.Router();
const Leave = require('../models/leaveModel');
const { protect, admin } = require('../middleware/authMiddleware');

// Apply for leave
router.post('/', protect, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    const leave = await Leave.create({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      reason
    });

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: 'Error applying for leave', error: error.message });
  }
});

// Get all leaves for a user
router.get('/my-leaves', protect, async (req, res) => {
  try {
    const leaves = await Leave.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
});

// Get all leaves (admin only)
router.get('/all', protect, admin, async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate('user', 'name email')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaves', error: error.message });
  }
});

// Update leave status (admin only)
router.patch('/:id', protect, admin, async (req, res) => {
  try {
    const { status, comments } = req.body;
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    leave.comments = comments;
    leave.approvedBy = req.user._id;

    const updatedLeave = await leave.save();
    res.json(updatedLeave);
  } catch (error) {
    res.status(500).json({ message: 'Error updating leave status', error: error.message });
  }
});

// Delete leave request (only pending leaves can be deleted by the user)
router.delete('/:id', protect, async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Check if the user owns this leave request or is an admin
    if (leave.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this leave request' });
    }

    // Only pending leaves can be deleted by users
    if (leave.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot delete approved or rejected leave requests' });
    }

    await leave.deleteOne();
    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting leave request', error: error.message });
  }
});

module.exports = router;
