const express = require('express');
const router = express.Router();
const Policy = require('../models/PolicyModel');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all policies (for users)
router.get('/', protect, async (req, res) => {
  try {
    const policies = await Policy.find().sort({ createdAt: -1 });
    res.json(policies);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch policies' });
  }
});

// Create a new policy (admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { title, message } = req.body;
    const policy = new Policy({
      title,
      message,
      createdBy: req.user._id
    });
    await policy.save();
    res.status(201).json(policy);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create policy' });
  }
});

// Update a policy (admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { title, message } = req.body;
    const policy = await Policy.findByIdAndUpdate(
      req.params.id,
      { title, message },
      { new: true }
    );
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json(policy);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update policy' });
  }
});

// Delete a policy (admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const policy = await Policy.findByIdAndDelete(req.params.id);
    if (!policy) return res.status(404).json({ message: 'Policy not found' });
    res.json({ message: 'Policy deleted' });
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete policy' });
  }
});

module.exports = router; 